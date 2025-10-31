import React, { useState, useEffect } from 'react';
import type { RoomInfo } from '../../engines/collaboration';

interface CollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (name: string) => Promise<void>;
  onJoinRoom: (roomId: string) => Promise<void>;
  recentRooms: RoomInfo[];
  isLoading: boolean;
  error?: string;
}

export const CollaborationModal: React.FC<CollaborationModalProps> = ({
  isOpen,
  onClose,
  onCreateRoom,
  onJoinRoom,
  recentRooms,
  isLoading,
  error
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join' | 'recent'>('create');
  const [roomName, setRoomName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [localError, setLocalError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setLocalError('');
      setRoomName('');
      setRoomId('');
    }
  }, [isOpen]);

  useEffect(() => {
    // Check for room ID in URL when modal opens
    if (isOpen) {
      const urlParams = new URLSearchParams(window.location.search);
      const urlRoomId = urlParams.get('room');
      const shouldJoin = urlParams.get('join') === 'true';
      
      if (urlRoomId && shouldJoin) {
        setActiveTab('join');
        setRoomId(urlRoomId);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      setLocalError('Por favor ingresa un nombre para la sala');
      return;
    }

    try {
      setLocalError('');
      await onCreateRoom(roomName.trim());
      onClose();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Error al crear la sala');
    }
  };

  const handleJoinRoom = async () => {
    if (!roomId.trim()) {
      setLocalError('Por favor ingresa el ID de la sala');
      return;
    }

    try {
      setLocalError('');
      await onJoinRoom(roomId.trim());
      onClose();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Error al unirse a la sala');
    }
  };

  const handleJoinRecentRoom = async (room: RoomInfo) => {
    try {
      setLocalError('');
      await onJoinRoom(room.id);
      onClose();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Error al unirse a la sala');
    }
  };

  const displayError = error || localError;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Colaboración en Tiempo Real
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isLoading}
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b mb-4">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'create'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Crear Sala
            </button>
            <button
              onClick={() => setActiveTab('join')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'join'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Unirse
            </button>
            {recentRooms.length > 0 && (
              <button
                onClick={() => setActiveTab('recent')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'recent'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Recientes
              </button>
            )}
          </div>

          {/* Error Display */}
          {displayError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {displayError}
            </div>
          )}

          {/* Create Room Tab */}
          {activeTab === 'create' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Sala
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Mi Altar Colaborativo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                  maxLength={50}
                />
              </div>
              
              <div className="text-sm text-gray-600">
                <p>• Hasta 4 personas pueden colaborar</p>
                <p>• Comparte el enlace para invitar a otros</p>
                <p>• Los cambios se sincronizan en tiempo real</p>
              </div>

              <button
                onClick={handleCreateRoom}
                disabled={isLoading || !roomName.trim()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creando...' : 'Crear Sala'}
              </button>
            </div>
          )}

          {/* Join Room Tab */}
          {activeTab === 'join' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID de la Sala
                </label>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="brillante-altar-123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>
              
              <div className="text-sm text-gray-600">
                <p>Ingresa el ID de la sala que te compartieron para unirte a la colaboración.</p>
              </div>

              <button
                onClick={handleJoinRoom}
                disabled={isLoading || !roomId.trim()}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Conectando...' : 'Unirse a la Sala'}
              </button>
            </div>
          )}

          {/* Recent Rooms Tab */}
          {activeTab === 'recent' && (
            <div className="space-y-3">
              {recentRooms.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No hay salas recientes
                </div>
              ) : (
                <>
                  <div className="text-sm text-gray-600 mb-3">
                    Salas visitadas recientemente:
                  </div>
                  {recentRooms.map((room) => (
                    <div
                      key={room.id}
                      className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleJoinRecentRoom(room)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{room.name}</div>
                          <div className="text-xs text-gray-500">
                            ID: {room.id}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(room.createdAt)} • {room.participants} participantes
                          </div>
                        </div>
                        <div className="text-blue-600">
                          →
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 86400000) { // Less than 24 hours
    return date.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else {
    return date.toLocaleDateString('es-MX', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
}