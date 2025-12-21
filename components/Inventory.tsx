import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation as useRouterLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { InventoryItem, ItemStatus } from '../types';
import { Search, Plus, Edit2, Trash2, Filter, AlertCircle, RefreshCw, Upload, Image as ImageIcon, X, ChevronDown, ChevronUp, MapPin, ChevronRight } from 'lucide-react';
import { CATEGORY_OPTIONS, DEFAULT_SCHOOL } from '../constants';
import { apiService } from '../services/api';
import { adminApiService } from '../services/adminApi';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

// 구글 드라이브 URL을 img 태그에서 표시 가능한 형식으로 변환
const convertGoogleDriveUrl = (url: string): string => {
  if (!url) return '';

  // 이미 lh3 형식이면 그대로 반환
  if (url.includes('lh3.googleusercontent.com')) {
    return url;
  }

  // drive.google.com/uc?export=view&id=FILE_ID 형식
  const ucMatch = url.match(/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/);
  if (ucMatch) {
    return `https://lh3.googleusercontent.com/d/${ucMatch[1]}`;
  }

  // drive.google.com/file/d/FILE_ID/view 형식
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) {
    return `https://lh3.googleusercontent.com/d/${fileMatch[1]}`;
  }

  // drive.google.com/open?id=FILE_ID 형식
  const openMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (openMatch) {
    return `https://lh3.googleusercontent.com/d/${openMatch[1]}`;
  }

  return url;
};

const Inventory: React.FC = () => {
  const navigate = useNavigate();
  const location = useRouterLocation();
  const { items, isLoading, isInitialized, addItem, updateItem, deleteItem, isDemoMode, selectedSchool, refreshItems, gasUrl } = useAppContext();
  const { currentSchool, adminGasUrl } = useAuth();
  const { locationData } = useLocation();
  const isAdminDemoMode = !adminGasUrl;
  const schoolCode = currentSchool?.code || '';

  // 단계별 위치 선택 상태
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [selectedShelfId, setSelectedShelfId] = useState<string>('');
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  // 선택된 교실, 선반 데이터
  const selectedRoom = locationData.rooms.find(r => r.id === selectedRoomId);
  const selectedShelf = selectedRoom?.shelves.find(s => s.id === selectedShelfId);

  // Local UI State
  const initialSearchTerm = new URLSearchParams(location.search).get('q') ?? '';
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; school: string } | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>(() => currentSchool?.categories ?? []);
  const [isSaving, setIsSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [viewingImage, setViewingImage] = useState<string | null>(null); // 이미지 뷰어 모달
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Filter logic
  const filteredItems = useMemo(() => {
    const byLatest = [...items].sort(
      (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );

    return byLatest.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  useEffect(() => {
    const q = new URLSearchParams(location.search).get('q') ?? '';
    setSearchTerm(q);
  }, [location.search]);

  // Form State
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: '',
    category: '',
    quantity: undefined,
    location: '',
    status: ItemStatus.IN_STOCK,
    school: selectedSchool,
    notes: '',
  });

  // 학교 사용자는 자기 학교만, 그 외에는 선택된 학교
  const effectiveSchool = currentSchool?.name || (selectedSchool === '모두' ? DEFAULT_SCHOOL : selectedSchool);
  const allCategories = useMemo(() => {
    const merged = [...CATEGORY_OPTIONS, ...customCategories];
    return Array.from(new Set(merged));
  }, [customCategories]);

  useEffect(() => {
    setCustomCategories(currentSchool?.categories ?? []);
  }, [currentSchool?.code]);

  useEffect(() => {
    let isActive = true;
    if (!schoolCode) {
      setCustomCategories([]);
      return;
    }

    const loadCategories = async () => {
      try {
        const result = await adminApiService.verifySchoolCode(adminGasUrl, schoolCode, isAdminDemoMode);
        if (!isActive) return;
        if (result.success && result.data) {
          const school = result.data as { categories?: string[] };
          setCustomCategories(school.categories ?? []);
        } else {
          setCustomCategories([]);
        }
      } catch {
        if (!isActive) return;
        setCustomCategories([]);
      }
    };

    loadCategories();
    return () => {
      isActive = false;
    };
  }, [adminGasUrl, isAdminDemoMode, schoolCode]);


  const currentLocation = useMemo(() => {
    if (!selectedRoomId) return '';
    const room = locationData.rooms.find(r => r.id === selectedRoomId);
    if (!room) return '';
    let locationStr = room.name;
    if (selectedShelfId) {
      const shelf = room.shelves.find(s => s.id === selectedShelfId);
      if (shelf) {
        locationStr += `/${shelf.name}`;
        if (selectedSlotId) {
          const slot = shelf.slots.find(sl => sl.id === selectedSlotId);
          if (slot) {
            locationStr += `-${slot.name}`;
          }
        }
      }
    }
    return locationStr;
  }, [selectedRoomId, selectedShelfId, selectedSlotId, locationData]);

  // 위치 선택 시 location 문자열 생성
  useEffect(() => {
    // 모달이 열려있지 않으면 무시
    if (!isModalOpen) return;

    const locationValue = selectedLocations.length > 0 ? selectedLocations.join(', ') : currentLocation;
    setFormData(prev => ({ ...prev, location: locationValue }));
    if (locationValue && validationErrors.location) {
      setValidationErrors(prev => ({ ...prev, location: '' }));
    }
  }, [selectedLocations, currentLocation, validationErrors.location, isModalOpen]);

  const handleAddLocation = () => {
    if (!currentLocation) return;
    setSelectedLocations(prev => (prev.includes(currentLocation) ? prev : [...prev, currentLocation]));
    setSelectedRoomId('');
    setSelectedShelfId('');
    setSelectedSlotId('');
  };

  const handleRemoveLocation = (location: string) => {
    setSelectedLocations(prev => prev.filter(item => item !== location));
  };

  // 이미지 파일 선택 핸들러
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');

    // 파일 크기 체크
    if (file.size > MAX_IMAGE_SIZE) {
      setUploadError(`이미지 크기가 너무 큽니다. (최대 5MB, 현재 ${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      return;
    }

    // 이미지 타입 체크
    if (!file.type.startsWith('image/')) {
      setUploadError('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    setIsUploading(true);

    try {
      // 파일을 base64로 변환
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // API를 통해 Google Drive에 업로드
      const result = await apiService.uploadImage(gasUrl, isDemoMode, base64, file.name);

      if (result.success && result.url) {
        setFormData({ ...formData, imageUrl: result.url });
        setImagePreview(result.url);
        setUploadError('');
      } else {
        setUploadError(result.message || '이미지 업로드에 실패했습니다.');
      }
    } catch (error) {
      setUploadError('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
      // 같은 파일 다시 선택 가능하도록 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleOpenAdd = () => {
    navigate('/school/inventory/new');
  };

  const handleOpenEdit = (item: InventoryItem) => {
    navigate(`/school/inventory/${item.id}/edit`, { state: { school: item.school } });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name?.trim()) errors.name = '교구명을 입력하세요.';
    if (selectedCategories.length === 0) errors.categories = '카테고리를 선택하세요.';
    if (!formData.location?.trim()) errors.location = '위치를 입력하세요.';
    if (formData.quantity === undefined || formData.quantity === null || isNaN(formData.quantity)) {
      errors.quantity = '수량을 입력하세요.';
    } else if (formData.quantity < 0) {
      errors.quantity = '수량은 0 이상이어야 합니다.';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const categoryValue = selectedCategories.join(', ');

    // imageUrl 직접 입력 방식 사용
    const payload: Partial<InventoryItem> = {
      ...formData,
      category: categoryValue,
      imageUrl: formData.imageUrl || '',
    };

    try {
      setIsSaving(true);
      if (editingItem) {
        await updateItem({ ...editingItem, ...payload } as InventoryItem);
      } else {
        await addItem(payload as InventoryItem);
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

  const toggleCard = (id: string) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (isLoading || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4 bg-white/80 backdrop-blur rounded-2xl px-6 py-8 shadow-sm border border-gray-100">
          <RefreshCw size={28} className="animate-spin text-indigo-600" />
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-800">재고 데이터를 불러오는 중</p>
            <p className="text-sm text-gray-500">잠시만 기다려주세요...</p>
          </div>
        </div>
      </div>
    );
  }

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

      {/* School Info - 학교 사용자에게는 현재 학교 정보만 표시 */}
      {currentSchool && (
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-center gap-3">
          <span className="text-sm font-medium text-indigo-700">
            현재 학교: <span className="font-bold">{currentSchool.name}</span>
          </span>
        </div>
      )}

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
          filteredItems.map((item) => {
            const expanded = !!expandedCards[item.id];
            return (
              <div key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <button
                  type="button"
                  onClick={() => toggleCard(item.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="text-sm text-gray-500">교구명</div>
                      <div className="text-base font-semibold text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{item.school}</div>
                    </div>
                    <div className="text-gray-400">
                      {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.category.split(',').map((cat) => (
                      <span key={cat} className="bg-indigo-50 text-indigo-700 py-1 px-2 rounded text-xs font-medium">
                        {cat.trim()}
                      </span>
                    ))}
                  </div>
                </button>

                {expanded && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
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
                      {item.imageUrl ? (
                        <button
                          type="button"
                          onClick={() => setViewingImage(item.imageUrl || null)}
                          className="text-xs text-indigo-600 underline"
                        >
                          이미지 보기
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">이미지 없음</span>
                      )}
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
                )}
              </div>
            );
          })
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
                    <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{item.school}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.imageUrl ? (
                        <button
                          type="button"
                          onClick={() => setViewingImage(item.imageUrl || null)}
                          className="inline-flex items-center px-3 py-1 text-sm text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 whitespace-nowrap"
                        >
                          이미지 보기
                        </button>
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
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-fade-in relative flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[90vh] overflow-hidden">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingItem ? '교구 수정' : '새 교구 추가'}
            </h2>
            <form onSubmit={handleSave} className="flex-1 flex flex-col gap-4 overflow-hidden">
              <div className="flex-1 space-y-4 overflow-y-auto pr-1 -mr-1 pb-4 scroll-smooth overscroll-contain">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">교구명</label>
                  <input
                    type="text"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none ${validationErrors.name ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                    value={formData.name}
                    placeholder="교구명을 입력하세요"
                    onChange={e => {
                      setFormData({ ...formData, name: e.target.value });
                      if (validationErrors.name) setValidationErrors({ ...validationErrors, name: '' });
                    }}
                  />
                  {validationErrors.name && <p className="text-xs text-red-500 mt-1">{validationErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">학교</label>
                  <input
                    type="text"
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                    value={formData.school || effectiveSchool}
                  />
                  <p className="text-xs text-gray-400 mt-1">현재 접속한 학교로 자동 설정됩니다.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">카테고리 (복수 선택)</label>
                    <div className="flex flex-wrap gap-2">
                      {allCategories.map(cat => {
                        const active = selectedCategories.includes(cat);
                        return (
                          <button
                            type="button"
                            key={cat}
                            onClick={() => {
                              const next = active ? selectedCategories.filter(c => c !== cat) : [...selectedCategories, cat];
                              setSelectedCategories(next);
                              if (next.length > 0 && validationErrors.categories) {
                                setValidationErrors({ ...validationErrors, categories: '' });
                              }
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
                    <p className={`text-xs mt-1 ${validationErrors.categories ? 'text-red-500' : 'text-gray-400'}`}>
                      {validationErrors.categories || '여러 카테고리를 모두 선택하세요.'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">위치</label>
                    {locationData.rooms.length > 0 ? (
                      <div className="space-y-2">
                        {/* 선택된 위치 표시 */}
                        {selectedLocations.length > 0 && (
                          <div className="flex items-start gap-2 p-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                            <MapPin size={14} className="text-indigo-600 mt-0.5" />
                            <div className="flex flex-wrap gap-2 flex-1">
                              {selectedLocations.map((location) => (
                                <span
                                  key={location}
                                  className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs text-indigo-700 border border-indigo-200"
                                >
                                  {location}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveLocation(location)}
                                    className="text-indigo-500 hover:text-indigo-700"
                                    aria-label="선택 위치 삭제"
                                  >
                                    <X size={12} />
                                  </button>
                                </span>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedLocations([])}
                              className="text-xs text-indigo-600 hover:underline whitespace-nowrap"
                            >
                              전체 삭제
                            </button>
                          </div>
                        )}

                        {selectedLocations.length === 0 && currentLocation && (
                          <div className="flex items-center gap-2 p-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                            <MapPin size={14} className="text-indigo-600" />
                            <span className="text-sm text-indigo-700 font-medium truncate">{currentLocation}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRoomId('');
                                setSelectedShelfId('');
                                setSelectedSlotId('');
                              }}
                              className="ml-auto p-1 hover:bg-indigo-100 rounded flex-shrink-0"
                            >
                              <X size={14} className="text-indigo-500" />
                            </button>
                          </div>
                        )}

                        {/* 단계별 선택 UI */}
                        <div className={`space-y-2 ${validationErrors.location ? 'p-2 border border-red-300 rounded-lg bg-red-50/50' : ''}`}>
                          {/* 1단계: 교실 선택 */}
                          <div className="relative">
                            <select
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white pr-10 text-sm"
                              value={selectedRoomId}
                              onChange={(e) => {
                                setSelectedRoomId(e.target.value);
                                setSelectedShelfId('');
                                setSelectedSlotId('');
                              }}
                            >
                              <option value="">교실/장소 선택</option>
                              {locationData.rooms.map((room) => (
                                <option key={room.id} value={room.id}>
                                  {room.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>

                          {/* 2단계: 선반 선택 */}
                          {selectedRoom && selectedRoom.shelves.length > 0 && (
                            <div className="flex items-center gap-2">
                              <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                              <div className="relative flex-1">
                                <select
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white pr-10 text-sm"
                                  value={selectedShelfId}
                                  onChange={(e) => {
                                    setSelectedShelfId(e.target.value);
                                    setSelectedSlotId('');
                                  }}
                                >
                                  <option value="">선반 선택 (선택사항)</option>
                                  {selectedRoom.shelves.map((shelf) => (
                                    <option key={shelf.id} value={shelf.id}>
                                      {shelf.name}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                              </div>
                            </div>
                          )}

                          {/* 3단계: 칸 선택 */}
                          {selectedShelf && selectedShelf.slots.length > 0 && (
                            <div className="flex items-center gap-2">
                              <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                              <ChevronRight size={16} className="text-gray-400 flex-shrink-0 -ml-1" />
                              <div className="relative flex-1">
                                <select
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white pr-10 text-sm"
                                  value={selectedSlotId}
                                  onChange={(e) => setSelectedSlotId(e.target.value)}
                                >
                                  <option value="">칸 선택 (선택사항)</option>
                                  {selectedShelf.slots.map((slot) => (
                                    <option key={slot.id} value={slot.id}>
                                      {slot.name}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                              </div>
                            </div>
                          )}
                        </div>

                        {currentLocation && (
                          <button
                            type="button"
                            onClick={handleAddLocation}
                            className="text-xs text-indigo-600 hover:underline"
                          >
                            + 현재 위치 추가
                          </button>
                        )}

                        <p className="text-xs text-gray-400">
                          <Link to="/school/locations" className="text-indigo-600 hover:underline">위치 관리</Link>에서 새 위치 추가
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
                        <MapPin size={20} className="mx-auto mb-1 text-gray-400" />
                        <p className="text-xs text-gray-600 mb-1">등록된 위치가 없습니다.</p>
                        <Link
                          to="/school/locations"
                          className="text-xs text-indigo-600 hover:underline"
                        >
                          위치 먼저 등록하기
                        </Link>
                      </div>
                    )}
                    {validationErrors.location && <p className="text-xs text-red-500 mt-1">{validationErrors.location}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">수량</label>
                    <input
                    type="number"
                    min="0"
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${validationErrors.quantity ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                    value={formData.quantity ?? ''}
                    placeholder="수량을 입력하세요"
                    onChange={e => {
                      const value = e.target.value;
                      const qty = value === '' ? undefined : parseInt(value, 10);
                      setFormData({ ...formData, quantity: qty });
                      if (validationErrors.quantity) setValidationErrors({ ...validationErrors, quantity: '' });
                    }}
                  />
                    {validationErrors.quantity && <p className="text-xs text-red-500 mt-1">{validationErrors.quantity}</p>}
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
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                  <div className="flex flex-wrap gap-2">
                    {[ItemStatus.IN_STOCK, ItemStatus.LOW_STOCK, ItemStatus.OUT_OF_STOCK].map(status => (
                      <button
                        type="button"
                        key={status}
                        onClick={() => setFormData({ ...formData, status })}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                          formData.status === status
                            ? status === ItemStatus.IN_STOCK ? 'bg-green-600 text-white border-green-600'
                              : status === ItemStatus.LOW_STOCK ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-red-600 text-white border-red-600'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이미지</label>
                  <div className="flex flex-col gap-3">
                    {/* 파일 업로드 버튼 */}
                    <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className={`flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isUploading ? (
                          <>
                            <span className="w-4 h-4 border-2 border-gray-400 border-t-indigo-600 rounded-full animate-spin"></span>
                            <span className="text-sm text-gray-600">업로드 중...</span>
                          </>
                        ) : (
                          <>
                            <Upload size={16} className="text-gray-500" />
                            <span className="text-sm text-gray-600">사진 촬영</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        disabled={isUploading}
                        className={`flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Upload size={16} className="text-gray-500" />
                        <span className="text-sm text-gray-600">사진 선택</span>
                      </button>
                    </div>
                    <p className="text-xs text-gray-400">
                      촬영 거리나 조명에 따라 파일 크기가 더 커질 수 있어요. 용량이 큰 경우 업로드가 제한될 수 있습니다.
                    </p>

                    {/* URL 직접 입력 */}
                    <input
                      type="url"
                      placeholder="이미지 URL을 입력하세요"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${validationErrors.image ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                    value={formData.imageUrl || ''}
                    onChange={e => {
                      setFormData({ ...formData, imageUrl: e.target.value });
                      setImagePreview(e.target.value);
                      setUploadError('');
                      if (validationErrors.image) setValidationErrors({ ...validationErrors, image: '' });
                    }}
                  />
                  {validationErrors.image && <p className="text-xs text-red-500 mt-1">{validationErrors.image}</p>}

                    {/* 에러 메시지 */}
                    {uploadError && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                        <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                        <span className="text-xs text-red-600">{uploadError}</span>
                      </div>
                    )}

                    {/* 이미지 미리보기 */}
                    {imagePreview && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <img
                          src={imagePreview}
                          alt="미리보기"
                          className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-green-600 block">이미지 설정됨</span>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{formData.imageUrl}</p>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, imageUrl: '' });
                              setImagePreview('');
                            }}
                            className="text-xs text-red-500 hover:text-red-700 mt-1 flex items-center gap-1"
                          >
                            <X size={12} />
                            삭제
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    파일을 직접 업로드하거나 구글 드라이브 URL을 입력하세요. (최대 5MB)
                  </p>
                </div>
              </div>

              <div className="sticky bottom-0 left-0 right-0 flex justify-end gap-3 pt-4 pb-2 border-t border-gray-100 bg-white">
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

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              onClick={() => setViewingImage(null)}
              className="absolute -top-10 right-2 sm:-top-12 sm:right-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-2 text-sm sm:text-base font-semibold text-gray-900 shadow-lg ring-1 ring-black/10 hover:bg-white"
            >
              <X size={16} />
              <span className="hidden sm:inline">닫기</span>
            </button>
            <img
              src={convertGoogleDriveUrl(viewingImage)}
              alt="이미지 상세보기"
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
