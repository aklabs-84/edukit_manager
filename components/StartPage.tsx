import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, KeyRound, Shield, Loader2, AlertCircle, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const StartPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithCode, adminGasUrl, setAdminGasUrl, isLoading } = useAuth();

  const [schoolCode, setSchoolCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUrlSetting, setShowUrlSetting] = useState(false);
  const [tempUrl, setTempUrl] = useState(adminGasUrl);

  const isDemoMode = !adminGasUrl;

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!schoolCode.trim()) {
      setError('학교 코드를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await loginWithCode(schoolCode.trim().toUpperCase());
      if (result.success) {
        navigate('/school/dashboard');
      } else {
        setError(result.message || '유효하지 않은 학교 코드입니다.');
      }
    } catch {
      setError('학교 코드 확인 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUrlSave = () => {
    setAdminGasUrl(tempUrl);
    setShowUrlSetting(false);
  };

  const handleDemoLogin = async () => {
    // 데모 모드에서는 첫 번째 데모 코드로 자동 로그인
    setSchoolCode('DEMO001');
    setIsSubmitting(true);
    try {
      const result = await loginWithCode('DEMO001');
      if (result.success) {
        navigate('/school/dashboard');
      } else {
        setError('데모 로그인에 실패했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex flex-col">
      {/* 상단 설정 버튼 */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setShowUrlSetting(!showUrlSetting)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-lg transition-colors"
          title="API URL 설정"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* URL 설정 패널 */}
      {showUrlSetting && (
        <div className="absolute top-14 right-4 bg-white rounded-lg shadow-lg p-4 w-80 z-10">
          <h3 className="font-medium text-gray-900 mb-2">관리자 API URL 설정</h3>
          <input
            type="url"
            value={tempUrl}
            onChange={(e) => setTempUrl(e.target.value)}
            placeholder="https://script.google.com/..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
          />
          <div className="flex gap-2">
            <button
              onClick={handleUrlSave}
              className="flex-1 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
            >
              저장
            </button>
            <button
              onClick={() => setShowUrlSetting(false)}
              className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
            >
              취소
            </button>
          </div>
          {!adminGasUrl && (
            <p className="text-xs text-amber-600 mt-2">
              URL이 설정되지 않으면 데모 모드로 작동합니다.
            </p>
          )}
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* 로고 및 타이틀 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-2xl mb-4 shadow-lg">
              <Box className="text-white" size={40} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">에듀킷 매니저</h1>
            <p className="text-gray-600">학교 재고 관리 시스템</p>
            {isDemoMode && (
              <span className="inline-block mt-2 px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                데모 모드
              </span>
            )}
          </div>

          {/* 학교 코드 입력 카드 */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <KeyRound className="text-indigo-600" size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">학교 코드 입력</h2>
                <p className="text-sm text-gray-500">발급받은 코드를 입력하세요</p>
              </div>
            </div>

            <form onSubmit={handleCodeSubmit}>
              <input
                type="text"
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                placeholder="예: ABC123"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center text-lg font-mono tracking-widest uppercase focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                maxLength={10}
                disabled={isSubmitting}
              />

              {error && (
                <div className="flex items-center gap-2 mt-3 text-red-600 text-sm">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    확인 중...
                  </>
                ) : (
                  '입장하기'
                )}
              </button>
            </form>

            {isDemoMode && (
              <button
                onClick={handleDemoLogin}
                disabled={isSubmitting}
                className="w-full mt-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-xl text-sm transition-colors"
              >
                데모로 체험하기
              </button>
            )}
          </div>

          {/* 관리자 로그인 버튼 */}
          <button
            onClick={() => navigate('/admin/login')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/80 backdrop-blur text-gray-700 rounded-xl hover:bg-white transition-colors"
          >
            <Shield size={18} />
            <span>관리자 로그인</span>
          </button>

          {/* 안내 문구 */}
          <p className="text-center text-sm text-gray-500 mt-6">
            학교 코드가 없으신가요?{' '}
            <span className="text-indigo-600">관리자에게 문의하세요.</span>
          </p>
        </div>
      </div>

      {/* 푸터 */}
      <footer className="text-center py-4 text-sm text-gray-500">
        &copy; 2024 아크랩스. All rights reserved.
      </footer>
    </div>
  );
};

export default StartPage;
