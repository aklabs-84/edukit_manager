import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LocationData, LocationRoom, LocationShelf, LocationSlot, SchoolConfig } from '../types';
import { useAuth } from './AuthContext';
import { adminApiService } from '../services/adminApi';

interface LocationContextType {
  locationData: LocationData;
  isLoading: boolean;
  addRoom: (name: string) => void;
  updateRoom: (id: string, name: string) => void;
  deleteRoom: (id: string) => void;
  duplicateRoom: (roomId: string, newName: string) => void;
  addShelf: (roomId: string, name: string) => void;
  updateShelf: (roomId: string, shelfId: string, name: string) => void;
  deleteShelf: (roomId: string, shelfId: string) => void;
  duplicateShelf: (roomId: string, shelfId: string, newName: string) => void;
  addSlot: (roomId: string, shelfId: string, name: string) => void;
  updateSlot: (roomId: string, shelfId: string, slotId: string, name: string) => void;
  deleteSlot: (roomId: string, shelfId: string, slotId: string) => void;
  getLocationString: (roomId: string, shelfId?: string, slotId?: string) => string;
  getLocationOptions: () => { value: string; label: string; roomId: string; shelfId?: string; slotId?: string }[];
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const generateId = () => Math.random().toString(36).substr(2, 9);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentSchool, adminGasUrl, setCurrentSchool } = useAuth();
  const schoolCode = currentSchool?.code || '';
  const isDemoMode = !adminGasUrl;

  const [locationData, setLocationData] = useState<LocationData>(() => ({
    rooms: currentSchool?.locations ?? [],
    lastUpdated: new Date().toISOString()
  }));

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setLocationData({
      rooms: currentSchool?.locations ?? [],
      lastUpdated: new Date().toISOString()
    });
  }, [currentSchool?.code]);

  // 학교 변경 시 해당 학교의 위치 데이터 로드
  useEffect(() => {
    let isActive = true;
    if (!schoolCode) {
      setLocationData({ rooms: [], lastUpdated: new Date().toISOString() });
      return;
    }

    const loadLocations = async () => {
      setIsLoading(true);
      try {
        const result = await adminApiService.verifySchoolCode(adminGasUrl, schoolCode, isDemoMode);
        if (!isActive) return;
        if (result.success && result.data) {
          const school = result.data as SchoolConfig;
          setLocationData({
            rooms: school.locations ?? [],
            lastUpdated: new Date().toISOString()
          });
          if (currentSchool?.code === school.code) {
            setCurrentSchool({ ...currentSchool, locations: school.locations ?? [] });
          }
        } else {
          setLocationData({ rooms: [], lastUpdated: new Date().toISOString() });
        }
      } catch {
        if (!isActive) return;
        setLocationData({ rooms: [], lastUpdated: new Date().toISOString() });
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadLocations();
    return () => {
      isActive = false;
    };
  }, [adminGasUrl, isDemoMode, schoolCode, currentSchool, setCurrentSchool]);

  // 데이터 변경 시 서버에 저장
  const saveData = useCallback((data: LocationData) => {
    const updated = { ...data, lastUpdated: new Date().toISOString() };
    setLocationData(updated);
    if (!schoolCode) return;
    void adminApiService.updateSchoolLocations(adminGasUrl, schoolCode, updated.rooms, isDemoMode);
    if (currentSchool?.code === schoolCode) {
      setCurrentSchool({ ...currentSchool, locations: updated.rooms });
    }
  }, [adminGasUrl, currentSchool, isDemoMode, schoolCode, setCurrentSchool]);

  // Room CRUD
  const addRoom = (name: string) => {
    const newRoom: LocationRoom = { id: generateId(), name, shelves: [] };
    saveData({ ...locationData, rooms: [...locationData.rooms, newRoom] });
  };

  const updateRoom = (id: string, name: string) => {
    saveData({
      ...locationData,
      rooms: locationData.rooms.map(r => r.id === id ? { ...r, name } : r)
    });
  };

  const deleteRoom = (id: string) => {
    saveData({
      ...locationData,
      rooms: locationData.rooms.filter(r => r.id !== id)
    });
  };

  // 교실 복제 (선반, 칸 구조 전체 복사)
  const duplicateRoom = (roomId: string, newName: string) => {
    const sourceRoom = locationData.rooms.find(r => r.id === roomId);
    if (!sourceRoom) return;

    // 선반과 칸을 새 ID로 깊은 복사
    const duplicatedShelves: LocationShelf[] = sourceRoom.shelves.map(shelf => ({
      id: generateId(),
      name: shelf.name,
      slots: shelf.slots.map(slot => ({
        id: generateId(),
        name: slot.name
      }))
    }));

    const newRoom: LocationRoom = {
      id: generateId(),
      name: newName,
      shelves: duplicatedShelves
    };

    saveData({ ...locationData, rooms: [...locationData.rooms, newRoom] });
  };

  // Shelf CRUD
  const addShelf = (roomId: string, name: string) => {
    const newShelf: LocationShelf = { id: generateId(), name, slots: [] };
    saveData({
      ...locationData,
      rooms: locationData.rooms.map(r =>
        r.id === roomId ? { ...r, shelves: [...r.shelves, newShelf] } : r
      )
    });
  };

  const updateShelf = (roomId: string, shelfId: string, name: string) => {
    saveData({
      ...locationData,
      rooms: locationData.rooms.map(r =>
        r.id === roomId
          ? { ...r, shelves: r.shelves.map(s => s.id === shelfId ? { ...s, name } : s) }
          : r
      )
    });
  };

  const deleteShelf = (roomId: string, shelfId: string) => {
    saveData({
      ...locationData,
      rooms: locationData.rooms.map(r =>
        r.id === roomId
          ? { ...r, shelves: r.shelves.filter(s => s.id !== shelfId) }
          : r
      )
    });
  };

  // 선반 복제 (칸 구조 전체 복사)
  const duplicateShelf = (roomId: string, shelfId: string, newName: string) => {
    const room = locationData.rooms.find(r => r.id === roomId);
    if (!room) return;

    const sourceShelf = room.shelves.find(s => s.id === shelfId);
    if (!sourceShelf) return;

    // 칸을 새 ID로 깊은 복사
    const newShelf: LocationShelf = {
      id: generateId(),
      name: newName,
      slots: sourceShelf.slots.map(slot => ({
        id: generateId(),
        name: slot.name
      }))
    };

    saveData({
      ...locationData,
      rooms: locationData.rooms.map(r =>
        r.id === roomId
          ? { ...r, shelves: [...r.shelves, newShelf] }
          : r
      )
    });
  };

  // Slot CRUD
  const addSlot = (roomId: string, shelfId: string, name: string) => {
    const newSlot: LocationSlot = { id: generateId(), name };
    saveData({
      ...locationData,
      rooms: locationData.rooms.map(r =>
        r.id === roomId
          ? {
              ...r,
              shelves: r.shelves.map(s =>
                s.id === shelfId ? { ...s, slots: [...s.slots, newSlot] } : s
              )
            }
          : r
      )
    });
  };

  const updateSlot = (roomId: string, shelfId: string, slotId: string, name: string) => {
    saveData({
      ...locationData,
      rooms: locationData.rooms.map(r =>
        r.id === roomId
          ? {
              ...r,
              shelves: r.shelves.map(s =>
                s.id === shelfId
                  ? { ...s, slots: s.slots.map(sl => sl.id === slotId ? { ...sl, name } : sl) }
                  : s
              )
            }
          : r
      )
    });
  };

  const deleteSlot = (roomId: string, shelfId: string, slotId: string) => {
    saveData({
      ...locationData,
      rooms: locationData.rooms.map(r =>
        r.id === roomId
          ? {
              ...r,
              shelves: r.shelves.map(s =>
                s.id === shelfId
                  ? { ...s, slots: s.slots.filter(sl => sl.id !== slotId) }
                  : s
              )
            }
          : r
      )
    });
  };

  // 위치 문자열 생성 (예: "전산1실/선반A/1칸")
  const getLocationString = (roomId: string, shelfId?: string, slotId?: string): string => {
    const room = locationData.rooms.find(r => r.id === roomId);
    if (!room) return '';

    let result = room.name;

    if (shelfId) {
      const shelf = room.shelves.find(s => s.id === shelfId);
      if (shelf) {
        result += `/${shelf.name}`;

        if (slotId) {
          const slot = shelf.slots.find(sl => sl.id === slotId);
          if (slot) {
            result += `-${slot.name}`;
          }
        }
      }
    }

    return result;
  };

  // 드롭다운용 옵션 목록 생성
  const getLocationOptions = () => {
    const options: { value: string; label: string; roomId: string; shelfId?: string; slotId?: string }[] = [];

    locationData.rooms.forEach(room => {
      // 교실만 선택하는 옵션
      options.push({
        value: room.name,
        label: room.name,
        roomId: room.id
      });

      room.shelves.forEach(shelf => {
        // 교실 + 선반 옵션
        options.push({
          value: `${room.name}/${shelf.name}`,
          label: `${room.name} > ${shelf.name}`,
          roomId: room.id,
          shelfId: shelf.id
        });

        shelf.slots.forEach(slot => {
          // 교실 + 선반 + 칸 옵션
          options.push({
            value: `${room.name}/${shelf.name}-${slot.name}`,
            label: `${room.name} > ${shelf.name} > ${slot.name}`,
            roomId: room.id,
            shelfId: shelf.id,
            slotId: slot.id
          });
        });
      });
    });

    return options;
  };

  return (
    <LocationContext.Provider value={{
      locationData,
      isLoading,
      addRoom,
      updateRoom,
      deleteRoom,
      duplicateRoom,
      addShelf,
      updateShelf,
      deleteShelf,
      duplicateShelf,
      addSlot,
      updateSlot,
      deleteSlot,
      getLocationString,
      getLocationOptions,
    }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
