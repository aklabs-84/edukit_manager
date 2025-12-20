import React, { useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CheckCircle, PackageSearch, Clock, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { ItemStatus } from '../types';

const Dashboard: React.FC = () => {
  const { allItems, items, isLoading, isInitialized, refreshItems, isDemoMode, selectedSchool } = useAppContext();
  const { currentSchool, isAdmin } = useAuth();
  const [expandedLocations, setExpandedLocations] = useState<Record<string, boolean>>({});

  // 학교 사용자는 자기 학교 데이터만, 관리자는 필터링된 데이터
  const filteredItems = currentSchool
    ? items  // 학교 사용자는 items 사용 (이미 해당 학교 데이터만 있음)
    : selectedSchool === '모두'
      ? allItems
      : allItems.filter(item => item.school === selectedSchool);

  // Stats Logic
  const totalItems = filteredItems.length;
  const totalQuantity = filteredItems.reduce((sum, item) => sum + Number(item.quantity), 0);
  
  // Recent items (Sorted by lastUpdated descending)
  const recentItems = [...filteredItems]
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
    .slice(0, 5);

  // 위치 문자열 파싱 함수: "전산1/선반A-2칸" -> { room: "전산1", shelf: "선반A", slot: "2칸" }
  const parseLocation = (location: string) => {
    const trimmed = location?.trim() || '미지정';
    const singleLocation = trimmed.split(',')[0]?.trim() || '미지정';

    // "/" 또는 공백으로 분리 시도
    const parts = singleLocation.split(/[\/\s]+/).filter(Boolean);

    if (parts.length === 1) {
      // 단일 위치인 경우 (예: "창고")
      return { room: parts[0], shelf: null, slot: null };
    }

    // 첫 번째는 교실, 나머지는 선반/칸 정보
    const room = parts[0];
    const rest = parts.slice(1).join(' ');

    // "선반A-2칸" 패턴 파싱
    const shelfMatch = rest.match(/^(선반[A-Za-z가-힣0-9]+)[-\s]?(.*)$/);
    if (shelfMatch) {
      return {
        room,
        shelf: shelfMatch[1],
        slot: shelfMatch[2] || null
      };
    }

    // 그 외의 경우 전체를 shelf로
    return { room, shelf: rest || null, slot: null };
  };

  // 계층적 위치 데이터 구조
  interface SlotData {
    name: string;
    itemCount: number;
    totalQuantity: number;
    items: string[];
  }

  interface ShelfData {
    name: string;
    itemCount: number;
    totalQuantity: number;
    slots: Map<string, SlotData>;
  }

  interface RoomData {
    name: string;
    itemCount: number;
    totalQuantity: number;
    shelves: Map<string, ShelfData>;
  }

  // Location Data - 계층적 구조로 변환
  const locationTree = useMemo(() => {
    const rooms = new Map<string, RoomData>();

    filteredItems.forEach(item => {
      const { room, shelf, slot } = parseLocation(item.location);
      const quantity = Number(item.quantity) || 0;

      // Room 레벨
      if (!rooms.has(room)) {
        rooms.set(room, { name: room, itemCount: 0, totalQuantity: 0, shelves: new Map() });
      }
      const roomData = rooms.get(room)!;
      roomData.itemCount += 1;
      roomData.totalQuantity += quantity;

      // Shelf 레벨
      const shelfKey = shelf || '기타';
      if (!roomData.shelves.has(shelfKey)) {
        roomData.shelves.set(shelfKey, { name: shelfKey, itemCount: 0, totalQuantity: 0, slots: new Map() });
      }
      const shelfData = roomData.shelves.get(shelfKey)!;
      shelfData.itemCount += 1;
      shelfData.totalQuantity += quantity;

      // Slot 레벨
      const slotKey = slot || '전체';
      if (!shelfData.slots.has(slotKey)) {
        shelfData.slots.set(slotKey, { name: slotKey, itemCount: 0, totalQuantity: 0, items: [] });
      }
      const slotData = shelfData.slots.get(slotKey)!;
      slotData.itemCount += 1;
      slotData.totalQuantity += quantity;
      if (slotData.items.length < 3) {
        slotData.items.push(item.name);
      }
    });

    // 정렬해서 배열로 변환
    return Array.from(rooms.values())
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
      .map(room => ({
        ...room,
        shelves: Array.from(room.shelves.values())
          .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
          .map(shelf => ({
            ...shelf,
            slots: Array.from(shelf.slots.values())
              .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
          }))
      }));
  }, [filteredItems]);


  // Chart Data: Quantity by Category
  const categoryData = filteredItems.reduce((acc, item) => {
    const categories = item.category.split(',').map(c => c.trim()).filter(Boolean);
    categories.forEach((cat) => {
      const existing = acc.find(x => x.name === cat);
      if (existing) {
        existing.value += Number(item.quantity);
      } else {
        acc.push({ name: cat, value: Number(item.quantity) });
      }
    });
    return acc;
  }, [] as { name: string; value: number }[]);

  const StatCard = ({ title, value, icon: Icon, color, subText }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <h3 className="text-3xl font-bold mt-2 text-gray-800">{value}</h3>
        {subText && <p className="text-xs text-gray-400 mt-1">{subText}</p>}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  );

  const displaySchoolName = currentSchool?.name || selectedSchool;

  const toggleLocation = (key: string) => {
    setExpandedLocations(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4 bg-white/70 backdrop-blur rounded-2xl px-6 py-8 shadow-sm border border-gray-100">
          <RefreshCw size={28} className="animate-spin text-indigo-600" />
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-800">데이터 불러오는 중</p>
            <p className="text-sm text-gray-500">최신 데이터를 가져오고 있습니다...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
          <p className="text-gray-500 text-sm mt-1">
            {displaySchoolName === '모두' ? '모든 학교 교구 현황' : `${displaySchoolName} 교구 현황`}
            {isDemoMode && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">데모 모드</span>}
          </p>
        </div>
        <button
          onClick={() => refreshItems()}
          disabled={isLoading}
          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
          title="데이터 새로고침"
        >
          <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="총 품목 수"
          value={totalItems}
          icon={PackageSearch}
          color="bg-blue-500"
          subText="등록된 교구 종류"
        />
        <StatCard
          title="총 수량"
          value={totalQuantity}
          icon={CheckCircle}
          color="bg-green-500"
          subText="전체 교구 개수"
        />
      </div>

      {/* Location Overview - 계층 트리 구조 */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-800">위치별 교구</h2>
            <p className="text-sm text-gray-500">교실 → 선반 → 칸 순으로 정리된 교구 현황</p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 whitespace-nowrap">
            {locationTree.length}개 교실
          </span>
        </div>
        {locationTree.length === 0 ? (
          <p className="text-gray-400 text-center py-6">등록된 교구가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {locationTree.map((room) => {
              const roomExpanded = !!expandedLocations[`room:${room.name}`];
              return (
                <div
                  key={room.name}
                  className="border border-gray-200 rounded-xl overflow-hidden"
                >
                  {/* 교실 레벨 */}
                  <button
                    type="button"
                    onClick={() => toggleLocation(`room:${room.name}`)}
                    className="w-full text-left bg-gradient-to-r from-indigo-50 to-white p-4 hover:from-indigo-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                          <span className="text-indigo-600 font-bold text-sm">
                            {room.name.replace(/[^0-9]/g, '') || room.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{room.name}</h3>
                          <p className="text-xs text-gray-500">
                            {room.shelves.length}개 선반 · {room.itemCount}개 교구
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-indigo-600">
                          총 {room.totalQuantity}개
                        </span>
                        {roomExpanded ? (
                          <ChevronUp size={20} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={20} className="text-gray-400" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* 선반 레벨 */}
                  {roomExpanded && (
                    <div className="bg-gray-50/50 p-3 space-y-2">
                      {room.shelves.map((shelf) => {
                        const shelfExpanded = !!expandedLocations[`shelf:${room.name}:${shelf.name}`];
                        return (
                          <div
                            key={shelf.name}
                            className="bg-white rounded-lg border border-gray-100 overflow-hidden"
                          >
                            <button
                              type="button"
                              onClick={() => toggleLocation(`shelf:${room.name}:${shelf.name}`)}
                              className="w-full text-left p-3 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-6 rounded-full bg-indigo-300" />
                                  <span className="font-medium text-gray-800">{shelf.name}</span>
                                  <span className="text-xs text-gray-400">
                                    ({shelf.slots.length}칸)
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                    {shelf.itemCount}개 교구
                                  </span>
                                  {shelfExpanded ? (
                                    <ChevronUp size={16} className="text-gray-400" />
                                  ) : (
                                    <ChevronDown size={16} className="text-gray-400" />
                                  )}
                                </div>
                              </div>
                            </button>

                            {/* 칸 레벨 */}
                            {shelfExpanded && (
                              <div className="px-3 pb-3">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                  {shelf.slots.map((slot) => (
                                    <div
                                      key={slot.name}
                                      className="p-2 rounded-md bg-gray-50 border border-gray-100"
                                    >
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-medium text-gray-700">
                                          {slot.name}
                                        </span>
                                        <span className="text-xs text-indigo-600 font-semibold">
                                          {slot.itemCount}개
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-gray-400 truncate" title={slot.items.join(', ')}>
                                        {slot.items.length > 0 ? slot.items.join(', ') : '-'}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[350px]">
          <h2 className="text-lg font-bold text-gray-800 mb-4">카테고리별 재고</h2>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#818cf8'} />
                    ))}
                  </Bar>
                </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">최근 활동</h2>
          <div className="space-y-4">
            {recentItems.length === 0 ? (
              <p className="text-gray-400 text-center py-8">최근 활동 없음</p>
            ) : (
              recentItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                  <div className="p-2 bg-indigo-50 rounded-md text-indigo-600">
                    <Clock size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.category} • {item.location}</p>
                  </div>
                  <div className="text-right">
                    <span className={`
                      inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                      ${item.quantity > 10 ? 'bg-green-100 text-green-800' : 
                        item.quantity > 0 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}
                    `}>
                      수량: {item.quantity}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(item.lastUpdated).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
