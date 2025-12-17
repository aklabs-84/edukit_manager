import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Shield, Loader2, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { loginAsAdmin, adminGasUrl, isLoading } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDemoMode = !adminGasUrl;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await loginAsAdmin(username.trim(), password);
      if (result.success) {
        navigate('/admin');
      } else {
        setError(result.message || '로그인에 실패했습니다.');
      }
    } catch {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-white" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col">
      {/* 뒤로가기 버튼 */}
      <div className="absolute top-4 left-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-3 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
          <span>돌아가기</span>
        </button>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* 로고 및 타이틀 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur rounded-2xl mb-4">
              <Shield className="text-white" size={40} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">관리자 로그인</h1>
            <p className="text-white/60">에듀킷 매니저 관리자 페이지</p>
            {isDemoMode && (
              <span className="inline-block mt-2 px-2 py-1 bg-amber-500/20 text-amber-300 text-xs rounded-full">
                데모 모드 (admin / admin123)
              </span>
            )}
          </div>

          {/* 로그인 폼 */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* 아이디 입력 */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">
                    아이디
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="관리자 아이디"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    disabled={isSubmitting}
                    autoComplete="username"
                  />
                </div>

                {/* 비밀번호 입력 */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">
                    비밀번호
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="비밀번호"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors pr-12"
                      disabled={isSubmitting}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 mt-4 text-red-400 text-sm">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-6 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    로그인 중...
                  </>
                ) : (
                  <>
                    <Shield size={20} />
                    로그인
                  </>
                )}
              </button>
            </form>
          </div>

          {/* 안내 문구 */}
          <p className="text-center text-sm text-white/50 mt-6">
            관리자 계정이 없으신가요?{' '}
            <span className="text-indigo-400">시스템 관리자에게 문의하세요.</span>
          </p>
        </div>
      </div>

      {/* 푸터 */}
      <footer className="text-center py-4 text-sm text-white/40">
        <div className="flex items-center justify-center gap-2">
          <Box size={16} />
          <span>에듀킷 매니저</span>
        </div>
      </footer>
    </div>
  );
};

export default AdminLogin;
