import { InventoryItem, ApiResponse } from '../types';
import { MOCK_INVENTORY } from './mockData';

// Helper to simulate network delay for mock mode (kept minimal for faster UX)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const DEFAULT_SCHOOL = '대건고';
const demoKey = (school: string) => `demo_items_${school}`;
const ALL_KEY = '모두';

export const apiService = {
  fetchItems: async (url: string, isDemo: boolean, school: string = DEFAULT_SCHOOL): Promise<InventoryItem[]> => {
    if (isDemo || !url) {
      await delay(150);
      if (school === ALL_KEY) {
        // gather all demo items across schools
        const items: InventoryItem[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i) || '';
          if (key.startsWith('demo_items_')) {
            const data = localStorage.getItem(key);
            if (data) items.push(...JSON.parse(data));
          }
        }
        if (items.length > 0) return items;
        return MOCK_INVENTORY.map(item => ({ ...item }));
      }
      const stored = localStorage.getItem(demoKey(school));
      return stored ? JSON.parse(stored) : MOCK_INVENTORY.map(item => ({ ...item, school }));
    }

    const fetchBySchool = async (sch: string) => {
      const response = await fetch(`${url}?school=${encodeURIComponent(sch || DEFAULT_SCHOOL)}`);
      const result: ApiResponse = await response.json();
      if (result.success && result.data) return result.data;
      throw new Error(result.message || '데이터를 불러오는데 실패했습니다.');
    };

    try {
      if (school === ALL_KEY) {
        // 1차: 백엔드에서 모두 지원하면 한 번에 사용
        try {
          const all = await fetchBySchool(ALL_KEY);
          if (all.length > 0) return all;
        } catch (e) {
          // 무시하고 fallback 시도
        }
        // 2차: 학교별 병합 fallback (병렬 처리)
        const SCHOOLS = ['대건고', '신송고', '중산중', '신현중', '이음초', 'DefaultSchool'];
        const allResults = await Promise.all(
          SCHOOLS.map(async (sch) => {
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
      await delay(120);
      const currentItems = await apiService.fetchItems(url, true, targetSchool);
      const updated = [newItem, ...currentItems];
      localStorage.setItem(demoKey(targetSchool), JSON.stringify(updated));
      return newItem;
    }

    // Real API Call (POST request mimicking a procedure call)
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ action: 'create', data: newItem }),
    });
    const result: ApiResponse = await response.json();
    if (!result.success) throw new Error(result.message);
    return newItem; 
  },

  updateItem: async (url: string, isDemo: boolean, item: InventoryItem, school?: string): Promise<InventoryItem> => {
    const targetSchool = school || item.school || DEFAULT_SCHOOL;
    const updatedItem = { ...item, lastUpdated: new Date().toISOString(), school: targetSchool };

    if (isDemo || !url) {
      await delay(120);
      const currentItems = await apiService.fetchItems(url, true, targetSchool);
      const updated = currentItems.map(i => i.id === item.id ? updatedItem : i);
      localStorage.setItem(demoKey(targetSchool), JSON.stringify(updated));
      return updatedItem;
    }

    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ action: 'update', data: updatedItem }),
    });
    const result: ApiResponse = await response.json();
    if (!result.success) throw new Error(result.message);
    return updatedItem;
  },

  deleteItem: async (url: string, isDemo: boolean, id: string, school?: string): Promise<boolean> => {
    const targetSchool = school || DEFAULT_SCHOOL;
    if (isDemo || !url) {
      await delay(120);
      const currentItems = await apiService.fetchItems(url, true, targetSchool);
      const updated = currentItems.filter(i => i.id !== id);
      localStorage.setItem(demoKey(targetSchool), JSON.stringify(updated));
      return true;
    }

    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', id, school: targetSchool }),
    });
    const result: ApiResponse = await response.json();
    if (!result.success) throw new Error(result.message);
    return true;
  }
};
