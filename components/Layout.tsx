import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Menu,
  X,
  Box,
  ExternalLink,
  BookOpen,
  LogOut,
  School,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const { currentSchool, logout, isAdmin } = useAuth();

  const navItems = [
    { to: '/school/dashboard', label: '대시보드', icon: LayoutDashboard },
    { to: '/school/inventory', label: '재고 관리', icon: Package },
    { to: '/school/guide', label: '사용 방법', icon: BookOpen },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 bg-white border-r border-gray-200 transform transition-all duration-200 ease-in-out relative flex-shrink-0 overflow-hidden
        ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full'}
        lg:relative lg:translate-x-0 ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
      `}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
          className="hidden lg:flex absolute -right-3 top-4 w-8 h-8 items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className="flex items-center justify-center h-16 border-b border-gray-200">
          <div className="flex items-center gap-2 font-bold text-xl text-indigo-600">
            <Box size={28} />
            {!isCollapsed && <span>에듀킷 매니저</span>}
          </div>
        </div>

        {/* 학교 정보 표시 */}
        {currentSchool && (
          <div className={`px-4 py-3 bg-indigo-50 border-b border-indigo-100 ${isCollapsed ? 'flex items-center justify-center' : ''}`}>
            {isCollapsed ? (
              <School size={18} className="text-indigo-700" />
            ) : (
              <>
                <div className="flex items-center gap-2 text-indigo-700">
                  <School size={16} />
                  <span className="font-medium text-sm">{currentSchool.name}</span>
                </div>
                <p className="text-xs text-indigo-500 mt-0.5">코드: {currentSchool.code}</p>
              </>
            )}
          </div>
        )}

        <nav className={`space-y-1 ${isCollapsed ? 'px-2 py-4' : 'p-4'}`}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={isCollapsed ? item.label : undefined}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 py-3 rounded-lg transition-colors
                ${isCollapsed ? 'justify-center px-2' : 'px-4'}
                ${isActive
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
              `}
            >
              <item.icon size={20} />
              {!isCollapsed && item.label}
              {isCollapsed && <span className="sr-only">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full">
          <div className={`border-t border-gray-200 space-y-1 ${isCollapsed ? 'px-2 py-4' : 'p-4'}`}>
            <a
              href="https://litt.ly/aklabs"
              target="_blank"
              rel="noopener noreferrer"
              title={isCollapsed ? '아크랩스 홈페이지' : undefined}
              className={`
                flex items-center gap-3 py-3 rounded-lg transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900
                ${isCollapsed ? 'justify-center px-2' : 'px-4'}
              `}
            >
              <ExternalLink size={20} />
              {!isCollapsed && '아크랩스 홈페이지'}
              {isCollapsed && <span className="sr-only">아크랩스 홈페이지</span>}
            </a>
            <a
              href="https://tally.so/r/gDedgJ"
              target="_blank"
              rel="noopener noreferrer"
              title={isCollapsed ? '수업 문의하기' : undefined}
              className={`
                flex items-center gap-3 py-3 rounded-lg transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900
                ${isCollapsed ? 'justify-center px-2' : 'px-4'}
              `}
            >
              <ExternalLink size={20} />
              {!isCollapsed && '수업 문의하기'}
              {isCollapsed && <span className="sr-only">수업 문의하기</span>}
            </a>
            <button
              onClick={handleLogout}
              title={isCollapsed ? '로그아웃' : undefined}
              className={`
                w-full flex items-center gap-3 py-3 rounded-lg transition-colors text-gray-600 hover:bg-red-50 hover:text-red-600
                ${isCollapsed ? 'justify-center px-2' : 'px-4'}
              `}
            >
              <LogOut size={20} />
              {!isCollapsed && '로그아웃'}
              {isCollapsed && <span className="sr-only">로그아웃</span>}
            </button>
          </div>
          {!isCollapsed && (
            <div className="px-4 pb-4 text-xs text-gray-400 text-center">
              v2.0.0 &copy; 2024
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="bg-white border-b border-gray-200 lg:hidden flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-2 font-bold text-lg text-indigo-600">
            <Box size={24} />
            <span>{currentSchool?.name || '에듀킷'}</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
