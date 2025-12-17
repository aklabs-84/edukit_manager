import React from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CheckCircle, PackageSearch, Clock, RefreshCw } from 'lucide-react';
import { ItemStatus } from '../types';

const Dashboard: React.FC = () => {
  const { allItems, items, isLoading, refreshItems, isDemoMode, selectedSchool } = useAppContext();
  const { currentSchool, isAdmin } = useAuth();

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
