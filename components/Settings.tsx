import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Save, Database, ShieldAlert, Check } from 'lucide-react';

const Settings: React.FC = () => {
  const { gasUrl, setGasUrl, isDemoMode, toggleDemoMode } = useAppContext();
  const [urlInput, setUrlInput] = useState(gasUrl);
  const [showSaved, setShowSaved] = useState(false);

  const handleSave = () => {
    setGasUrl(urlInput);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">시스템 설정</h1>
        <p className="text-gray-500 text-sm">데이터베이스 연결 설정.</p>
      </div>

      {/* Mode Toggle */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${isDemoMode ? 'bg-amber-100' : 'bg-gray-100'}`}>
              <Database className={isDemoMode ? 'text-amber-600' : 'text-gray-600'} size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">데이터 소스 모드</h3>
              <p className="text-sm text-gray-500 mt-1">
                {isDemoMode 
                  ? "현재 로컬 데모 데이터를 사용 중입니다. UI 테스트용입니다." 
                  : "현재 구글 앱스스크립트(GAS) 연결을 시도합니다."}
              </p>
            </div>
          </div>
          <button
            onClick={() => toggleDemoMode(!isDemoMode)}
            className={`
              relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
              ${!isDemoMode ? 'bg-indigo-600' : 'bg-gray-200'}
            `}
          >
            <span
              className={`
                pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                ${!isDemoMode ? 'translate-x-5' : 'translate-x-0'}
              `}
            />
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 bg-gray-50 p-3 rounded-md">
          <ShieldAlert size={14} />
          <span>실제 데이터를 사용하려면 데모 모드를 끄고 아래에 API URL을 입력하세요.</span>
        </div>
      </div>

      {/* API Configuration */}
      <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-opacity ${isDemoMode ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Google Apps Script 설정</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">웹앱 URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
              />
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {showSaved ? <Check size={18} /> : <Save size={18} />}
                {showSaved ? '저장됨' : '저장'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Google Apps Script가 웹앱으로 배포되었는지, 권한이 '누구나(Anyone)'로 설정되었는지 확인하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;