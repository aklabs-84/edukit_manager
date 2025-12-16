import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { InventoryItem, AppState } from '../types';
import { apiService } from '../services/api';
import { ALL_SCHOOLS_KEY } from '../constants';

interface AppContextType extends AppState {
  refreshItems: (schoolOverride?: string) => Promise<void>;
  addItem: (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => Promise<void>;
  updateItem: (item: InventoryItem) => Promise<void>;
  deleteItem: (id: string, school?: string) => Promise<void>;
  setGasUrl: (url: string) => void;
  toggleDemoMode: (isDemo: boolean) => void;
  setSelectedSchool: (school: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [allItems, setAllItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize from local storage
  const [gasUrl, setGasUrlState] = useState(() => localStorage.getItem('gas_url') || '');
  const [isDemoMode, setIsDemoMode] = useState(() => {
    const saved = localStorage.getItem('is_demo_mode');
    return saved === null ? true : saved === 'true';
  });
  const [selectedSchool, setSelectedSchool] = useState(() => localStorage.getItem('selected_school') || '모두');

  // 개선: 필요한 데이터만 로드 (이전: 항상 2개 API 호출)
  const refreshItems = useCallback(async (schoolOverride?: string) => {
    setIsLoading(true);
    setError(null);
    const targetSchool = schoolOverride ?? selectedSchool;

    try {
      // 선택된 학교 데이터만 로드
      const data = await apiService.fetchItems(gasUrl, isDemoMode, targetSchool);
      setItems(data);

      // '모두' 선택일 때만 allItems도 갱신
      if (targetSchool === ALL_SCHOOLS_KEY) {
        setAllItems(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [gasUrl, isDemoMode, selectedSchool]);

  // 대시보드용: allItems만 별도로 로드 (필요시에만 호출)
  const refreshAllItems = useCallback(async () => {
    try {
      const allData = await apiService.fetchItems(gasUrl, isDemoMode, ALL_SCHOOLS_KEY);
      setAllItems(allData);
    } catch (err) {
      console.error('전체 데이터 로드 실패:', err);
    }
  }, [gasUrl, isDemoMode]);

  useEffect(() => {
    // 초기 로드: 선택된 학교 + 전체 데이터(대시보드용)
    const init = async () => {
      setIsLoading(true);
      try {
        const [selectedData, allData] = await Promise.all([
          apiService.fetchItems(gasUrl, isDemoMode, selectedSchool),
          apiService.fetchItems(gasUrl, isDemoMode, ALL_SCHOOLS_KEY),
        ]);
        setItems(selectedSchool === ALL_SCHOOLS_KEY ? allData : selectedData);
        setAllItems(allData);
      } catch (err) {
        setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [gasUrl, isDemoMode]); // selectedSchool 변경 시에는 refreshItems 사용

  // Optimistic Update: 추가
  const addItem = async (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    const targetSchool = item.school || selectedSchool;
    const newItem: InventoryItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      lastUpdated: new Date().toISOString(),
      school: targetSchool === ALL_SCHOOLS_KEY ? '대건고' : targetSchool,
    } as InventoryItem;

    // 1. UI 즉시 반영 (낙관적 업데이트)
    setItems(prev => [newItem, ...prev]);
    setAllItems(prev => [newItem, ...prev]);

    try {
      // 2. 백그라운드에서 API 호출
      await apiService.addItem(gasUrl, isDemoMode, item, newItem.school);
    } catch (err) {
      // 3. 실패 시 롤백
      setItems(prev => prev.filter(i => i.id !== newItem.id));
      setAllItems(prev => prev.filter(i => i.id !== newItem.id));
      setError(err instanceof Error ? err.message : '항목 추가에 실패했습니다.');
      throw err;
    }
  };

  // Optimistic Update: 수정
  const updateItem = async (item: InventoryItem) => {
    const updatedItem = { ...item, lastUpdated: new Date().toISOString() };
    const previousItems = [...items];
    const previousAllItems = [...allItems];

    // 1. UI 즉시 반영
    setItems(prev => prev.map(i => i.id === item.id ? updatedItem : i));
    setAllItems(prev => prev.map(i => i.id === item.id ? updatedItem : i));

    try {
      // 2. 백그라운드에서 API 호출
      await apiService.updateItem(gasUrl, isDemoMode, item, item.school);
    } catch (err) {
      // 3. 실패 시 롤백
      setItems(previousItems);
      setAllItems(previousAllItems);
      setError(err instanceof Error ? err.message : '항목 수정에 실패했습니다.');
      throw err;
    }
  };

  // Optimistic Update: 삭제
  const deleteItem = async (id: string, school?: string) => {
    const previousItems = [...items];
    const previousAllItems = [...allItems];

    // 1. UI 즉시 반영
    setItems(prev => prev.filter(i => i.id !== id));
    setAllItems(prev => prev.filter(i => i.id !== id));

    try {
      // 2. 백그라운드에서 API 호출
      await apiService.deleteItem(gasUrl, isDemoMode, id, school || selectedSchool);
    } catch (err) {
      // 3. 실패 시 롤백
      setItems(previousItems);
      setAllItems(previousAllItems);
      setError(err instanceof Error ? err.message : '항목 삭제에 실패했습니다.');
      throw err;
    }
  };

  const setGasUrl = (url: string) => {
    setGasUrlState(url);
    localStorage.setItem('gas_url', url);
  };

  const toggleDemoMode = (isDemo: boolean) => {
    setIsDemoMode(isDemo);
    localStorage.setItem('is_demo_mode', String(isDemo));
  };

  const handleSetSelectedSchool = (school: string) => {
    setSelectedSchool(school);
    localStorage.setItem('selected_school', school);
  };

  return (
    <AppContext.Provider value={{
      items,
      isLoading,
      error,
      gasUrl,
      isDemoMode,
      selectedSchool,
      refreshItems,
      addItem,
      updateItem,
      deleteItem,
      setGasUrl,
      toggleDemoMode,
      setSelectedSchool: handleSetSelectedSchool,
      allItems,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
