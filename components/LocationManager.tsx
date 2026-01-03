import React, { useState } from 'react';
import {
  MapPin,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Building2,
  Layers,
  Grid3X3,
  Copy,
} from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import { useAppContext } from '../context/AppContext';

const LocationManager: React.FC = () => {
  const {
    locationData,
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
  } = useLocation();
  const { isDemoMode } = useAppContext();

  const [expandedRooms, setExpandedRooms] = useState<Record<string, boolean>>({});
  const [expandedShelves, setExpandedShelves] = useState<Record<string, boolean>>({});

  // 새 항목 추가 상태
  const [newRoomName, setNewRoomName] = useState('');
  const [newShelfName, setNewShelfName] = useState<Record<string, string>>({});
  const [newSlotName, setNewSlotName] = useState<Record<string, string>>({});

  // 수정 상태
  const [editingRoom, setEditingRoom] = useState<string | null>(null);
  const [editingShelf, setEditingShelf] = useState<string | null>(null);
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // 삭제 확인 모달
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'room' | 'shelf' | 'slot';
    roomId: string;
    shelfId?: string;
    slotId?: string;
    name: string;
  } | null>(null);

  // 교실 복제 모달
  const [duplicateModal, setDuplicateModal] = useState<{
    roomId: string;
    roomName: string;
  } | null>(null);
  const [duplicateName, setDuplicateName] = useState('');

  // 선반 복제 모달
  const [duplicateShelfModal, setDuplicateShelfModal] = useState<{
    roomId: string;
    shelfId: string;
    shelfName: string;
  } | null>(null);
  const [duplicateShelfName, setDuplicateShelfName] = useState('');

  const toggleRoom = (roomId: string) => {
    setExpandedRooms(prev => ({ ...prev, [roomId]: !prev[roomId] }));
  };

  const toggleShelf = (shelfKey: string) => {
    setExpandedShelves(prev => ({ ...prev, [shelfKey]: !prev[shelfKey] }));
  };

  const handleAddRoom = () => {
    if (isDemoMode) return;
    if (!newRoomName.trim()) return;
    addRoom(newRoomName.trim());
    setNewRoomName('');
  };

  const handleAddShelf = (roomId: string) => {
    if (isDemoMode) return;
    const name = newShelfName[roomId]?.trim();
    if (!name) return;
    addShelf(roomId, name);
    setNewShelfName(prev => ({ ...prev, [roomId]: '' }));
  };

  const handleAddSlot = (roomId: string, shelfId: string) => {
    if (isDemoMode) return;
    const key = `${roomId}-${shelfId}`;
    const name = newSlotName[key]?.trim();
    if (!name) return;
    addSlot(roomId, shelfId, name);
    setNewSlotName(prev => ({ ...prev, [key]: '' }));
  };

  const startEdit = (type: 'room' | 'shelf' | 'slot', id: string, currentName: string) => {
    if (isDemoMode) return;
    setEditValue(currentName);
    if (type === 'room') setEditingRoom(id);
    else if (type === 'shelf') setEditingShelf(id);
    else setEditingSlot(id);
  };

  const cancelEdit = () => {
    setEditingRoom(null);
    setEditingShelf(null);
    setEditingSlot(null);
    setEditValue('');
  };

  const confirmDelete = () => {
    if (isDemoMode) return;
    if (!deleteConfirm) return;
    const { type, roomId, shelfId, slotId } = deleteConfirm;

    if (type === 'room') {
      deleteRoom(roomId);
    } else if (type === 'shelf' && shelfId) {
      deleteShelf(roomId, shelfId);
    } else if (type === 'slot' && shelfId && slotId) {
      deleteSlot(roomId, shelfId, slotId);
    }

    setDeleteConfirm(null);
  };

  const openDuplicateModal = (roomId: string, roomName: string) => {
    if (isDemoMode) return;
    setDuplicateModal({ roomId, roomName });
    setDuplicateName(`${roomName} (복사)`);
  };

  const confirmDuplicate = () => {
    if (isDemoMode) return;
    if (!duplicateModal || !duplicateName.trim()) return;
    duplicateRoom(duplicateModal.roomId, duplicateName.trim());
    setDuplicateModal(null);
    setDuplicateName('');
  };

  const openDuplicateShelfModal = (roomId: string, shelfId: string, shelfName: string) => {
    if (isDemoMode) return;
    setDuplicateShelfModal({ roomId, shelfId, shelfName });
    setDuplicateShelfName(`${shelfName} (복사)`);
  };

  const confirmDuplicateShelf = () => {
    if (isDemoMode) return;
    if (!duplicateShelfModal || !duplicateShelfName.trim()) return;
    duplicateShelf(duplicateShelfModal.roomId, duplicateShelfModal.shelfId, duplicateShelfName.trim());
    setDuplicateShelfModal(null);
    setDuplicateShelfName('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">위치 관리</h1>
        <p className="text-gray-500 text-sm mt-1">
          교구 보관 위치를 등록하고 관리하세요. 교실 → 선반 → 칸 순으로 계층 구조로 관리됩니다.
        </p>
        {isDemoMode && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-800">
            데모 모드: 변경 사항이 저장되지 않습니다.
          </div>
        )}
      </div>

      {/* 새 교실 추가 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Building2 size={20} className="text-indigo-600" />
          새 교실/장소 추가
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="예: 전산1실, 과학실, 창고"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddRoom()}
            disabled={isDemoMode}
          />
          <button
            onClick={handleAddRoom}
            disabled={isDemoMode || !newRoomName.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Plus size={18} />
            추가
          </button>
        </div>
      </div>

      {/* 위치 목록 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <MapPin size={20} className="text-indigo-600" />
            등록된 위치
          </h2>
          <span className="text-sm text-gray-500">
            {locationData.rooms.length}개 교실
          </span>
        </div>

        {locationData.rooms.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MapPin size={48} className="mx-auto mb-3 opacity-30" />
            <p>등록된 위치가 없습니다.</p>
            <p className="text-sm mt-1">위에서 새 교실을 추가해보세요.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {locationData.rooms.map((room) => {
              const isRoomExpanded = expandedRooms[room.id];

              return (
                <div
                  key={room.id}
                  className="border border-gray-200 rounded-xl overflow-hidden"
                >
                  {/* 교실 헤더 */}
                  <div className="bg-gradient-to-r from-indigo-50 to-white p-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleRoom(room.id)}
                        className="p-1 hover:bg-indigo-100 rounded transition-colors"
                      >
                        {isRoomExpanded ? (
                          <ChevronDown size={20} className="text-gray-600" />
                        ) : (
                          <ChevronRight size={20} className="text-gray-600" />
                        )}
                      </button>

                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <Building2 size={20} className="text-indigo-600" />
                      </div>

                      {editingRoom === room.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            className="flex-1 px-3 py-1.5 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            autoFocus
                          />
                          <button
                            onClick={() => {
                              if (editValue.trim()) {
                                updateRoom(room.id, editValue.trim());
                              }
                              cancelEdit();
                            }}
                            className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{room.name}</h3>
                            <p className="text-xs text-gray-500">
                              {room.shelves.length}개 선반
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                            onClick={() => openDuplicateModal(room.id, room.name)}
                            disabled={isDemoMode}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title="복제"
                          >
                              <Copy size={16} />
                            </button>
                            <button
                            onClick={() => startEdit('room', room.id, room.name)}
                            disabled={isDemoMode}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title="수정"
                          >
                              <Edit3 size={16} />
                            </button>
                            <button
                            onClick={() => {
                              if (isDemoMode) return;
                              setDeleteConfirm({
                                type: 'room',
                                roomId: room.id,
                                name: room.name
                              });
                            }}
                            disabled={isDemoMode}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title="삭제"
                          >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 선반 목록 */}
                  {isRoomExpanded && (
                    <div className="p-4 bg-gray-50/50 space-y-3">
                      {/* 새 선반 추가 */}
                      <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="새 선반 이름 (예: 선반A, 캐비닛1)"
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                            value={newShelfName[room.id] || ''}
                            onChange={(e) => setNewShelfName(prev => ({ ...prev, [room.id]: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddShelf(room.id)}
                            disabled={isDemoMode}
                          />
                          <button
                            onClick={() => handleAddShelf(room.id)}
                            disabled={isDemoMode || !newShelfName[room.id]?.trim()}
                            className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-1"
                          >
                          <Plus size={16} />
                          선반 추가
                        </button>
                      </div>

                      {room.shelves.length === 0 ? (
                        <p className="text-center py-4 text-gray-400 text-sm">
                          선반이 없습니다. 위에서 선반을 추가하세요.
                        </p>
                      ) : (
                        room.shelves.map((shelf) => {
                          const shelfKey = `${room.id}-${shelf.id}`;
                          const isShelfExpanded = expandedShelves[shelfKey];

                          return (
                            <div
                              key={shelf.id}
                              className="bg-white border border-gray-100 rounded-lg overflow-hidden"
                            >
                              {/* 선반 헤더 */}
                              <div className="p-3 flex items-center gap-2">
                                <button
                                  onClick={() => toggleShelf(shelfKey)}
                                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                                >
                                  {isShelfExpanded ? (
                                    <ChevronDown size={16} className="text-gray-500" />
                                  ) : (
                                    <ChevronRight size={16} className="text-gray-500" />
                                  )}
                                </button>

                                <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center">
                                  <Layers size={16} className="text-blue-500" />
                                </div>

                                {editingShelf === shelf.id ? (
                                  <div className="flex items-center gap-2 flex-1">
                                    <input
                                      type="text"
                                      className="flex-1 px-2 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => {
                                        if (editValue.trim()) {
                                          updateShelf(room.id, shelf.id, editValue.trim());
                                        }
                                        cancelEdit();
                                      }}
                                      className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200"
                                    >
                                      <Check size={14} />
                                    </button>
                                    <button
                                      onClick={cancelEdit}
                                      className="p-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex-1">
                                      <span className="font-medium text-gray-800">{shelf.name}</span>
                                      <span className="text-xs text-gray-400 ml-2">
                                        ({shelf.slots.length}칸)
                                      </span>
                                    </div>
                                    <button
                                    onClick={() => openDuplicateShelfModal(room.id, shelf.id, shelf.name)}
                                    disabled={isDemoMode}
                                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    title="복제"
                                  >
                                      <Copy size={14} />
                                    </button>
                                    <button
                                    onClick={() => startEdit('shelf', shelf.id, shelf.name)}
                                    disabled={isDemoMode}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    title="수정"
                                  >
                                      <Edit3 size={14} />
                                    </button>
                                    <button
                                    onClick={() => {
                                      if (isDemoMode) return;
                                      setDeleteConfirm({
                                        type: 'shelf',
                                        roomId: room.id,
                                        shelfId: shelf.id,
                                        name: shelf.name
                                      });
                                    }}
                                    disabled={isDemoMode}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    title="삭제"
                                  >
                                      <Trash2 size={14} />
                                    </button>
                                  </>
                                )}
                              </div>

                              {/* 칸 목록 */}
                              {isShelfExpanded && (
                                <div className="px-3 pb-3 pt-1 bg-gray-50/50">
                                  {/* 새 칸 추가 */}
                                  <div className="flex gap-2 mb-2">
                                    <input
                                      type="text"
                                      placeholder="새 칸 이름 (예: 1칸, A-1)"
                                      className="flex-1 px-2 py-1.5 border border-gray-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                                      value={newSlotName[shelfKey] || ''}
                                      onChange={(e) => setNewSlotName(prev => ({ ...prev, [shelfKey]: e.target.value }))}
                                      onKeyDown={(e) => e.key === 'Enter' && handleAddSlot(room.id, shelf.id)}
                                      disabled={isDemoMode}
                                    />
                                    <button
                                      onClick={() => handleAddSlot(room.id, shelf.id)}
                                      disabled={isDemoMode || !newSlotName[shelfKey]?.trim()}
                                      className="px-2 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs flex items-center gap-1"
                                    >
                                      <Plus size={14} />
                                      칸 추가
                                    </button>
                                  </div>

                                  {shelf.slots.length === 0 ? (
                                    <p className="text-center py-2 text-gray-400 text-xs">
                                      칸이 없습니다.
                                    </p>
                                  ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                      {shelf.slots.map((slot) => (
                                        <div
                                          key={slot.id}
                                          className="flex items-center gap-1 p-2 bg-white border border-gray-100 rounded-md group"
                                        >
                                          <Grid3X3 size={14} className="text-gray-400" />

                                          {editingSlot === slot.id ? (
                                            <div className="flex items-center gap-1 flex-1">
                                              <input
                                                type="text"
                                                className="flex-1 px-1 py-0.5 border border-gray-300 rounded text-xs outline-none"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                autoFocus
                                              />
                                              <button
                                                onClick={() => {
                                                  if (editValue.trim()) {
                                                    updateSlot(room.id, shelf.id, slot.id, editValue.trim());
                                                  }
                                                  cancelEdit();
                                                }}
                                                className="p-0.5 text-green-600"
                                              >
                                                <Check size={12} />
                                              </button>
                                              <button
                                                onClick={cancelEdit}
                                                className="p-0.5 text-gray-600"
                                              >
                                                <X size={12} />
                                              </button>
                                            </div>
                                          ) : (
                                            <>
                                              <span className="flex-1 text-xs text-gray-700">{slot.name}</span>
                                              <button
                                                onClick={() => startEdit('slot', slot.id, slot.name)}
                                                disabled={isDemoMode}
                                                className="p-0.5 text-gray-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                                              >
                                                <Edit3 size={12} />
                                              </button>
                                              <button
                                                onClick={() => {
                                                  if (isDemoMode) return;
                                                  setDeleteConfirm({
                                                    type: 'slot',
                                                    roomId: room.id,
                                                    shelfId: shelf.id,
                                                    slotId: slot.id,
                                                    name: slot.name
                                                  });
                                                }}
                                                disabled={isDemoMode}
                                                className="p-0.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                                              >
                                                <Trash2 size={12} />
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 삭제 확인 모달 */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">삭제 확인</h3>
            <p className="text-gray-600 mb-4">
              <span className="font-medium text-red-600">"{deleteConfirm.name}"</span>을(를) 삭제하시겠습니까?
              {deleteConfirm.type === 'room' && (
                <span className="block text-sm text-gray-500 mt-1">
                  하위 선반과 칸도 모두 삭제됩니다.
                </span>
              )}
              {deleteConfirm.type === 'shelf' && (
                <span className="block text-sm text-gray-500 mt-1">
                  하위 칸도 모두 삭제됩니다.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 교실 복제 모달 */}
      {duplicateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Copy size={20} className="text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">교실 복제</h3>
                <p className="text-sm text-gray-500">
                  "{duplicateModal.roomName}"의 구조를 복사합니다
                </p>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                새 교실 이름
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
                placeholder="예: 전산2"
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-1">
                선반과 칸 구조가 동일하게 복사됩니다.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setDuplicateModal(null);
                  setDuplicateName('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={confirmDuplicate}
                disabled={!duplicateName.trim()}
                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                복제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 선반 복제 모달 */}
      {duplicateShelfModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Copy size={20} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">선반 복제</h3>
                <p className="text-sm text-gray-500">
                  "{duplicateShelfModal.shelfName}"의 구조를 복사합니다
                </p>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                새 선반 이름
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={duplicateShelfName}
                onChange={(e) => setDuplicateShelfName(e.target.value)}
                placeholder="예: 선반B"
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-1">
                칸 구조가 동일하게 복사됩니다.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setDuplicateShelfModal(null);
                  setDuplicateShelfName('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={confirmDuplicateShelf}
                disabled={!duplicateShelfName.trim()}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                복제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationManager;
