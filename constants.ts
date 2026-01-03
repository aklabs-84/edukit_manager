// 학교 관련 상수 (데모 모드용 기본값, 실제 운영 시 DB에서 로드)
export const DEFAULT_SCHOOLS = ['데모 학교 A', '데모 학교 B', '데모 학교 C'] as const;
export const DEFAULT_SCHOOL = DEFAULT_SCHOOLS[0];
export const ALL_SCHOOLS_KEY = '모두';

// 카테고리 관련 상수
export const CATEGORY_OPTIONS = ['마이크로보드', '로봇', '드론', '키트', '단품', '3D펜', '센서', '기타'] as const;

// 타입 정의
export type Category = typeof CATEGORY_OPTIONS[number];

// 관리자 API URL 저장 키
export const ADMIN_URL_KEY = 'admin_gas_url';
export const AUTH_STATE_KEY = 'auth_state';
export const CURRENT_SCHOOL_KEY = 'current_school';

// 기본 관리자 Apps Script URL (환경변수로 덮어쓰기 가능)
export const DEFAULT_ADMIN_GAS_URL =
  import.meta.env.VITE_ADMIN_GAS_URL ||
  'https://script.google.com/macros/s/AKfycbz4uJPKaH5U6sCcM-kuoE3krME_OCn8BkikT32WTzcNYVHxS8hWPy5HOrWordVcoTzn/exec';
