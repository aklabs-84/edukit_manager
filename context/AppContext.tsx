import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { InventoryItem, AppState } from '../types';
import { apiService } from '../services/api';

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

  const refreshItems = useCallback(async (schoolOverride?: string) => {
    setIsLoading(true);
    setError(null);
    const targetSchool = schoolOverride ?? selectedSchool;
    try {
      const [selectedData, allData] = await Promise.all([
        apiService.fetchItems(gasUrl, isDemoMode, targetSchool),
        apiService.fetchItems(gasUrl, isDemoMode, '모두'),
      ]);
      setItems(targetSchool === '모두' ? allData : selectedData);
      setAllItems(allData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [gasUrl, isDemoMode, selectedSchool]);

  useEffect(() => {
    refreshItems();
  }, [refreshItems]);

  const addItem = async (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    setIsLoading(true);
    try {
      await apiService.addItem(gasUrl, isDemoMode, item, item.school || selectedSchool);
      await refreshItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : '항목 추가에 실패했습니다.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateItem = async (item: InventoryItem) => {
    setIsLoading(true);
    try {
      await apiService.updateItem(gasUrl, isDemoMode, item, item.school || selectedSchool);
      await refreshItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : '항목 수정에 실패했습니다.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteItem = async (id: string, school?: string) => {
    setIsLoading(true);
    try {
      await apiService.deleteItem(gasUrl, isDemoMode, id, school || selectedSchool);
      await refreshItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : '항목 삭제에 실패했습니다.');
      throw err;
    } finally {
      setIsLoading(false);
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
