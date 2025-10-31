import { useState, useEffect, useCallback, useRef } from 'react';
import { MainCollaborationEngine } from '../engines/collaboration/collaboration-engine';
import { CollaborationRoomManager, type RoomInfo } from '../engines/collaboration/room-manager';
import { OperationalTransform } from '../engines/collaboration/operational-transform';
import type { 
  CollaborationState, 
  CollaborationAction, 
  CollaborationPeer,
  CursorPosition,
  GridPosition,
  OfrendarElement
} from '../types';

export interface UseCollaborationOptions {
  onElementPlace?: (elementType: string, position: GridPosition, peerId: string) => void;
  onElementRemove?: (elementId: string, peerId: string) => void;
  onPeerJoin?: (peer: CollaborationPeer) => void;
  onPeerLeave?: (peerId: string) => void;
  onError?: (error: Error) => void;
}

export interface UseCollaborationReturn {
  // State
  state: CollaborationState;
  isLoading: boolean;
  error: string | null;
  recentRooms: RoomInfo[];
  
  // Actions
  createRoom: (name: string) => Promise<void>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => void;
  shareRoom: () => void;
  
  // Real-time features
  updateCursor: (x: number, y: number, gridPosition?: GridPosition) => void;
  sendElementPlace: (element: OfrendarElement, position: GridPosition) => void;
  sendElementRemove: (elementId: string, position: GridPosition) => void;
  
  // Utilities
  parseInviteLink: (url: string) => string | null;
  getShareableLink: () => string | null;
}

export function useCollaboration(options: UseCollaborationOptions = {}): UseCollaborationReturn {
  const [state, setState] = useState<CollaborationState>({
    roomId: undefined,
    isHost: false,
    peers: new Map(),
    cursors: new Map(),
    isConnected: false,
    connectionType: 'offline'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentRooms, setRecentRooms] = useState<RoomInfo[]>([]);
  
  const engineRef = useRef<MainCollaborationEngine | null>(null);
  const roomManagerRef = useRef<CollaborationRoomManager | null>(null);
  const operationalTransformRef = useRef<OperationalTransform | null>(null);
  const localOperationsRef = useRef<any[]>([]);

  // Initialize engines
  useEffect(() => {
    engineRef.current = new MainCollaborationEngine({
      maxPeers: 4,
      reconnectAttempts: 3,
      heartbeatInterval: 30000
    });

    roomManagerRef.current = new CollaborationRoomManager();
    operationalTransformRef.current = new OperationalTransform();

    // Set up event listeners
    const engine = engineRef.current;
    
    engine.onStateChange((newState) => {
      setState(newState);
    });

    engine.onAction((action) => {
      handleIncomingAction(action);
    });

    engine.onError((err) => {
      setError(err.message);
      options.onError?.(err);
    });

    // Load recent rooms
    loadRecentRooms();

    // Check for invite link in URL
    checkForInviteLink();

    // Cleanup on unmount
    return () => {
      engine.destroy();
    };
  }, []);

  const loadRecentRooms = useCallback(() => {
    if (roomManagerRef.current) {
      const rooms = roomManagerRef.current.getRecentRoomsList();
      setRecentRooms(rooms);
      
      // Cleanup expired rooms
      roomManagerRef.current.cleanupExpiredRooms();
    }
  }, []);

  const checkForInviteLink = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('room');
    const shouldJoin = urlParams.get('join') === 'true';
    
    if (roomId && shouldJoin && roomManagerRef.current?.isValidRoomId(roomId)) {
      // Auto-join if valid invite link
      joinRoom(roomId).catch(console.error);
    }
  }, []);

  const handleIncomingAction = useCallback((action: CollaborationAction) => {
    const ot = operationalTransformRef.current;
    if (!ot) return;

    // Convert action to operation
    const operation = ot.actionToOperation(action);
    if (!operation) return;

    // Transform against local operations
    const result = ot.transform(operation, localOperationsRef.current);
    
    if (result.shouldApply) {
      // Apply the transformed operation
      switch (result.operation.type) {
        case 'place':
          if (result.operation.elementType && result.operation.position) {
            options.onElementPlace?.(
              result.operation.elementType,
              result.operation.position,
              action.peerId
            );
          }
          break;
          
        case 'remove':
          if (result.operation.elementId) {
            options.onElementRemove?.(
              result.operation.elementId,
              action.peerId
            );
          }
          break;
      }
    }

    // Handle cursor updates
    if (action.type === 'cursor_move') {
      setState(prev => {
        const newCursors = new Map(prev.cursors);
        newCursors.set(action.peerId, action.data);
        return { ...prev, cursors: newCursors };
      });
    }

    // Handle peer events
    if (action.type === 'peer_join' && action.data.peer) {
      options.onPeerJoin?.(action.data.peer);
    }
    
    if (action.type === 'peer_leave') {
      options.onPeerLeave?.(action.peerId);
    }
  }, [options]);

  const createRoom = useCallback(async (name: string) => {
    if (!engineRef.current) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const roomId = await engineRef.current.createRoom(name);
      loadRecentRooms();
      
      // Update URL without page reload
      const url = new URL(window.location.href);
      url.searchParams.set('room', roomId);
      url.searchParams.set('host', 'true');
      window.history.replaceState({}, '', url.toString());
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear la sala';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loadRecentRooms]);

  const joinRoom = useCallback(async (roomId: string) => {
    if (!engineRef.current) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await engineRef.current.joinRoom(roomId);
      loadRecentRooms();
      
      // Update URL without page reload
      const url = new URL(window.location.href);
      url.searchParams.set('room', roomId);
      url.searchParams.delete('join');
      url.searchParams.delete('host');
      window.history.replaceState({}, '', url.toString());
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al unirse a la sala';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [loadRecentRooms]);

  const leaveRoom = useCallback(() => {
    if (!engineRef.current) return;
    
    engineRef.current.leaveRoom();
    
    // Clear URL parameters
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    url.searchParams.delete('join');
    url.searchParams.delete('host');
    window.history.replaceState({}, '', url.toString());
    
    setError(null);
  }, []);

  const shareRoom = useCallback(() => {
    if (!engineRef.current) return;
    
    const shareableLink = engineRef.current.generateShareableLink();
    if (!shareableLink) return;
    
    if (navigator.share) {
      navigator.share({
        title: 'Únete a mi Altar Colaborativo',
        text: 'Te invito a crear un altar del Día de los Muertos conmigo',
        url: shareableLink
      }).catch(console.error);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareableLink).then(() => {
        // Could show a toast notification here
        console.log('Link copied to clipboard');
      }).catch(console.error);
    }
  }, []);

  const updateCursor = useCallback((x: number, y: number, gridPosition?: GridPosition) => {
    if (!engineRef.current || !state.isConnected) return;
    
    engineRef.current.updateCursor(x, y, gridPosition);
  }, [state.isConnected]);

  const sendElementPlace = useCallback((element: OfrendarElement, position: GridPosition) => {
    if (!engineRef.current || !state.isConnected) return;
    
    const action = {
      type: 'element_place' as const,
      data: {
        elementId: `${element.id}-${Date.now()}`,
        elementType: element.type,
        position
      }
    };
    
    engineRef.current.sendAction(action);
    
    // Add to local operations for conflict resolution
    const ot = operationalTransformRef.current;
    if (ot) {
      const operation = ot.actionToOperation({
        ...action,
        peerId: 'local',
        timestamp: Date.now()
      });
      
      if (operation) {
        localOperationsRef.current.push(operation);
        // Keep only recent operations
        if (localOperationsRef.current.length > 100) {
          localOperationsRef.current = localOperationsRef.current.slice(-50);
        }
      }
    }
  }, [state.isConnected]);

  const sendElementRemove = useCallback((elementId: string, position: GridPosition) => {
    if (!engineRef.current || !state.isConnected) return;
    
    const action = {
      type: 'element_remove' as const,
      data: {
        elementId,
        position
      }
    };
    
    engineRef.current.sendAction(action);
    
    // Add to local operations for conflict resolution
    const ot = operationalTransformRef.current;
    if (ot) {
      const operation = ot.actionToOperation({
        ...action,
        peerId: 'local',
        timestamp: Date.now()
      });
      
      if (operation) {
        localOperationsRef.current.push(operation);
        // Keep only recent operations
        if (localOperationsRef.current.length > 100) {
          localOperationsRef.current = localOperationsRef.current.slice(-50);
        }
      }
    }
  }, [state.isConnected]);

  const parseInviteLink = useCallback((url: string) => {
    return roomManagerRef.current?.parseShareableLink(url) || null;
  }, []);

  const getShareableLink = useCallback(() => {
    return engineRef.current?.generateShareableLink() || null;
  }, []);

  return {
    // State
    state,
    isLoading,
    error,
    recentRooms,
    
    // Actions
    createRoom,
    joinRoom,
    leaveRoom,
    shareRoom,
    
    // Real-time features
    updateCursor,
    sendElementPlace,
    sendElementRemove,
    
    // Utilities
    parseInviteLink,
    getShareableLink
  };
}