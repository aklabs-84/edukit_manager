// 학교 관련 상수
export const SCHOOLS = ['대건고', '신송고', '중산중', '신현중', '이음초'] as const;
export const SCHOOL_OPTIONS = ['모두', ...SCHOOLS] as const;
export const DEFAULT_SCHOOL = '대건고';
export const ALL_SCHOOLS_KEY = '모두';

// 카테고리 관련 상수
export const CATEGORY_OPTIONS = ['마이크로보드', '로봇', '드론', '키트', '단품', '3D펜', '센서', '기타'] as const;

// 타입 정의
export type School = typeof SCHOOLS[number];
export type SchoolOption = typeof SCHOOL_OPTIONS[number];
export type Category = typeof CATEGORY_OPTIONS[number];
