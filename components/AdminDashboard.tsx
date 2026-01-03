import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  School,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  X,
  Loader2,
  AlertCircle,
  LogOut,
  RefreshCw,
  ExternalLink,
  Settings,
  Eye,
  EyeOff,
  Link2,
  FileSpreadsheet,
  FolderOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { adminApiService } from '../services/adminApi';
import { SchoolConfig } from '../types';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { logout, adminGasUrl, isAdmin, setAdminGasUrl, setCurrentSchool } = useAuth();
  const { isDemoMode, toggleDemoMode } = useAppContext();

  const [schools, setSchools] = useState<SchoolConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // 모달 상태
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // 관리자 URL 설정
  const [showUrlSetting, setShowUrlSetting] = useState(false);
  const [tempAdminUrl, setTempAdminUrl] = useState(adminGasUrl);
  const [urlSaved, setUrlSaved] = useState(false);

  // 폼 상태
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formScriptUrl, setFormScriptUrl] = useState('');
  const [formSheetUrl, setFormSheetUrl] = useState('');
  const [formDriveFolderUrl, setFormDriveFolderUrl] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 복사 상태
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // URL 표시 상태
  const [showUrls, setShowUrls] = useState(false);

  // 학교 목록 로드
  const loadSchools = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await adminApiService.getSchools(adminGasUrl, isDemoMode);
      if (result.success && Array.isArray(result.data)) {
        setSchools(result.data);
      } else {
        setError(result.message || '학교 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '학교 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnterSchool = (school: SchoolConfig) => {
    setCurrentSchool(school);
    navigate('/school/dashboard');
  };

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    loadSchools();
  }, [isAdmin, navigate, adminGasUrl, isDemoMode]);

  // 코드 복사
  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // 모달 열기/닫기
  const openAddModal = () => {
    setFormName('');
    setFormCode(adminApiService.generateSchoolCode());
    setFormScriptUrl('');
    setFormSheetUrl('');
    setFormDriveFolderUrl('');
    setFormError('');
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setFormError('');
  };

  // 학교 추가
  const handleAddSchool = async (e: React.FormEvent) => {
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
      const result = await adminApiService.addSchool(
        adminGasUrl,
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
        await loadSchools();
        closeModal();
      } else {
        setFormError(result.message || '학교 추가에 실패했습니다.');
      }
    } catch {
      setFormError('학교 추가 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 학교 수정
  // 학교 삭제
  const handleDeleteSchool = async (code: string) => {
    setIsSubmitting(true);
    try {
      const result = await adminApiService.deleteSchool(adminGasUrl, code, isDemoMode);
      if (result.success) {
        await loadSchools();
        setDeleteConfirm(null);
      } else {
        setError(result.message || '학교 삭제에 실패했습니다.');
      }
    } catch {
      setError('학교 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 로그아웃
  const handleLogout = () => {
    toggleDemoMode(false);
    logout();
    navigate('/');
  };

  const handleSaveAdminUrl = () => {
    setAdminGasUrl(tempAdminUrl.trim());
    setUrlSaved(true);
    setTimeout(() => setUrlSaved(false), 2000);
    setShowUrlSetting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Settings className="text-white" size={20} />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">관리자 대시보드</h1>
              <p className="text-xs text-gray-500">
                {isDemoMode ? '데모 모드' : '실제 모드'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setTempAdminUrl(adminGasUrl);
                setShowUrlSetting(!showUrlSetting);
              }}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="관리자 API URL 설정"
            >
              <Link2 size={18} />
              <span className="hidden sm:inline">API URL</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">로그아웃</span>
            </button>
          </div>

          {showUrlSetting && (
            <div className="absolute right-4 top-16 bg-white rounded-xl shadow-lg border border-gray-200 p-4 w-80 z-20">
              <h3 className="font-semibold text-gray-900 mb-2">관리자 API URL 설정</h3>
              <input
                type="url"
                value={tempAdminUrl}
                onChange={(e) => setTempAdminUrl(e.target.value)}
                placeholder="https://script.google.com/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveAdminUrl}
                  className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                >
                  저장
                </button>
                <button
                  onClick={() => setShowUrlSetting(false)}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
                >
                  취소
                </button>
              </div>
              {urlSaved && (
                <p className="text-xs text-green-600 mt-2">저장되었습니다.</p>
              )}
            </div>
          )}
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <School className="text-indigo-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">등록된 학교</p>
                <p className="text-2xl font-bold text-gray-900">{schools.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <ExternalLink className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">URL 연결됨</p>
                <p className="text-2xl font-bold text-gray-900">
                  {schools.filter(s => s.scriptUrl).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="text-amber-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">URL 미설정</p>
                <p className="text-2xl font-bold text-gray-900">
                  {schools.filter(s => !s.scriptUrl).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 학교 목록 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">학교 목록</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUrls(!showUrls)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {showUrls ? <EyeOff size={18} /> : <Eye size={18} />}
              <span className="hidden sm:inline">URL {showUrls ? '숨기기' : '보기'}</span>
            </button>
            <button
              onClick={loadSchools}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">새로고침</span>
            </button>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={18} />
              <span>학교 추가</span>
            </button>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* 로딩 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : schools.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <School className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 학교가 없습니다</h3>
            <p className="text-gray-500 mb-4">학교를 추가하여 시작하세요.</p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={18} />
              <span>학교 추가</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">학교 이름</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">학교 코드</th>
                    {showUrls && (
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">스크립트 URL</th>
                    )}
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">생성일</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {schools.map((school) => (
                    <tr key={school.code} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <School className="text-indigo-600" size={16} />
                          </div>
                          <span className="font-medium text-gray-900 whitespace-nowrap">{school.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                            {school.code}
                          </code>
                          <button
                            onClick={() => handleCopyCode(school.code)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title="코드 복사"
                          >
                            {copiedCode === school.code ? (
                              <Check size={16} className="text-green-500" />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                      {showUrls && (
                        <td className="px-4 py-4">
                          {school.scriptUrl ? (
                            <a
                              href={school.scriptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-indigo-600 hover:underline truncate block max-w-xs"
                            >
                              {school.scriptUrl.substring(0, 50)}...
                            </a>
                          ) : (
                            <span className="text-sm text-gray-400">미설정</span>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {school.createdAt
                          ? new Date(school.createdAt).toLocaleDateString('ko-KR')
                          : '-'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => school.sheetUrl && window.open(school.sheetUrl, '_blank', 'noopener')}
                            disabled={!school.sheetUrl}
                            className={`p-2 rounded-lg transition-colors ${school.sheetUrl ? 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50' : 'text-gray-300 cursor-not-allowed'}`}
                            title={school.sheetUrl ? '스프레드시트 열기' : '스프레드시트 미설정'}
                          >
                            <FileSpreadsheet size={16} />
                          </button>
                          <button
                            onClick={() => school.driveFolderUrl && window.open(school.driveFolderUrl, '_blank', 'noopener')}
                            disabled={!school.driveFolderUrl}
                            className={`p-2 rounded-lg transition-colors ${school.driveFolderUrl ? 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50' : 'text-gray-300 cursor-not-allowed'}`}
                            title={school.driveFolderUrl ? '이미지 폴더 열기' : '폴더 미설정'}
                          >
                            <FolderOpen size={16} />
                          </button>
                          <button
                            onClick={() => handleEnterSchool(school)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="학교 페이지로 이동"
                          >
                            <ExternalLink size={16} />
                          </button>
            <button
              onClick={() => navigate(`/admin/schools/${school.code}`)}
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="수정"
            >
              <Edit2 size={16} />
            </button>
                          {deleteConfirm === school.code ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDeleteSchool(school.code)}
                                disabled={isSubmitting}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="삭제 확인"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                                title="취소"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(school.code)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="삭제"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* 추가/수정 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                새 학교 추가
              </h3>
            </div>

            <form onSubmit={handleAddSchool}>
              <div className="p-6 space-y-4">
                {/* 학교 이름 */}
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

                {/* 학교 코드 */}
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

                {/* 스크립트 URL */}
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

                {/* 스프레드시트 URL */}
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

                {/* 구글 드라이브 폴더 URL */}
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

                {/* 에러 메시지 */}
                {formError && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle size={16} />
                    <span>{formError}</span>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      처리 중...
                    </>
                  ) : (
                    '추가하기'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
