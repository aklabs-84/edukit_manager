import { InventoryItem, ApiResponse } from '../types';
import { MOCK_INVENTORY } from './mockData';
import { DEFAULT_SCHOOLS, DEFAULT_SCHOOL, ALL_SCHOOLS_KEY } from '../constants';
import { resolveAppsScriptUrl } from './appsScriptProxy';

// Helper to simulate network delay for mock mode (kept minimal for faster UX)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const MAX_IMAGE_BASE64_SIZE = 7_000_000; // ~5MB binary payload in base64

const buildDemoItemsForSchool = (school: string): InventoryItem[] =>
  MOCK_INVENTORY.map(item => ({ ...item, id: `${school}-${item.id}`, school }));

const getDemoItems = (school: string): InventoryItem[] => {
  if (school === ALL_SCHOOLS_KEY) {
    const combined = DEFAULT_SCHOOLS.flatMap(name =>
      buildDemoItemsForSchool(name)
    );
    return combined.length > 0 ? combined : MOCK_INVENTORY.map(item => ({ ...item }));
  }

  const filtered = MOCK_INVENTORY.filter(item => item.school === school);
  if (filtered.length > 0) {
    return filtered.map(item => ({ ...item, id: `${school}-${item.id}` }));
  }
  return buildDemoItemsForSchool(school);
};

export const apiService = {
  // 이미지를 Google Drive에 업로드
  uploadImage: async (url: string, isDemo: boolean, base64Data: string, fileName: string): Promise<{ success: boolean; url?: string; message?: string }> => {
    if (isDemo || !url) {
      // 데모 모드에서는 base64 그대로 반환 (로컬 미리보기용)
      return { success: true, url: base64Data };
    }

    try {
      const endpoint = resolveAppsScriptUrl(url);
      const response = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          action: 'uploadImage',
          imageData: base64Data,
          fileName: fileName,
        }),
      });
      const result = await response.json();
      if (result.success) {
        return { success: true, url: result.url };
      }
      return { success: false, message: result.message || '이미지 업로드에 실패했습니다.' };
    } catch (error) {
      console.error('Image upload error:', error);
      return { success: false, message: '이미지 업로드 중 오류가 발생했습니다.' };
    }
  },

  fetchItems: async (url: string, isDemo: boolean, school: string = DEFAULT_SCHOOL): Promise<InventoryItem[]> => {
    if (isDemo || !url) {
      await delay(80); // 150 → 80ms로 단축

      return getDemoItems(school);
    }

    const endpoint = resolveAppsScriptUrl(url);
    const fetchBySchool = async (sch: string) => {
      const response = await fetch(`${endpoint}?school=${encodeURIComponent(sch || DEFAULT_SCHOOL)}`);
      const result: ApiResponse = await response.json();
      if (result.success && result.data) return result.data;
      throw new Error(result.message || '데이터를 불러오는데 실패했습니다.');
    };

    try {
      if (school === ALL_SCHOOLS_KEY) {
        // 1차: 백엔드에서 모두 지원하면 한 번에 사용
        try {
          const all = await fetchBySchool(ALL_SCHOOLS_KEY);
          if (all.length > 0) return all;
        } catch {
          // 무시하고 fallback 시도
        }
        // 2차: 학교별 병합 fallback (병렬 처리)
        const allResults = await Promise.all(
          DEFAULT_SCHOOLS.map(async (sch) => {
            try {
              return await fetchBySchool(sch);
            } catch {
              return [];
            }
          })
        );
        const merged: Record<string, InventoryItem> = {};
        allResults.flat().forEach(item => {
          merged[item.id] = item;
        });
        return Object.values(merged);
      }
      return await fetchBySchool(school || DEFAULT_SCHOOL);
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },

  addItem: async (url: string, isDemo: boolean, item: Omit<InventoryItem, 'id' | 'lastUpdated'>, school?: string): Promise<InventoryItem> => {
    const targetSchool = school || item.school || DEFAULT_SCHOOL;
    const newItem: InventoryItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      lastUpdated: new Date().toISOString(),
      school: targetSchool,
    };

    if (isDemo || !url) {
      await delay(50); // 120 → 50ms로 단축

      return newItem;
    }

    // Real API Call (POST request mimicking a procedure call)
    const endpoint = resolveAppsScriptUrl(url);
    const payload = { action: 'create', data: pruneImagePayload(newItem) };
    const response = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const result: ApiResponse = await response.json();
    if (!result.success) throw new Error(result.message);
    return newItem;
  },

  updateItem: async (url: string, isDemo: boolean, item: InventoryItem, school?: string): Promise<InventoryItem> => {
    const targetSchool = school || item.school || DEFAULT_SCHOOL;
    const updatedItem = { ...item, lastUpdated: new Date().toISOString(), school: targetSchool };

    if (isDemo || !url) {
      await delay(50); // 120 → 50ms로 단축

      return updatedItem;
    }

    const endpoint = resolveAppsScriptUrl(url);
    const payload = { action: 'update', data: pruneImagePayload(updatedItem) };
    const response = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const result: ApiResponse = await response.json();
    if (!result.success) throw new Error(result.message);
    return updatedItem;
  },

  deleteItem: async (url: string, isDemo: boolean, id: string, school?: string): Promise<boolean> => {
    const targetSchool = school || DEFAULT_SCHOOL;

    if (isDemo || !url) {
      await delay(50); // 120 → 50ms로 단축

      return true;
    }

    const endpoint = resolveAppsScriptUrl(url);
    const response = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', id, school: targetSchool }),
    });
    const result: ApiResponse = await response.json();
    if (!result.success) throw new Error(result.message);
    return true;
  }
};

// Convert imageBase64 to imageUrl and remove base64 from payload
// 이미지가 변경되지 않은 경우 기존 imageUrl 유지
function pruneImagePayload(item: InventoryItem): InventoryItem {
  const clone = { ...item };

  // imageBase64가 있으면 새 이미지 업로드됨
  if (clone.imageBase64) {
    if (clone.imageBase64.length > MAX_IMAGE_BASE64_SIZE) {
      console.warn('이미지 용량이 커서 전송하지 않습니다. 압축 후 다시 시도하세요.');
      // 용량 초과 시 기존 imageUrl 유지, base64 제거
      delete clone.imageBase64;
    } else {
      // base64를 imageUrl로 저장 (스프레드시트에서는 imageUrl 컬럼 사용)
      clone.imageUrl = clone.imageBase64;
      delete clone.imageBase64;
    }
  }
  // imageBase64가 없으면 기존 imageUrl 그대로 유지됨

  return clone;
}
