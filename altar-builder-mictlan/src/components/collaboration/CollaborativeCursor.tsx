import React from 'react';
import type { CollaborationPeer, CursorPosition } from '../../types';

interface CollaborativeCursorProps {
  peer: CollaborationPeer;
  cursor: CursorPosition;
  isVisible: boolean;
}

export const CollaborativeCursor: React.FC<CollaborativeCursorProps> = ({
  peer,
  cursor,
  isVisible
}) => {
  if (!isVisible) return null;

  return (
    <div
      className="fixed pointer-events-none z-50 transition-all duration-100 ease-out"
      style={{
        left: cursor.x,
        top: cursor.y,
        transform: 'translate(-2px, -2px)'
      }}
    >
      {/* Cursor pointer */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        className="drop-shadow-md"
      >
        <path
          d="M0 0L0 16L5 11L8 16L11 14L8 9L16 9L0 0Z"
          fill={peer.color}
          stroke="white"
          strokeWidth="1"
        />
      </svg>
      
      {/* User name label */}
      <div
        className="absolute top-5 left-2 px-2 py-1 rounded text-xs font-medium text-white shadow-lg whitespace-nowrap"
        style={{ backgroundColor: peer.color }}
      >
        {peer.name}
      </div>
      
      {/* Grid position indicator */}
      {cursor.gridPosition && (
        <div
          className="absolute top-8 left-2 px-1 py-0.5 rounded text-xs bg-black bg-opacity-75 text-white"
        >
          {cursor.gridPosition.row + 1},{cursor.gridPosition.col + 1}
        </div>
      )}
    </div>
  );
};

interface CollaborativeCursorsProps {
  peers: Map<string, CollaborationPeer>;
  cursors: Map<string, CursorPosition>;
  showCursors: boolean;
}

export const CollaborativeCursors: React.FC<CollaborativeCursorsProps> = ({
  peers,
  cursors,
  showCursors
}) => {
  if (!showCursors) return null;

  return (
    <>
      {Array.from(peers.entries()).map(([peerId, peer]) => {
        const cursor = cursors.get(peerId);
        if (!cursor || !peer.isConnected) return null;

        return (
          <CollaborativeCursor
            key={peerId}
            peer={peer}
            cursor={cursor}
            isVisible={true}
          />
        );
      })}
    </>
  );
};