import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Tags, AlertCircle, Loader2 } from 'lucide-react';
import { CATEGORY_OPTIONS } from '../constants';
import { useAuth } from '../context/AuthContext';
import { adminApiService } from '../services/adminApi';
import { SchoolConfig } from '../types';

const CategoryManager: React.FC = () => {
  const { currentSchool, adminGasUrl, setCurrentSchool } = useAuth();
  const isDemoMode = !adminGasUrl;
  const schoolCode = currentSchool?.code || '';

  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isActive = true;
    if (!schoolCode) {
      setCustomCategories([]);
      return;
    }

    const loadCategories = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const result = await adminApiService.verifySchoolCode(adminGasUrl, schoolCode, isDemoMode);
        if (!isActive) return;
        if (result.success && result.data) {
          const school = result.data as SchoolConfig;
          setCustomCategories(school.categories ?? []);
          if (currentSchool?.code === school.code) {
            setCurrentSchool({ ...currentSchool, categories: school.categories ?? [] });
          }
        } else {
          setCustomCategories([]);
        }
      } catch {
        if (!isActive) return;
        setCustomCategories([]);
        setErrorMessage('카테고리를 불러오지 못했습니다.');
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadCategories();
    return () => {
      isActive = false;
    };
  }, [adminGasUrl, isDemoMode, schoolCode]);

  const handleAddCategory = async () => {
    const nextValue = newCategoryName.trim();
    if (!nextValue) return;
    const normalized = nextValue.toLowerCase();
    const exists = [...CATEGORY_OPTIONS, ...customCategories].some(
      (cat) => cat.toLowerCase() === normalized
    );
    if (exists) {
      setNewCategoryName('');
      return;
    }
    const updated = [...customCategories, nextValue];
    setCustomCategories(updated);
    setNewCategoryName('');
    setErrorMessage('');
    try {
      const result = await adminApiService.updateSchoolCategories(adminGasUrl, schoolCode, updated, isDemoMode);
      if (result.success && result.data) {
        const school = result.data as SchoolConfig;
        if (currentSchool?.code === school.code) {
          setCurrentSchool({ ...currentSchool, categories: school.categories ?? updated });
        }
      } else {
        setErrorMessage(result.message || '카테고리를 저장하지 못했습니다.');
      }
    } catch {
      setErrorMessage('카테고리를 저장하지 못했습니다.');
    }
  };

  const handleRemoveCategory = async (category: string) => {
    const updated = customCategories.filter((item) => item !== category);
    setCustomCategories(updated);
    setErrorMessage('');
    try {
      const result = await adminApiService.updateSchoolCategories(adminGasUrl, schoolCode, updated, isDemoMode);
      if (result.success && result.data) {
        const school = result.data as SchoolConfig;
        if (currentSchool?.code === school.code) {
          setCurrentSchool({ ...currentSchool, categories: school.categories ?? updated });
        }
      } else {
        setErrorMessage(result.message || '카테고리를 저장하지 못했습니다.');
      }
    } catch {
      setErrorMessage('카테고리를 저장하지 못했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">카테고리 추가</h1>
        <p className="text-gray-500 text-sm mt-1">
          기본 카테고리는 모든 학교에 공통이며, 아래에서 추가한 카테고리는 현재 학교에만 적용됩니다.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Tags size={18} className="text-indigo-600" />
          기본 카테고리
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map((category) => (
            <span
              key={category}
              className="px-3 py-1 rounded-full text-sm border bg-gray-50 text-gray-700 border-gray-200"
            >
              {category}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Tags size={18} className="text-indigo-600" />
          학교별 추가 카테고리
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            <span>카테고리를 불러오는 중...</span>
          </div>
        )}
        {errorMessage && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {customCategories.length === 0 ? (
            <span className="text-sm text-gray-400">아직 추가된 카테고리가 없습니다.</span>
          ) : (
            customCategories.map((category) => (
              <span
                key={category}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border bg-indigo-50 text-indigo-700 border-indigo-200"
              >
                {category}
                <button
                  type="button"
                  onClick={() => handleRemoveCategory(category)}
                  className="text-indigo-500 hover:text-indigo-700"
                  aria-label="카테고리 삭제"
                >
                  <Trash2 size={12} />
                </button>
              </span>
            ))
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCategory();
              }
            }}
            placeholder="카테고리 직접 추가"
            className="flex-1 min-w-[180px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
          />
          <button
            type="button"
            onClick={handleAddCategory}
            disabled={!schoolCode}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
          >
            <Plus size={16} />
            추가
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;
