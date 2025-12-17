import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { InventoryItem, AppState, SchoolConfig } from '../types';
import { apiService } from '../services/api';
import { ALL_SCHOOLS_KEY, DEFAULT_SCHOOLS } from '../constants';
import { useAuth } from './AuthContext';

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
  const { currentSchool, isAdmin, adminGasUrl, isLoading: authLoading } = useAuth();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [allItems, setAllItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true); // 초기값 true로 변경
  const [error, setError] = useState<string | null>(null);
  const [schools, setSchools] = useState<SchoolConfig[]>([]);
  const [isInitialized, setIsInitialized] = useState(false); // 초기화 완료 플래그

  // 학교별 자동 URL 연결: currentSchool의 scriptUrl 사용
  const [gasUrl, setGasUrlState] = useState(() => {
    // 현재 학교의 scriptUrl이 있으면 사용, 없으면 저장된 URL 사용
    return currentSchool?.scriptUrl || localStorage.getItem('gas_url') || '';
  });

  const [isDemoMode, setIsDemoMode] = useState(() => {
    // 현재 학교가 있고 scriptUrl이 있으면 데모 모드 아님
    if (currentSchool?.scriptUrl) {
      return false;
    }
    const saved = localStorage.getItem('is_demo_mode');
    return saved === null ? true : saved === 'true';
  });

  // 학교 사용자는 해당 학교만, 관리자는 '모두' 가능
  const [selectedSchool, setSelectedSchool] = useState(() => {
    if (currentSchool) {
      return currentSchool.name;
    }
    return localStorage.getItem('selected_school') || '모두';
  });

  // currentSchool 변경 시 자동으로 설정 업데이트
  useEffect(() => {
    if (currentSchool) {
      setSelectedSchool(currentSchool.name);
      if (currentSchool.scriptUrl) {
        setGasUrlState(currentSchool.scriptUrl);
        // 실제 URL이 있으면 데모 모드 해제
        setIsDemoMode(false);
        localStorage.setItem('is_demo_mode', 'false');
      }
    }
  }, [currentSchool]);

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

  // Auth 로딩이 완료된 후에만 데이터 로드 (데모 데이터 깜빡임 방지)
  useEffect(() => {
    // Auth 로딩 중이면 대기
    if (authLoading) {
      return;
    }

    // 이미 초기화되었으면 스킵 (gasUrl/isDemoMode 변경 시에만 재로드)
    if (isInitialized) {
      return;
    }

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
        setIsInitialized(true);
      }
    };
    init();
  }, [authLoading, gasUrl, isDemoMode, selectedSchool, isInitialized]);

  // gasUrl 또는 isDemoMode가 변경되면 다시 로드 필요
  useEffect(() => {
    if (isInitialized) {
      setIsInitialized(false); // 다시 초기화 트리거
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gasUrl, isDemoMode]);

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
      isInitialized,
      error,
      gasUrl,
      isDemoMode,
      selectedSchool,
      schools,
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
