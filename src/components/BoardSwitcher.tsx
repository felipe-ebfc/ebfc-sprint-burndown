'use client';

import { useState, useEffect } from 'react';
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

const TOOLTIP_KEY = 'ebfc-burndown-rename-tip-seen';

export default function BoardSwitcher({ boards, activeBoardId, onSwitch, onAdd, onRemove, onRename }: BoardSwitcherProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [showTip, setShowTip] = useState(false);

  // Show tip once for new users when they have 2+ boards
  useEffect(() => {
    if (boards.length >= 2 && typeof window !== 'undefined') {
      const seen = localStorage.getItem(TOOLTIP_KEY);
      if (!seen) {
        setShowTip(true);
        const timer = setTimeout(() => {
          setShowTip(false);
          localStorage.setItem(TOOLTIP_KEY, '1');
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [boards.length]);

  const startEditing = (board: BoardMeta) => {
    setEditingId(board.id);
    setEditName(board.name);
    // Dismiss tip on first edit
    if (showTip) {
      setShowTip(false);
      if (typeof window !== 'undefined') localStorage.setItem(TOOLTIP_KEY, '1');
    }
  };

  const finishEditing = () => {
    if (editingId !== null && editName.trim()) {
      onRename(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  };

  return (
    <div style={{ position: 'relative', marginBottom: '16px' }}>
      {/* Tip toast — shows once */}
      {showTip && (
        <div
          style={{
            position: 'absolute',
            top: -32,
            left: 0,
            background: EBFC_NAVY,
            color: '#fff',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 500,
            zIndex: 10,
            animation: 'fadeInOut 5s ease-in-out',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          ✏️ Click the pencil to rename a board
        </div>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        flexWrap: 'wrap',
      }}>
        {boards.map(board => {
          const isActive = board.id === activeBoardId;
          const isHovered = hoveredId === board.id;

          return (
            <div
              key={board.id}
              style={{ display: 'flex', alignItems: 'center', position: 'relative' }}
              onMouseEnter={() => setHoveredId(board.id)}
              onMouseLeave={() => setHoveredId(null)}
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
                    borderRadius: '8px',
                    border: `2px solid ${EBFC_ACCENT}`,
                    background: '#fff',
                    color: EBFC_NAVY,
                    fontSize: '14px',
                    fontWeight: 600,
                    outline: 'none',
                    width: '140px',
                  }}
                />
              ) : (
                <button
                  onClick={() => onSwitch(board.id)}
                  onDoubleClick={() => startEditing(board)}
                  style={{
                    padding: '8px 14px',
                    paddingRight: isHovered || isActive ? '30px' : '14px',
                    borderRadius: boards.length > 1 ? '8px 0 0 8px' : '8px',
                    border: isActive
                      ? `2px solid ${EBFC_ACCENT}`
                      : '2px solid #e0e0e0',
                    background: isActive ? EBFC_NAVY : '#f5f5f5',
                    color: isActive ? '#fff' : '#666',
                    fontSize: '14px',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                    position: 'relative',
                  }}
                >
                  {board.name}
                  {/* Pencil icon on hover or active */}
                  {(isHovered || isActive) && editingId !== board.id && (
                    <span
                      onClick={e => {
                        e.stopPropagation();
                        startEditing(board);
                      }}
                      title="Rename board"
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '11px',
                        opacity: isHovered ? 1 : 0.5,
                        cursor: 'pointer',
                        transition: 'opacity 0.15s ease',
                        lineHeight: 1,
                      }}
                    >
                      ✏️
                    </span>
                  )}
                </button>
              )}
              {boards.length > 1 && editingId !== board.id && (
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
                    border: isActive
                      ? `2px solid ${EBFC_ACCENT}`
                      : '2px solid #e0e0e0',
                    borderLeft: 'none',
                    background: isActive ? '#2a347e' : '#eee',
                    color: isActive ? '#ff9999' : '#999',
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
          );
        })}
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

      <style jsx>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(4px); }
          10% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
