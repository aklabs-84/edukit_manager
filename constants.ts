// 학교 관련 상수 (데모 모드용 기본값, 실제 운영 시 DB에서 로드)
export const DEFAULT_SCHOOLS = ['대건고', '신송고', '중산중', '신현중', '이음초'] as const;
export const DEFAULT_SCHOOL = '대건고';
export const ALL_SCHOOLS_KEY = '모두';

// 카테고리 관련 상수
export const CATEGORY_OPTIONS = ['마이크로보드', '로봇', '드론', '키트', '단품', '3D펜', '센서', '기타'] as const;

// 타입 정의
export type Category = typeof CATEGORY_OPTIONS[number];

// 관리자 API URL 저장 키
export const ADMIN_URL_KEY = 'admin_gas_url';
export const AUTH_STATE_KEY = 'auth_state';
export const CURRENT_SCHOOL_KEY = 'current_school';

// 기본 관리자 Apps Script URL
export const DEFAULT_ADMIN_GAS_URL = 'https://script.google.com/macros/s/AKfycbwJWOx6I3sF37xwV8a_J5vVEBS6fRYh6jIX5yDqF0FpYfOqFQ1Yqvr7PRsCOoJMic5U/exec';
