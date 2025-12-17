import { SchoolConfig, SchoolApiResponse, AdminLoginResponse } from '../types';
import { DEFAULT_SCHOOLS } from '../constants';

// 데모 모드용 기본 학교 데이터
const DEMO_SCHOOLS: SchoolConfig[] = DEFAULT_SCHOOLS.map((name, index) => ({
  name,
  code: `DEMO${String(index + 1).padStart(3, '0')}`,
  scriptUrl: '',
  createdAt: new Date().toISOString(),
}));

const DEMO_STORAGE_KEY = 'demo_school_settings';

// 데모 모드 학교 데이터 관리
const getDemoSchools = (): SchoolConfig[] => {
  const stored = localStorage.getItem(DEMO_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return DEMO_SCHOOLS;
    }
  }
  // 초기 데모 데이터 저장
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(DEMO_SCHOOLS));
  return DEMO_SCHOOLS;
};

const saveDemoSchools = (schools: SchoolConfig[]) => {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(schools));
};

export const adminApiService = {
  // 모든 학교 목록 조회
  getSchools: async (url: string, isDemo: boolean = false): Promise<SchoolApiResponse> => {
    if (isDemo || !url) {
      await new Promise(resolve => setTimeout(resolve, 100));
      return { success: true, data: getDemoSchools() };
    }

    try {
      const response = await fetch(`${url}?action=getSchools`);
      const result: SchoolApiResponse = await response.json();
      return result;
    } catch (error) {
      console.error('학교 목록 조회 실패:', error);
      throw error;
    }
  },

  // 학교 코드 확인
  verifySchoolCode: async (url: string, code: string, isDemo: boolean = false): Promise<SchoolApiResponse> => {
    if (isDemo || !url) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const schools = getDemoSchools();
      const school = schools.find(s => s.code === code);
      if (school) {
        return { success: true, data: school };
      }
      return { success: false, message: '유효하지 않은 학교 코드입니다.' };
    }

    try {
      const response = await fetch(`${url}?action=verifyCode&code=${encodeURIComponent(code)}`);
      const result: SchoolApiResponse = await response.json();
      return result;
    } catch (error) {
      console.error('학교 코드 확인 실패:', error);
      throw error;
    }
  },

  // 관리자 로그인
  adminLogin: async (url: string, username: string, password: string, isDemo: boolean = false): Promise<AdminLoginResponse> => {
    if (isDemo || !url) {
      await new Promise(resolve => setTimeout(resolve, 100));
      // 데모 모드에서는 admin/admin123으로 로그인
      if (username === 'admin' && password === 'admin123') {
        return { success: true, message: '로그인 성공 (데모 모드)' };
      }
      return { success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          action: 'adminLogin',
          username,
          password,
        }),
      });
      const result: AdminLoginResponse = await response.json();
      return result;
    } catch (error) {
      console.error('관리자 로그인 실패:', error);
      throw error;
    }
  },

  // 학교 추가
  addSchool: async (url: string, school: Omit<SchoolConfig, 'createdAt'>, isDemo: boolean = false): Promise<SchoolApiResponse> => {
    if (isDemo || !url) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const schools = getDemoSchools();

      // 중복 체크
      if (schools.some(s => s.code === school.code)) {
        return { success: false, message: '이미 존재하는 학교 코드입니다.' };
      }
      if (schools.some(s => s.name === school.name)) {
        return { success: false, message: '이미 존재하는 학교 이름입니다.' };
      }

      const newSchool: SchoolConfig = {
        ...school,
        createdAt: new Date().toISOString(),
      };
      schools.push(newSchool);
      saveDemoSchools(schools);

      return { success: true, data: newSchool, message: '학교가 추가되었습니다.' };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          action: 'addSchool',
          name: school.name,
          code: school.code,
          scriptUrl: school.scriptUrl,
        }),
      });
      const result: SchoolApiResponse = await response.json();
      return result;
    } catch (error) {
      console.error('학교 추가 실패:', error);
      throw error;
    }
  },

  // 학교 수정
  updateSchool: async (url: string, originalCode: string, school: Omit<SchoolConfig, 'createdAt'>, isDemo: boolean = false): Promise<SchoolApiResponse> => {
    if (isDemo || !url) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const schools = getDemoSchools();
      const index = schools.findIndex(s => s.code === originalCode);

      if (index === -1) {
        return { success: false, message: '해당 학교를 찾을 수 없습니다.' };
      }

      // 새 코드가 다른 학교와 중복되는지 체크
      if (school.code !== originalCode && schools.some(s => s.code === school.code)) {
        return { success: false, message: '이미 존재하는 학교 코드입니다.' };
      }

      schools[index] = {
        ...schools[index],
        name: school.name,
        code: school.code,
        scriptUrl: school.scriptUrl,
      };
      saveDemoSchools(schools);

      return { success: true, data: schools[index], message: '학교 정보가 수정되었습니다.' };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          action: 'updateSchool',
          originalCode,
          name: school.name,
          code: school.code,
          scriptUrl: school.scriptUrl,
        }),
      });
      const result: SchoolApiResponse = await response.json();
      return result;
    } catch (error) {
      console.error('학교 수정 실패:', error);
      throw error;
    }
  },

  // 학교 삭제
  deleteSchool: async (url: string, code: string, isDemo: boolean = false): Promise<SchoolApiResponse> => {
    if (isDemo || !url) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const schools = getDemoSchools();
      const filtered = schools.filter(s => s.code !== code);

      if (filtered.length === schools.length) {
        return { success: false, message: '해당 학교를 찾을 수 없습니다.' };
      }

      saveDemoSchools(filtered);
      return { success: true, message: '학교가 삭제되었습니다.' };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          action: 'deleteSchool',
          code,
        }),
      });
      const result: SchoolApiResponse = await response.json();
      return result;
    } catch (error) {
      console.error('학교 삭제 실패:', error);
      throw error;
    }
  },

  // 비밀번호 변경
  changePassword: async (url: string, username: string, oldPassword: string, newPassword: string, isDemo: boolean = false): Promise<AdminLoginResponse> => {
    if (isDemo || !url) {
      await new Promise(resolve => setTimeout(resolve, 100));
      // 데모 모드에서는 비밀번호 변경 시뮬레이션
      return { success: true, message: '비밀번호가 변경되었습니다. (데모 모드)' };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          action: 'changePassword',
          username,
          oldPassword,
          newPassword,
        }),
      });
      const result: AdminLoginResponse = await response.json();
      return result;
    } catch (error) {
      console.error('비밀번호 변경 실패:', error);
      throw error;
    }
  },

  // 랜덤 학교 코드 생성
  generateSchoolCode: (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },
};
