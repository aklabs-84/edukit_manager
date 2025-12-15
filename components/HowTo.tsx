import React from 'react';
import { Info, Link as LinkIcon, RefreshCw, Database, ShieldCheck, ListChecks } from 'lucide-react';

const HowTo: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Info className="text-indigo-600" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">사용 방법</h1>
          <p className="text-gray-500 text-sm">구글 스프레드시트와 연결해 학교별 교구를 관리하는 방법을 안내합니다.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold">
            <LinkIcon size={18} /> 1) 구글 시트 연결
          </div>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>구글 시트 → 확장 프로그램 → 앱스 스크립트 → 제공된 스크립트를 붙여넣고 <span className="font-semibold">웹 앱</span>으로 배포합니다.</li>
            <li>배포 시 <span className="font-semibold">실행자: 나</span>, <span className="font-semibold">액세스: 모두(익명)</span>로 설정 후 생성된 웹앱 URL을 복사합니다.</li>
            <li>웹앱에서 <span className="font-semibold">설정</span> 메뉴 → URL 입력 후 저장하고 <span className="font-semibold">데모 모드</span>를 끕니다.</li>
          </ol>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold">
            <Database size={18} /> 2) 학교별 데이터 사용
          </div>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
            <li><span className="font-semibold">재고 관리</span> 상단의 학교 선택으로 학교별 시트를 전환합니다.</li>
            <li><span className="font-semibold">모두</span>를 선택하면 모든 학교 데이터를 한 번에 조회합니다.</li>
            <li>추가/수정 시 모달의 <span className="font-semibold">학교</span> 필드 값 기준으로 해당 학교 시트에 저장됩니다.</li>
          </ul>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold">
            <ListChecks size={18} /> 3) CRUD 사용법
          </div>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
            <li><span className="font-semibold">교구 추가</span>: 상단 버튼 → 필수 필드 입력 → 저장.</li>
            <li><span className="font-semibold">수정</span>: 목록의 연필 아이콘 클릭 후 수정/저장.</li>
            <li><span className="font-semibold">삭제</span>: 휴지통 아이콘 → 확인.</li>
            <li>수량에 따라 상태가 자동 계산되며, 기타 사항에 전달 메모를 남길 수 있습니다.</li>
          </ul>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold">
            <RefreshCw size={18} /> 4) 동기화 & 새로고침
          </div>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
            <li>상단 새로고침 아이콘으로 스프레드시트와 즉시 동기화합니다.</li>
            <li>데모 모드를 켜면 로컬 mock 데이터로만 동작하니, 실제 시트 반영 시 데모 모드를 꺼주세요.</li>
          </ul>
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 flex items-start gap-3">
        <ShieldCheck className="text-indigo-600 mt-1" size={20} />
        <div className="text-sm text-gray-700 leading-relaxed">
          <p className="font-semibold text-indigo-700 mb-1">문제 해결 팁</p>
          <ul className="list-disc list-inside space-y-1">
            <li>시트에 데이터가 안 보이면: URL과 권한(실행자: 나, 액세스: 모두)을 다시 확인하고 웹앱을 재배포하세요.</li>
            <li>학교가 추가되면: 학교 선택에서 새 학교 이름을 입력해 저장하면 해당 이름으로 시트가 자동 생성됩니다.</li>
            <li>느린 경우: 데모 모드로 UI만 테스트하거나, “모두” 대신 특정 학교만 조회해 호출량을 줄여보세요.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HowTo;
