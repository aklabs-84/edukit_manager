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

export interface AppState {
  items: InventoryItem[];
  allItems: InventoryItem[];
  isLoading: boolean;
  error: string | null;
  gasUrl: string;
  isDemoMode: boolean;
  selectedSchool: string;
}

export interface ApiResponse {
  success: boolean;
  data?: InventoryItem[];
  message?: string;
}
