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
  sheetUrl?: string;
  driveFolderUrl?: string;
  categories?: string[];
  locations?: LocationRoom[];
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

// 위치 관리 타입
export interface LocationSlot {
  id: string;
  name: string;  // 예: "1칸", "2칸", "A-1"
}

export interface LocationShelf {
  id: string;
  name: string;  // 예: "선반A", "캐비닛1"
  slots: LocationSlot[];
}

export interface LocationRoom {
  id: string;
  name: string;  // 예: "전산1실", "창고"
  shelves: LocationShelf[];
}

export interface LocationData {
  rooms: LocationRoom[];
  lastUpdated: string;
}
