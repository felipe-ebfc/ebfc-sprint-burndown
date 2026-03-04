'use client';

import { useState } from 'react';
import { BoardMeta } from '../lib/types';
import { MAX_BOARDS, EBFC_NAVY, EBFC_ACCENT, EBFC_BLUE } from '../lib/constants';

interface BoardSwitcherProps {
  boards: BoardMeta[];
  activeBoardId: number;
  onSwitch: (boardId: number) => void;
  onAdd: () => void;
  onRemove: (boardId: number) => void;
  onRename: (boardId: number, name: string) => void;
}

export default function BoardSwitcher({ boards, activeBoardId, onSwitch, onAdd, onRemove, onRename }: BoardSwitcherProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const startEditing = (board: BoardMeta) => {
    setEditingId(board.id);
    setEditName(board.name);
  };

  const finishEditing = () => {
    if (editingId !== null && editName.trim()) {
      onRename(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      marginBottom: '16px',
      flexWrap: 'wrap',
    }}>
      {boards.map(board => (
        <div
          key={board.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0',
          }}
        >
          {editingId === board.id ? (
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onBlur={finishEditing}
              onKeyDown={e => {
                if (e.key === 'Enter') finishEditing();
                if (e.key === 'Escape') { setEditingId(null); setEditName(''); }
              }}
              autoFocus
              style={{
                padding: '8px 12px',
                borderRadius: '8px 0 0 8px',
                border: `2px solid ${EBFC_ACCENT}`,
                background: '#fff',
                color: EBFC_NAVY,
                fontSize: '14px',
                fontWeight: 600,
                outline: 'none',
                width: '120px',
              }}
            />
          ) : (
            <button
              onClick={() => onSwitch(board.id)}
              onDoubleClick={() => startEditing(board)}
              title="Click to switch · Double-click to rename"
              style={{
                padding: '8px 14px',
                borderRadius: boards.length > 1 ? '8px 0 0 8px' : '8px',
                border: board.id === activeBoardId
                  ? `2px solid ${EBFC_ACCENT}`
                  : '2px solid #e0e0e0',
                background: board.id === activeBoardId ? EBFC_NAVY : '#f5f5f5',
                color: board.id === activeBoardId ? '#fff' : '#666',
                fontSize: '14px',
                fontWeight: board.id === activeBoardId ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {board.name}
            </button>
          )}
          {boards.length > 1 && (
            <button
              onClick={() => {
                if (confirm(`Remove "${board.name}"? Sprint data will be lost.`)) {
                  onRemove(board.id);
                }
              }}
              title={`Remove ${board.name}`}
              style={{
                padding: '8px 8px',
                borderRadius: '0 8px 8px 0',
                border: board.id === activeBoardId
                  ? `2px solid ${EBFC_ACCENT}`
                  : '2px solid #e0e0e0',
                borderLeft: 'none',
                background: board.id === activeBoardId ? '#2a347e' : '#eee',
                color: board.id === activeBoardId ? '#ff9999' : '#999',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          )}
        </div>
      ))}
      {boards.length < MAX_BOARDS && (
        <button
          onClick={onAdd}
          title="Add new board"
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            border: '2px dashed #ccc',
            background: 'transparent',
            color: EBFC_BLUE,
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          + Board
        </button>
      )}
    </div>
  );
}
