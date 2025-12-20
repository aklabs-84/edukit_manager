import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Upload, X, ChevronDown, MapPin, ChevronRight } from 'lucide-react';
import { CATEGORY_OPTIONS, DEFAULT_SCHOOL } from '../constants';
import { InventoryItem, ItemStatus } from '../types';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { apiService } from '../services/api';
import { adminApiService } from '../services/adminApi';

const MAX_IMAGE_SIZE = 3 * 1024 * 1024; // 3MB

const InventoryFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { addItem, isDemoMode, selectedSchool, gasUrl } = useAppContext();
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

  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: '',
    category: '',
    quantity: undefined,
    location: '',
    status: ItemStatus.IN_STOCK,
    school: currentSchool?.name || (selectedSchool === '모두' ? DEFAULT_SCHOOL : selectedSchool),
    notes: '',
    imageUrl: '',
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const effectiveSchool = useMemo(
    () => currentSchool?.name || (selectedSchool === '모두' ? DEFAULT_SCHOOL : selectedSchool),
    [currentSchool?.name, selectedSchool]
  );
  const [customCategories, setCustomCategories] = useState<string[]>(() => currentSchool?.categories ?? []);
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
    const locationValue = selectedLocations.length > 0 ? selectedLocations.join(', ') : currentLocation;
    setFormData(prev => ({ ...prev, location: locationValue }));
    if (locationValue && validationErrors.location) {
      setValidationErrors(prev => ({ ...prev, location: '' }));
    }
  }, [selectedLocations, currentLocation, validationErrors.location]);

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
    if (!formData.imageUrl?.trim()) errors.image = '이미지를 등록하세요.';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');

    if (file.size > MAX_IMAGE_SIZE) {
      setUploadError(`이미지 크기가 너무 큽니다. (최대 3MB, 현재 ${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setUploadError('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    setIsUploading(true);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const result = await apiService.uploadImage(gasUrl, isDemoMode, base64, file.name);

      if (result.success && result.url) {
        setFormData({ ...formData, imageUrl: result.url });
        setImagePreview(result.url);
        setUploadError('');
        if (validationErrors.image) setValidationErrors({ ...validationErrors, image: '' });
      } else {
        setUploadError(result.message || '이미지 업로드에 실패했습니다.');
      }
    } catch (error) {
      setUploadError('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload: Partial<InventoryItem> = {
      ...formData,
      category: selectedCategories.join(', '),
      imageUrl: formData.imageUrl || '',
      school: effectiveSchool,
    };

    try {
      setIsSaving(true);
      await addItem(payload as InventoryItem);
      navigate('/school/inventory');
    } catch (err) {
      setUploadError('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div className="min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-6rem)]">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-100 border border-gray-200"
          aria-label="뒤로 가기"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">새 교구 추가</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">교구명</label>
            <input
              type="text"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none ${validationErrors.name ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              placeholder="교구명을 입력하세요"
              value={formData.name}
              onChange={(e) => {
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
              value={effectiveSchool}
            />
            <p className="text-xs text-gray-400 mt-1">현재 접속한 학교로 자동 설정됩니다.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">카테고리 (복수 선택)</label>
              <div className="flex flex-wrap gap-2">
                {allCategories.map((cat) => {
                  const active = selectedCategories.includes(cat);
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => {
                        const next = active ? selectedCategories.filter((c) => c !== cat) : [...selectedCategories, cat];
                        setSelectedCategories(next);
                        if (next.length > 0 && validationErrors.categories) {
                          setValidationErrors({ ...validationErrors, categories: '' });
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
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
                      <span className="text-sm text-indigo-700 font-medium">{currentLocation}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRoomId('');
                          setSelectedShelfId('');
                          setSelectedSlotId('');
                        }}
                        className="ml-auto p-1 hover:bg-indigo-100 rounded"
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
                    <Link to="/school/locations" className="text-indigo-600 hover:underline">위치 관리</Link>에서 새 위치를 추가할 수 있습니다.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                  <MapPin size={24} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-2">등록된 위치가 없습니다.</p>
                  <Link
                    to="/school/locations"
                    className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    <MapPin size={14} />
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
                placeholder="수량을 입력하세요"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${validationErrors.quantity ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                value={formData.quantity ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  const qty = value === '' ? undefined : parseInt(value, 10);
                  setFormData({ ...formData, quantity: qty });
                  if (validationErrors.quantity) setValidationErrors({ ...validationErrors, quantity: '' });
                }}
              />
              {validationErrors.quantity && <p className="text-xs text-red-500 mt-1">{validationErrors.quantity}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
              <div className="flex flex-wrap gap-2">
                {[ItemStatus.IN_STOCK, ItemStatus.LOW_STOCK, ItemStatus.OUT_OF_STOCK].map((status) => (
                  <button
                    type="button"
                    key={status}
                    onClick={() => setFormData({ ...formData, status })}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      formData.status === status
                        ? status === ItemStatus.IN_STOCK
                          ? 'bg-green-600 text-white border-green-600'
                          : status === ItemStatus.LOW_STOCK
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-red-600 text-white border-red-600'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">기타 사항</label>
            <input
              type="text"
              placeholder="전달사항을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이미지</label>
            <div className="flex flex-col gap-3">
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

              <input
                type="url"
                placeholder="이미지 URL을 입력하세요"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${validationErrors.image ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                value={formData.imageUrl || ''}
                onChange={(e) => {
                  setFormData({ ...formData, imageUrl: e.target.value });
                  setImagePreview(e.target.value);
                  setUploadError('');
                  if (validationErrors.image) setValidationErrors({ ...validationErrors, image: '' });
                }}
              />
              {validationErrors.image && <p className="text-xs text-red-500 mt-1">{validationErrors.image}</p>}

              {uploadError && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                  <span className="text-xs text-red-600">{uploadError}</span>
                </div>
              )}

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
            <p className="text-xs text-gray-400 mt-2">파일을 직접 업로드하거나 구글 드라이브 URL을 입력하세요. (최대 3MB)</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate(-1)}
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
  );
};

export default InventoryFormPage;
