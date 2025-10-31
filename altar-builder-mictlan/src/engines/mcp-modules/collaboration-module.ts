// Collaboration MCP Module for Altar Builder Mictlán

import type {
  CollaborationMCPModule,
  CollaborationState,
  CollaborationActions,
  MCPAction,
  JoinRoomPayload,
  SyncStatePayload,
  BroadcastCursorPayload,
  CollaborationPeer,
  CursorPosition
} from '../../types/mcp';

// Initial collaboration state
const initialCollaborationState: CollaborationState = {
  roomId: undefined,
  peers: [],
  cursors: new Map(),
  isHost: false,
  connectionStatus: 'disconnected'
};

// Collaboration actions implementation
const collaborationActions: CollaborationActions = {
  joinRoom: (payload: JoinRoomPayload): MCPAction<JoinRoomPayload> => ({
    type: 'joinRoom',
    payload,
    timestamp: new Date(),
    id: `join-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source: 'local'
  }),

  leaveRoom: (roomId: string): MCPAction<{ roomId: string }> => ({
    type: 'leaveRoom',
    payload: { roomId },
    timestamp: new Date(),
    id: `leave-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source: 'local'
  }),

  syncState: (payload: SyncStatePayload): MCPAction<SyncStatePayload> => ({
    type: 'syncState',
    payload,
    timestamp: new Date(),
    id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source: 'remote'
  }),

  broadcastCursor: (payload: BroadcastCursorPayload): MCPAction<BroadcastCursorPayload> => ({
    type: 'broadcastCursor',
    payload,
    timestamp: new Date(),
    id: `cursor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source: 'remote'
  })
};

// Collaboration state reducer
const collaborationReducer = (state: CollaborationState, action: MCPAction): CollaborationState => {
  switch (action.type) {
    case 'joinRoom': {
      const { roomId, userId, userName } = action.payload as JoinRoomPayload;
      
      // Check if this is the first user (host)
      const isHost = state.peers.length === 0;
      
      // Add new peer if not already present
      const existingPeerIndex = state.peers.findIndex(p => p.id === userId);
      let updatedPeers = [...state.peers];
      
      if (existingPeerIndex === -1) {
        const newPeer: CollaborationPeer = {
          id: userId,
          name: userName,
          isHost,
          connectionStatus: 'connected',
          lastSeen: new Date()
        };
        updatedPeers.push(newPeer);
      } else {
        // Update existing peer
        updatedPeers[existingPeerIndex] = {
          ...updatedPeers[existingPeerIndex],
          connectionStatus: 'connected',
          lastSeen: new Date()
        };
      }

      return {
        ...state,
        roomId,
        peers: updatedPeers,
        isHost: isHost || state.isHost,
        connectionStatus: 'connected'
      };
    }

    case 'leaveRoom': {
      const { roomId } = action.payload as { roomId: string };
      
      if (state.roomId !== roomId) {
        console.warn('[Collaboration Module] Leave room called for different room');
        return state;
      }

      return {
        ...initialCollaborationState,
        connectionStatus: 'disconnected'
      };
    }

    case 'syncState': {
      const { altarState, userState, timestamp } = action.payload as SyncStatePayload;
      
      console.log('[Collaboration Module] Received state sync:', { altarState, userState, timestamp });
      
      // The actual state synchronization will be handled by the MCP bridge
      // This action serves as a notification that sync occurred
      return state;
    }

    case 'broadcastCursor': {
      const { userId, position, action: cursorAction } = action.payload as BroadcastCursorPayload;
      
      const newCursors = new Map(state.cursors);
      const cursorPosition: CursorPosition = {
        x: position.x,
        y: position.y,
        userId,
        action: cursorAction,
        timestamp: new Date()
      };
      
      newCursors.set(userId, cursorPosition);
      
      return {
        ...state,
        cursors: newCursors
      };
    }

    default:
      console.warn('[Collaboration Module] Unknown action type:', action.type);
      return state;
  }
};

// Create and export the collaboration module
export const collaborationModule: CollaborationMCPModule = {
  name: 'collaboration',
  state: initialCollaborationState,
  actions: collaborationActions,
  reducer: collaborationReducer,
  middleware: []
};

// Helper functions for collaboration operations
export const collaborationHelpers = {
  // Generate unique room ID
  generateRoomId: (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Generate unique user ID
  generateUserId: (): string => {
    return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Check if user is connected to a room
  isConnected: (state: CollaborationState): boolean => {
    return state.connectionStatus === 'connected' && !!state.roomId;
  },

  // Get active peers (connected within last 30 seconds)
  getActivePeers: (state: CollaborationState): CollaborationPeer[] => {
    const thirtySecondsAgo = new Date(Date.now() - 30000);
    return state.peers.filter(peer => 
      peer.connectionStatus === 'connected' && 
      peer.lastSeen > thirtySecondsAgo
    );
  },

  // Get active cursors (updated within last 5 seconds)
  getActiveCursors: (state: CollaborationState): CursorPosition[] => {
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    return Array.from(state.cursors.values()).filter(cursor => 
      cursor.timestamp > fiveSecondsAgo
    );
  },

  // Update peer connection status
  updatePeerStatus: (
    state: CollaborationState, 
    userId: string, 
    status: CollaborationPeer['connectionStatus']
  ): CollaborationState => {
    const updatedPeers = state.peers.map(peer => 
      peer.id === userId 
        ? { ...peer, connectionStatus: status, lastSeen: new Date() }
        : peer
    );

    return {
      ...state,
      peers: updatedPeers
    };
  },

  // Remove peer from room
  removePeer: (state: CollaborationState, userId: string): CollaborationState => {
    const updatedPeers = state.peers.filter(peer => peer.id !== userId);
    const updatedCursors = new Map(state.cursors);
    updatedCursors.delete(userId);

    // If the host left, assign new host
    let newState = {
      ...state,
      peers: updatedPeers,
      cursors: updatedCursors
    };

    if (updatedPeers.length > 0 && !updatedPeers.some(p => p.isHost)) {
      newState.peers[0].isHost = true;
    }

    return newState;
  },

  // Clean up old cursors and inactive peers
  cleanup: (state: CollaborationState): CollaborationState => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000);

    // Remove inactive peers
    const activePeers = state.peers.filter(peer => 
      peer.lastSeen > fiveMinutesAgo
    );

    // Remove old cursors
    const activeCursors = new Map();
    state.cursors.forEach((cursor, userId) => {
      if (cursor.timestamp > thirtySecondsAgo) {
        activeCursors.set(userId, cursor);
      }
    });

    return {
      ...state,
      peers: activePeers,
      cursors: activeCursors
    };
  },

  // Create shareable room URL
  createRoomUrl: (roomId: string): string => {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?room=${roomId}`;
  },

  // Extract room ID from URL
  extractRoomIdFromUrl: (): string | null => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('room');
  },

  // Check if current user is host
  isCurrentUserHost: (state: CollaborationState, currentUserId: string): boolean => {
    const currentUser = state.peers.find(p => p.id === currentUserId);
    return currentUser?.isHost || false;
  },

  // Get peer count
  getPeerCount: (state: CollaborationState): number => {
    return collaborationHelpers.getActivePeers(state).length;
  },

  // Check if room is full (max 4 users for performance)
  isRoomFull: (state: CollaborationState): boolean => {
    return collaborationHelpers.getPeerCount(state) >= 4;
  }
};