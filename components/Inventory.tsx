import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { InventoryItem, ItemStatus } from '../types';
import { Search, Plus, Edit2, Trash2, Filter, AlertCircle, RefreshCw } from 'lucide-react';

const SCHOOL_OPTIONS = ['모두', '대건고', '신송고', '중산중', '신현중', '이음초'];
const CATEGORY_OPTIONS = ['마이크로보드', '로봇', '드론', '키트', '단품', '3D펜', '센서', '기타'];

const Inventory: React.FC = () => {
  const { items, isLoading, addItem, updateItem, deleteItem, isDemoMode, selectedSchool, setSelectedSchool, refreshItems } = useAppContext();
  
  // Local UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; school: string } | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageBase64, setImageBase64] = useState<string>('');
  const MAX_IMAGE_BASE64 = 1_200_000; // ~1.2MB

  // Filter logic
  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  // Form State
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: '',
    category: '',
    quantity: 0,
    location: '',
    status: ItemStatus.IN_STOCK,
    school: selectedSchool,
    notes: '',
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: '',
      quantity: 0,
      location: '',
      status: ItemStatus.IN_STOCK,
      school: selectedSchool === '모두' ? '대건고' : selectedSchool,
      notes: '',
      imageUrl: '',
    });
    setSelectedCategories([]);
    setImagePreview('');
    setImageBase64('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setSelectedCategories(item.category ? item.category.split(',').map(c => c.trim()).filter(Boolean) : []);
    setImagePreview(item.imageUrl || '');
    setImageBase64('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || selectedCategories.length === 0) return;

    const categoryValue = selectedCategories.join(', ');
    const payload = { ...formData, category: categoryValue, imageBase64 } as InventoryItem;

    try {
      setIsSaving(true);
      if (editingItem) {
        await updateItem({ ...editingItem, ...payload });
      } else {
        await addItem(payload);
      }
      setIsModalOpen(false);
    } catch (error) {
      alert("항목 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (item: InventoryItem) => {
    setItemToDelete({ id: item.id, school: item.school });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      await deleteItem(itemToDelete.id, itemToDelete.school);
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas not supported'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.8);
          resolve(compressed);
        };
        img.onerror = reject;
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">재고 관리</h1>
            <p className="text-gray-500 text-sm">교육용 교구를 관리하고 추적하세요.</p>
          </div>
          <button 
            onClick={() => refreshItems(selectedSchool)}
            disabled={isLoading}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
            title="데이터 새로고침"
          >
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          교구 추가
        </button>
      </div>

      {/* School Selector */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 sm:items-center">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">학교 선택</span>
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={selectedSchool}
            onChange={async (e) => {
              const newSchool = e.target.value;
              setSelectedSchool(newSchool);
              await refreshItems(newSchool);
            }}
          >
            {SCHOOL_OPTIONS.map((school) => (
              <option key={school} value={school}>{school}</option>
            ))}
          </select>
        </div>
        <p className="text-xs text-gray-400">학교별로 시트가 분리되며, '모두'는 전체 학교 데이터를 조회합니다.</p>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="이름, 카테고리, 위치로 검색..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 text-gray-500 border-l pl-4 border-gray-200 hidden sm:flex">
          <Filter size={18} />
          <span className="text-sm font-medium">{filteredItems.length}개 항목 발견</span>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center text-gray-500">재고 불러오는 중...</div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center text-gray-500">검색 결과가 없습니다.</div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-gray-500">교구명</div>
                  <div className="text-base font-semibold text-gray-900">{item.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{item.school}</div>
                </div>
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-lg object-cover border" loading="lazy" />
                )}
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border
                  ${item.status === ItemStatus.IN_STOCK ? 'bg-green-50 text-green-700 border-green-200' :
                    item.status === ItemStatus.LOW_STOCK ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-red-50 text-red-700 border-red-200'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    item.status === ItemStatus.IN_STOCK ? 'bg-green-500' :
                    item.status === ItemStatus.LOW_STOCK ? 'bg-amber-500' : 'bg-red-500'
                  }`}></span>
                  {item.status}
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {item.category.split(',').map((cat) => (
                  <span key={cat} className="bg-indigo-50 text-indigo-700 py-1 px-2 rounded text-xs font-medium">
                    {cat.trim()}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                <div>
                  <div className="text-xs text-gray-500">위치</div>
                  <div>{item.location}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">수량</div>
                  <div className="font-mono text-gray-900">{item.quantity}</div>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <span className="text-xs text-gray-500">기타 사항</span><br />
                {item.notes || '-'}
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button 
                  onClick={() => handleOpenEdit(item)}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteClick(item)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 font-semibold uppercase text-xs tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">교구명</th>
                <th className="px-6 py-4">학교</th>
                <th className="px-6 py-4">이미지</th>
                <th className="px-6 py-4">카테고리</th>
                <th className="px-6 py-4">위치</th>
                <th className="px-6 py-4">기타 사항</th>
                <th className="px-6 py-4">상태</th>
                <th className="px-6 py-4 text-right">수량</th>
                <th className="px-6 py-4 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">재고 불러오는 중...</td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">검색 결과가 없습니다.</td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-gray-700">{item.school}</td>
                    <td className="px-6 py-4">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-14 h-14 object-cover rounded-lg border" loading="lazy" />
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {item.category.split(',').map((cat) => (
                          <span key={cat} className="bg-indigo-50 text-indigo-700 py-1 px-2 rounded text-xs font-medium">
                            {cat.trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">{item.location}</td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs">{item.notes || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border
                        ${item.status === ItemStatus.IN_STOCK ? 'bg-green-50 text-green-700 border-green-200' :
                          item.status === ItemStatus.LOW_STOCK ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }
                      `}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          item.status === ItemStatus.IN_STOCK ? 'bg-green-500' :
                          item.status === ItemStatus.LOW_STOCK ? 'bg-amber-500' : 'bg-red-500'
                        }`}></span>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-gray-900">{item.quantity}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(item)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingItem ? '교구 수정' : '새 교구 추가'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">교구명</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">학교</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.school}
                  onChange={e => setFormData({ ...formData, school: e.target.value })}
                >
                  {SCHOOL_OPTIONS.map((school) => (
                    <option key={school} value={school}>{school}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">카테고리 (복수 선택)</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_OPTIONS.map(cat => {
                      const active = selectedCategories.includes(cat);
                      return (
                        <button
                          type="button"
                          key={cat}
                          onClick={() => {
                            setSelectedCategories(active ? selectedCategories.filter(c => c !== cat) : [...selectedCategories, cat]);
                          }}
                          className={`
                            px-3 py-1 rounded-full text-sm border transition-colors
                            ${active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}
                          `}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">여러 카테고리를 모두 선택하세요.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">위치</label>
                  <input
                    type="text"
                    required
                    placeholder="예: 선반 A"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">수량</label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.quantity}
                    onChange={e => {
                      const qty = parseInt(e.target.value) || 0;
                      let status = ItemStatus.IN_STOCK;
                      if (qty === 0) status = ItemStatus.OUT_OF_STOCK;
                      else if (qty < 10) status = ItemStatus.LOW_STOCK;
                      setFormData({ ...formData, quantity: qty, status });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">기타 사항</label>
                  <input
                    type="text"
                    placeholder="전달사항을 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  />
                  <p className="text-xs text-gray-400 mt-1">수량에 따라 상태는 자동 계산됩니다.</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이미지 업로드</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) {
                        alert('이미지 용량이 2MB를 초과합니다. 더 작은 파일을 선택해주세요.');
                        e.target.value = '';
                        return;
                      }
                      try {
                        const resized = await resizeImage(file, 800, 800);
                        if (resized.length > MAX_IMAGE_BASE64) {
                          alert('이미지 용량이 큽니다. 해상도를 더 줄이거나 다른 이미지를 선택해주세요.');
                          setImagePreview('');
                          setImageBase64('');
                          e.target.value = '';
                          return;
                        }
                        setImagePreview(resized);
                        setImageBase64(resized);
                      } catch (err) {
                        alert('이미지 처리에 실패했습니다. 다른 파일을 시도해주세요.');
                      }
                    }}
                  />
                  {imagePreview && (
                    <img src={imagePreview} alt="미리보기" className="w-16 h-16 rounded-lg object-cover border" />
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">카메라 촬영 또는 갤러리에서 선택해 업로드할 수 있습니다.</p>
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium inline-flex items-center gap-2 ${isSaving ? 'opacity-80 cursor-not-allowed' : ''}`}
                >
                  {isSaving && <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>}
                  {isSaving ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="text-red-600" size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">삭제하시겠습니까?</h3>
            <p className="text-gray-500 mt-2 mb-6">정말로 이 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
            <div className="flex justify-center gap-3">
               <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                >
                  삭제
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
