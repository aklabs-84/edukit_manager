export enum ItemStatus {
  IN_STOCK = '재고 있음',
  LOW_STOCK = '재고 부족',
  OUT_OF_STOCK = '품절',
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  location: string;
  status: ItemStatus;
  lastUpdated: string;
  school: string;
  notes?: string;
  imageUrl?: string;
  imageBase64?: string; // 업로드용 임시 필드
}

// 학교 설정 정보
export interface SchoolConfig {
  name: string;
  code: string;
  scriptUrl: string;
  createdAt: string | null;
}

// 인증 상태
export interface AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  currentSchool: SchoolConfig | null;
}

export interface AppState {
  items: InventoryItem[];
  allItems: InventoryItem[];
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  gasUrl: string;
  isDemoMode: boolean;
  selectedSchool: string;
  schools: SchoolConfig[]; // 동적 학교 목록
}

export interface ApiResponse {
  success: boolean;
  data?: InventoryItem[];
  message?: string;
}

export interface SchoolApiResponse {
  success: boolean;
  data?: SchoolConfig | SchoolConfig[];
  message?: string;
}

export interface AdminLoginResponse {
  success: boolean;
  message?: string;
}
