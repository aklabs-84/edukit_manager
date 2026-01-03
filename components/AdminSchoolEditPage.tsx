import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { adminApiService } from '../services/adminApi';
import { SchoolConfig } from '../types';

const AdminSchoolEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const { adminGasUrl } = useAuth();
  const { isDemoMode } = useAppContext();

  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formScriptUrl, setFormScriptUrl] = useState('');
  const [formSheetUrl, setFormSheetUrl] = useState('');
  const [formDriveFolderUrl, setFormDriveFolderUrl] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [originalCode, setOriginalCode] = useState('');

  useEffect(() => {
    // React Strict Mode 중복 실행 방지
    let cancelled = false;

    const fetchSchool = async () => {
      if (!code) {
        setLoadError('잘못된 경로입니다.');
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setLoadError('');
      try {
        // getSchools 대신 verifySchoolCode 사용 (단일 학교 조회로 API 호출 최소화)
        const result = await adminApiService.verifySchoolCode(adminGasUrl, code, isDemoMode);
        if (cancelled) return;

        if (result.success && result.data && !Array.isArray(result.data)) {
          const target = result.data as SchoolConfig;
          setFormName(target.name);
          setFormCode(target.code);
          setFormScriptUrl(target.scriptUrl);
          setFormSheetUrl(target.sheetUrl || '');
          setFormDriveFolderUrl(target.driveFolderUrl || '');
          setOriginalCode(target.code);
        } else {
          setLoadError(result.message || '해당 학교를 찾을 수 없습니다.');
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError('학교 정보를 불러오는 중 오류가 발생했습니다.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };
    fetchSchool();

    return () => { cancelled = true; };
  }, [adminGasUrl, code, isDemoMode]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!formName.trim()) {
      setFormError('학교 이름을 입력해주세요.');
      return;
    }
    if (!formCode.trim()) {
      setFormError('학교 코드를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await adminApiService.updateSchool(
        adminGasUrl,
        originalCode,
        {
          name: formName.trim(),
          code: formCode.trim().toUpperCase(),
          scriptUrl: formScriptUrl.trim(),
          sheetUrl: formSheetUrl.trim(),
          driveFolderUrl: formDriveFolderUrl.trim(),
        },
        isDemoMode
      );

      if (result.success) {
        navigate('/admin');
      } else {
        setFormError(result.message || '학교 수정에 실패했습니다.');
      }
    } catch (err) {
      setFormError('학교 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
          <AlertCircle size={20} />
          <span>{loadError}</span>
        </div>
        <div className="mt-4">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            뒤로 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-100 border border-gray-200"
          aria-label="뒤로 가기"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">학교 정보 수정</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <form onSubmit={handleUpdate} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              학교 이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="예: 대건고등학교"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              학교 코드 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                placeholder="예: ABC123"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl font-mono uppercase focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                maxLength={10}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setFormCode(adminApiService.generateSchoolCode())}
                className="px-3 py-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                title="랜덤 코드 생성"
              >
                <RefreshCw size={20} />
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              학교 사용자가 입력할 접근 코드입니다.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Apps Script URL
            </label>
            <input
              type="url"
              value={formScriptUrl}
              onChange={(e) => setFormScriptUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-gray-500">
              해당 학교의 재고 데이터를 관리하는 Google Apps Script 웹앱 URL
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              스프레드시트 URL
            </label>
            <input
              type="url"
              value={formSheetUrl}
              onChange={(e) => setFormSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              이미지 폴더 (Google Drive) URL
            </label>
            <input
              type="url"
              value={formDriveFolderUrl}
              onChange={(e) => setFormDriveFolderUrl(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isSubmitting}
            />
          </div>

          {formError && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}
        </form>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleUpdate}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                처리 중...
              </>
            ) : (
              '수정하기'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSchoolEditPage;
