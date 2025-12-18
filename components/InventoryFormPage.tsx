import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Upload, X } from 'lucide-react';
import { CATEGORY_OPTIONS, DEFAULT_SCHOOL } from '../constants';
import { InventoryItem, ItemStatus } from '../types';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const MAX_IMAGE_SIZE = 3 * 1024 * 1024; // 3MB

const InventoryFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { addItem, isDemoMode, selectedSchool, gasUrl } = useAppContext();
  const { currentSchool } = useAuth();

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

  const effectiveSchool = useMemo(
    () => currentSchool?.name || (selectedSchool === '모두' ? DEFAULT_SCHOOL : selectedSchool),
    [currentSchool?.name, selectedSchool]
  );

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
                {CATEGORY_OPTIONS.map((cat) => {
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
              <input
                type="text"
                placeholder="예: 선반 A"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${validationErrors.location ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                value={formData.location}
                onChange={(e) => {
                  setFormData({ ...formData, location: e.target.value });
                  if (validationErrors.location) setValidationErrors({ ...validationErrors, location: '' });
                }}
              />
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
                      <span className="text-sm text-gray-600">파일 선택</span>
                    </>
                  )}
                </button>
                <span className="text-xs text-gray-400">또는 URL 직접 입력</span>
              </div>

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
