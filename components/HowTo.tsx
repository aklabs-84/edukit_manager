import React from 'react';
import { Info, Plus, ClipboardList, Edit2, RefreshCw, Search, ShieldCheck, MapPin, Tags } from 'lucide-react';

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
            <Plus size={18} /> 1) 교구 추가하기
          </div>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>재고 관리 화면 오른쪽 위 <span className="font-semibold">“교구 추가”</span> 버튼을 누릅니다.</li>
            <li>교구명과 카테고리(복수 선택 가능), 수량, 보관 위치를 입력합니다.</li>
            <li>사진을 올리려면 이미지 URL을 붙여넣거나, 파일 선택으로 업로드합니다.</li>
            <li>비고에 파손 여부, 대여 현황 등 추가 메모를 남길 수 있습니다.</li>
            <li>저장을 누르면 바로 목록과 학교 재고에 반영됩니다.</li>
          </ol>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold">
            <ClipboardList size={18} /> 2) 입력 시 참고사항
          </div>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
            <li>현재 로그인한 학교로 자동 지정되니 <span className="font-semibold">학교 필드는 수정할 필요가 없습니다.</span></li>
            <li>카테고리를 여러 개 눌러 선택하면 필터링과 검색이 편해집니다.</li>
            <li>학교별 카테고리는 왼쪽 메뉴 <span className="font-semibold">“카테고리 추가”</span>에서 등록한 뒤, 교구 입력 화면에서 선택합니다.</li>
            <li>수량은 숫자만 입력하며, 상태(재고 있음/부족/품절)는 수량에 따라 자동 표시됩니다.</li>
            <li>이미지 링크가 없을 때는 비워두면 “이미지 보기” 버튼이 숨겨집니다.</li>
          </ul>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold">
            <Edit2 size={18} /> 3) 수정·삭제
          </div>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
            <li>목록에서 연필 아이콘을 눌러 교구 정보를 변경하고 저장합니다.</li>
            <li>삭제는 휴지통 아이콘 → 확인 버튼을 눌러 확정합니다.</li>
            <li>이미지, 비고, 카테고리를 수정하면 즉시 반영됩니다.</li>
          </ul>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold">
            <Search size={18} /> 4) 검색·필터·새로고침
          </div>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
            <li>상단 검색창에서 교구명, 카테고리, 위치, 비고로 빠르게 찾을 수 있습니다.</li>
            <li>카테고리를 여러 개 선택하면 해당 태그가 모두 적용된 교구만 표시됩니다.</li>
            <li><RefreshCw size={14} className="inline-block align-middle" /> 새로고침 버튼으로 최신 재고를 다시 불러옵니다.</li>
          </ul>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold">
            <MapPin size={18} /> 5) 위치·카테고리 등록
          </div>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
            <li>왼쪽 메뉴 <span className="font-semibold">“위치 관리”</span>에서 교실 → 선반 → 칸을 순서대로 추가합니다.</li>
            <li>위치가 등록되면 교구 입력 화면에서 드롭다운으로 빠르게 선택할 수 있습니다.</li>
            <li className="flex items-start gap-2">
              <Tags size={14} className="mt-0.5 text-indigo-500" />
              <span><span className="font-semibold">“카테고리 추가”</span>에서 학교별 카테고리를 등록하고, 교구 입력 시 복수 선택할 수 있습니다.</span>
            </li>
            <li>위치와 카테고리를 잘 정리해두면 대시보드에서 교실/선반별로 보기 쉬워집니다.</li>
          </ul>
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 flex items-start gap-3">
        <ShieldCheck className="text-indigo-600 mt-1" size={20} />
        <div className="text-sm text-gray-700 leading-relaxed">
          <p className="font-semibold text-indigo-700 mb-1">문제 해결 팁</p>
          <ul className="list-disc list-inside space-y-1">
            <li>수정/저장이 실패하면: 페이지를 새로고침하거나 브라우저를 닫았다 다시 열고 다시 시도해 보세요.</li>
            <li>계속 실패할 경우: 입력한 내용을 삭제한 뒤, 같은 내용으로 다시 입력해 저장해 보세요.</li>
            <li>문제가 지속되면: <a href="https://litt.ly/aklabs" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">홈페이지 문의하기</a>를 통해 상황을 알려주세요.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HowTo;
