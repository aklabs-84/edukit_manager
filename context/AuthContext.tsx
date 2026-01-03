import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SchoolConfig, AuthState } from '../types';
import { AUTH_STATE_KEY, CURRENT_SCHOOL_KEY, ADMIN_URL_KEY, DEFAULT_ADMIN_GAS_URL, DEFAULT_SCHOOLS } from '../constants';
import { adminApiService } from '../services/adminApi';

interface AuthContextType extends AuthState {
  adminGasUrl: string;
  setAdminGasUrl: (url: string) => void;
  setCurrentSchool: (school: SchoolConfig | null) => void;
  loginWithCode: (code: string) => Promise<{ success: boolean; message?: string }>;
  loginAsDemo: () => Promise<{ success: boolean; message?: string }>;
  loginAsAdmin: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentSchool, setCurrentSchool] = useState<SchoolConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminGasUrl, setAdminGasUrlState] = useState(() => {
    const stored = localStorage.getItem(ADMIN_URL_KEY);
    const normalized = stored?.trim();
    if (!normalized || normalized === 'null' || normalized === 'undefined') {
      return DEFAULT_ADMIN_GAS_URL;
    }
    return normalized;
  });

  // 저장된 인증 상태 복원
  useEffect(() => {
    const savedAuth = localStorage.getItem(AUTH_STATE_KEY);
    const savedSchool = localStorage.getItem(CURRENT_SCHOOL_KEY);

    if (savedAuth) {
      try {
        const authState = JSON.parse(savedAuth);
        setIsAuthenticated(authState.isAuthenticated);
        setIsAdmin(authState.isAdmin);
      } catch {
        // 파싱 실패 시 무시
      }
    }

    if (savedSchool) {
      try {
        setCurrentSchool(JSON.parse(savedSchool));
      } catch {
        // 파싱 실패 시 무시
      }
    }

    setIsLoading(false);
  }, []);

  // 인증 상태 저장
  const saveAuthState = useCallback((authenticated: boolean, admin: boolean, school: SchoolConfig | null) => {
    localStorage.setItem(AUTH_STATE_KEY, JSON.stringify({
      isAuthenticated: authenticated,
      isAdmin: admin,
    }));

    if (school) {
      localStorage.setItem(CURRENT_SCHOOL_KEY, JSON.stringify(school));
    } else {
      localStorage.removeItem(CURRENT_SCHOOL_KEY);
    }
  }, []);

  // 학교 코드로 로그인
  const loginWithCode = useCallback(async (code: string): Promise<{ success: boolean; message?: string }> => {
    if (!adminGasUrl) {
      return { success: false, message: '관리자 API URL이 설정되지 않았습니다.' };
    }

    setIsLoading(true);
    try {
      const result = await adminApiService.verifySchoolCode(adminGasUrl, code);

      if (result.success && result.data) {
        const school = result.data as SchoolConfig;
        setIsAuthenticated(true);
        setIsAdmin(false);
        setCurrentSchool(school);
        saveAuthState(true, false, school);
        return { success: true };
      }

      return { success: false, message: result.message || '유효하지 않은 학교 코드입니다.' };
    } catch (error) {
      return { success: false, message: '학교 코드 확인 중 오류가 발생했습니다.' };
    } finally {
      setIsLoading(false);
    }
  }, [adminGasUrl, saveAuthState]);

  const loginAsDemo = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      const demoSchool: SchoolConfig = {
        name: DEFAULT_SCHOOLS[0],
        code: 'DEMO001',
        scriptUrl: '',
        createdAt: null,
        sheetUrl: '',
        driveFolderUrl: '',
        categories: [],
        locations: [],
      };
      setIsAuthenticated(true);
      setIsAdmin(false);
      setCurrentSchool(demoSchool);
      saveAuthState(true, false, demoSchool);
      return { success: true };
    } finally {
      setIsLoading(false);
    }
  }, [saveAuthState]);

  // 관리자 로그인
  const loginAsAdmin = useCallback(async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    if (!adminGasUrl) {
      return { success: false, message: '관리자 API URL이 설정되지 않았습니다.' };
    }

    setIsLoading(true);
    try {
      const result = await adminApiService.adminLogin(adminGasUrl, username, password);

      if (result.success) {
        setIsAuthenticated(true);
        setIsAdmin(true);
        setCurrentSchool(null);
        saveAuthState(true, true, null);
        return { success: true, message: result.message };
      }

      return { success: false, message: result.message || '로그인에 실패했습니다.' };
    } catch (error) {
      return { success: false, message: '로그인 중 오류가 발생했습니다.' };
    } finally {
      setIsLoading(false);
    }
  }, [adminGasUrl, saveAuthState]);

  // 로그아웃
  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    setCurrentSchool(null);
    localStorage.removeItem(AUTH_STATE_KEY);
    localStorage.removeItem(CURRENT_SCHOOL_KEY);
  }, []);

  // 관리자 URL 설정
  const setAdminGasUrl = useCallback((url: string) => {
    const normalized = url.trim();
    setAdminGasUrlState(normalized);
    localStorage.setItem(ADMIN_URL_KEY, normalized);
  }, []);

  useEffect(() => {
    if (!isLoading && isAdmin && !adminGasUrl) {
      setAdminGasUrl(DEFAULT_ADMIN_GAS_URL);
    }
  }, [adminGasUrl, isAdmin, isLoading, setAdminGasUrl]);

  // 관리자용: 특정 학교로 바로 전환
  const setCurrentSchoolDirect = useCallback((school: SchoolConfig | null) => {
    setCurrentSchool(school);
    saveAuthState(isAuthenticated || isAdmin, isAdmin, school);
  }, [isAdmin, isAuthenticated, saveAuthState]);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isAdmin,
      currentSchool,
      adminGasUrl,
      setAdminGasUrl,
      setCurrentSchool: setCurrentSchoolDirect,
      loginWithCode,
      loginAsDemo,
      loginAsAdmin,
      logout,
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
