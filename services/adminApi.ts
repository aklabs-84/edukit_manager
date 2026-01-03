import { SchoolConfig, SchoolApiResponse, AdminLoginResponse } from '../types';
import { resolveAppsScriptUrl } from './appsScriptProxy';
import { DEFAULT_SCHOOLS } from '../constants';

const DEMO_LOCATIONS: SchoolConfig['locations'] = [
  {
    id: 'demo-room-1',
    name: '데모 실습실',
    shelves: [
      {
        id: 'demo-shelf-1',
        name: '선반 A',
        slots: [
          { id: 'demo-slot-1', name: '1칸' },
          { id: 'demo-slot-2', name: '2칸' },
        ],
      },
      {
        id: 'demo-shelf-2',
        name: '선반 B',
        slots: [
          { id: 'demo-slot-3', name: 'A-1' },
          { id: 'demo-slot-4', name: 'A-2' },
        ],
      },
    ],
  },
  {
    id: 'demo-room-2',
    name: '데모 창고',
    shelves: [
      {
        id: 'demo-shelf-3',
        name: '캐비닛 1',
        slots: [
          { id: 'demo-slot-5', name: '상단' },
          { id: 'demo-slot-6', name: '하단' },
        ],
      },
    ],
  },
];

// 데모 모드용 기본 학교 데이터 (저장하지 않음)
const createDemoSchools = (): SchoolConfig[] =>
  DEFAULT_SCHOOLS.map((name, index) => ({
    name,
    code: `DEMO${String(index + 1).padStart(3, '0')}`,
    scriptUrl: '',
    createdAt: new Date().toISOString(),
    sheetUrl: '',
    driveFolderUrl: '',
    categories: ['마이크로보드', '센서', '로봇'],
    locations: DEMO_LOCATIONS,
  }));

const getDemoSchools = (): SchoolConfig[] => createDemoSchools();

const normalizeCategories = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === 'string' && item.trim());
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((item) => typeof item === 'string' && item.trim());
      }
    } catch {
      // ignore
    }
  }
  return [];
};

const normalizeLocations = (value: unknown): SchoolConfig['locations'] => {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // ignore
    }
  }
  return [];
};

const normalizeSchool = (school: SchoolConfig): SchoolConfig => ({
  ...school,
  sheetUrl: school.sheetUrl || '',
  driveFolderUrl: school.driveFolderUrl || '',
  categories: normalizeCategories(school.categories),
  locations: normalizeLocations(school.locations),
});

const normalizeSchoolResponse = (data?: SchoolConfig | SchoolConfig[]): SchoolConfig | SchoolConfig[] | undefined => {
  if (!data) return data;
  if (Array.isArray(data)) {
    return data.map(normalizeSchool);
  }
  return normalizeSchool(data);
};

const parseJsonResponse = async <T>(response: Response): Promise<T> => {
  const text = await response.text();
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('서버 응답이 비어 있습니다.');
  }
  if (trimmed.startsWith('<')) {
    throw new Error('관리자 API URL이 올바르지 않거나 접근 권한이 없습니다.');
  }
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    throw new Error('서버 응답이 JSON 형식이 아닙니다.');
  }
};

export const adminApiService = {
  // 모든 학교 목록 조회
  getSchools: async (url: string, isDemo: boolean = false): Promise<SchoolApiResponse> => {
    if (isDemo || !url) {
      await new Promise(resolve => setTimeout(resolve, 100));
      return { success: true, data: getDemoSchools().map(normalizeSchool) };
    }

    try {
      const endpoint = resolveAppsScriptUrl(url);
      const response = await fetch(`${endpoint}?action=getSchools`);
      const result = await parseJsonResponse<SchoolApiResponse>(response);
      return { ...result, data: normalizeSchoolResponse(result.data) };
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
        return { success: true, data: normalizeSchool(school) };
      }
      return { success: false, message: '유효하지 않은 학교 코드입니다.' };
    }

    try {
      const endpoint = resolveAppsScriptUrl(url);
      const response = await fetch(`${endpoint}?action=verifyCode&code=${encodeURIComponent(code)}`);
      const result = await parseJsonResponse<SchoolApiResponse>(response);
      return { ...result, data: normalizeSchoolResponse(result.data) };
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
      const endpoint = resolveAppsScriptUrl(url);
      const response = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          action: 'adminLogin',
          username,
          password,
        }),
      });
      const result = await parseJsonResponse<AdminLoginResponse>(response);
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
      return { success: false, message: '데모 모드에서는 저장되지 않습니다.' };
    }

    try {
      const endpoint = resolveAppsScriptUrl(url);
      const response = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          action: 'addSchool',
          name: school.name,
          code: school.code,
          scriptUrl: school.scriptUrl,
          sheetUrl: school.sheetUrl,
          driveFolderUrl: school.driveFolderUrl,
          categories: school.categories,
          locations: school.locations,
        }),
      });
      const result = await parseJsonResponse<SchoolApiResponse>(response);
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
      return { success: false, message: '데모 모드에서는 저장되지 않습니다.' };
    }

    try {
      const endpoint = resolveAppsScriptUrl(url);
      const response = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          action: 'updateSchool',
          originalCode,
          name: school.name,
          code: school.code,
          scriptUrl: school.scriptUrl,
          sheetUrl: school.sheetUrl,
          driveFolderUrl: school.driveFolderUrl,
          categories: school.categories,
          locations: school.locations,
        }),
      });
      const result = await parseJsonResponse<SchoolApiResponse>(response);
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
      return { success: false, message: '데모 모드에서는 저장되지 않습니다.' };
    }

    try {
      const endpoint = resolveAppsScriptUrl(url);
      const response = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          action: 'deleteSchool',
          code,
        }),
      });
      const result = await parseJsonResponse<SchoolApiResponse>(response);
      return result;
    } catch (error) {
      console.error('학교 삭제 실패:', error);
      throw error;
    }
  },

  updateSchoolCategories: async (url: string, code: string, categories: string[], isDemo: boolean = false): Promise<SchoolApiResponse> => {
    const normalized = normalizeCategories(categories);
    if (isDemo || !url) {
      await new Promise(resolve => setTimeout(resolve, 100));
      return { success: false, message: '데모 모드에서는 저장되지 않습니다.' };
    }

    try {
      const endpoint = resolveAppsScriptUrl(url);
      const response = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          action: 'updateCategories',
          code,
          categories: normalized,
        }),
      });
      const result = await parseJsonResponse<SchoolApiResponse>(response);
      return { ...result, data: normalizeSchoolResponse(result.data) };
    } catch (error) {
      console.error('카테고리 업데이트 실패:', error);
      throw error;
    }
  },

  updateSchoolLocations: async (url: string, code: string, locations: SchoolConfig['locations'], isDemo: boolean = false): Promise<SchoolApiResponse> => {
    const normalized = normalizeLocations(locations);
    if (isDemo || !url) {
      await new Promise(resolve => setTimeout(resolve, 100));
      return { success: false, message: '데모 모드에서는 저장되지 않습니다.' };
    }

    try {
      const endpoint = resolveAppsScriptUrl(url);
      const response = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          action: 'updateLocations',
          code,
          locations: normalized,
        }),
      });
      const result = await parseJsonResponse<SchoolApiResponse>(response);
      return { ...result, data: normalizeSchoolResponse(result.data) };
    } catch (error) {
      console.error('위치 업데이트 실패:', error);
      throw error;
    }
  },

  // 비밀번호 변경
  changePassword: async (url: string, username: string, oldPassword: string, newPassword: string, isDemo: boolean = false): Promise<AdminLoginResponse> => {
    if (isDemo || !url) {
      await new Promise(resolve => setTimeout(resolve, 100));
      return { success: false, message: '데모 모드에서는 저장되지 않습니다.' };
    }

    try {
      const endpoint = resolveAppsScriptUrl(url);
      const response = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          action: 'changePassword',
          username,
          oldPassword,
          newPassword,
        }),
      });
      const result = await parseJsonResponse<AdminLoginResponse>(response);
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
