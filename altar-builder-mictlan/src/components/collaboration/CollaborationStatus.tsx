import React from 'react';
import type { CollaborationState, CollaborationPeer } from '../../types';

interface CollaborationStatusProps {
  state: CollaborationState;
  onLeaveRoom: () => void;
  onShareRoom: () => void;
}

export const CollaborationStatus: React.FC<CollaborationStatusProps> = ({
  state,
  onLeaveRoom,
  onShareRoom
}) => {
  if (!state.isConnected || !state.roomId) {
    return null;
  }

  const connectedPeers = Array.from(state.peers.values()).filter(peer => peer.isConnected);
  const connectionTypeIcon = {
    webrtc: '🔗',
    websocket: '📡',
    offline: '❌'
  };

  return (
    <div className="fixed top-4 right-4 bg-white rounded-lg shadow-lg border p-3 z-40 min-w-64">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{connectionTypeIcon[state.connectionType]}</span>
          <span className="font-medium text-sm">
            Colaborando
          </span>
          {state.isHost && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
              Anfitrión
            </span>
          )}
        </div>
        
        <div className="flex gap-1">
          <button
            onClick={onShareRoom}
            className="p-1 hover:bg-gray-100 rounded text-sm"
            title="Compartir sala"
          >
            📤
          </button>
          <button
            onClick={onLeaveRoom}
            className="p-1 hover:bg-red-100 rounded text-sm text-red-600"
            title="Salir de la sala"
          >
            ❌
          </button>
        </div>
      </div>

      <div className="text-xs text-gray-600 mb-2">
        Sala: <span className="font-mono">{state.roomId}</span>
      </div>

      <div className="space-y-1">
        <div className="text-xs font-medium text-gray-700">
          Participantes ({connectedPeers.length + 1})
        </div>
        
        {/* Local user */}
        <div className="flex items-center gap-2 text-sm">
          <div 
            className="w-3 h-3 rounded-full bg-green-500"
          />
          <span>Tú {state.isHost ? '(Anfitrión)' : ''}</span>
        </div>
        
        {/* Connected peers */}
        {connectedPeers.map(peer => (
          <div key={peer.id} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: peer.color }}
            />
            <span>{peer.name}</span>
            <span className="text-xs text-gray-500">
              {formatLastSeen(peer.lastSeen)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-2 pt-2 border-t text-xs text-gray-500">
        Conexión: {state.connectionType.toUpperCase()}
      </div>
    </div>
  );
};

function formatLastSeen(lastSeen: Date): string {
  const now = new Date();
  const diff = now.getTime() - lastSeen.getTime();
  
  if (diff < 5000) return 'ahora';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  return `${Math.floor(diff / 3600000)}h`;
}