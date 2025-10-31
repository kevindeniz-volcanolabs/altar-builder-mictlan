import { WebRTCCollaborationEngine } from './webrtc-engine';
import { CollaborationRoomManager, type RoomInfo } from './room-manager';
import type { 
  CollaborationEngine, 
  CollaborationAction, 
  CollaborationPeer, 
  CollaborationState,
  WebRTCConfig 
} from '../../types';

export interface CollaborationEngineConfig {
  webrtc?: Partial<WebRTCConfig>;
  maxPeers?: number;
  reconnectAttempts?: number;
  heartbeatInterval?: number;
}

export class MainCollaborationEngine {
  private webrtcEngine: WebRTCCollaborationEngine;
  private roomManager: CollaborationRoomManager;
  private config: Required<CollaborationEngineConfig>;
  private state: CollaborationState;
  private heartbeatTimer?: number;
  private reconnectAttempts = 0;

  // Event callbacks
  private actionCallbacks: ((action: CollaborationAction) => void)[] = [];
  private stateChangeCallbacks: ((state: CollaborationState) => void)[] = [];
  private errorCallbacks: ((error: Error) => void)[] = [];

  constructor(config?: CollaborationEngineConfig) {
    this.config = {
      maxPeers: 4,
      reconnectAttempts: 3,
      heartbeatInterval: 30000, // 30 seconds
      webrtc: {},
      ...config
    };

    this.webrtcEngine = new WebRTCCollaborationEngine(this.config.webrtc);
    this.roomManager = new CollaborationRoomManager();

    this.state = {
      roomId: undefined,
      isHost: false,
      peers: new Map(),
      cursors: new Map(),
      isConnected: false,
      connectionType: 'offline'
    };

    this.setupWebRTCCallbacks();
    this.startHeartbeat();
  }

  // Room Management
  async createRoom(name?: string): Promise<string> {
    try {
      const room = await this.roomManager.createRoom(name);
      const roomId = await this.webrtcEngine.createRoom();
      
      this.updateState({
        roomId: room.id,
        isHost: true,
        isConnected: true,
        connectionType: this.webrtcEngine.connectionType
      });

      return room.id;
    } catch (error) {
      this.handleError(new Error(`Failed to create room: ${error}`));
      throw error;
    }
  }

  async joinRoom(roomId: string): Promise<void> {
    try {
      const room = await this.roomManager.getRoomInfo(roomId);
      if (!room) {
        throw new Error(`Room ${roomId} not found`);
      }

      await this.roomManager.joinRoom(roomId);
      await this.webrtcEngine.joinRoom(roomId);

      this.updateState({
        roomId,
        isHost: false,
        isConnected: true,
        connectionType: this.webrtcEngine.connectionType
      });

      this.reconnectAttempts = 0;
    } catch (error) {
      this.handleError(new Error(`Failed to join room: ${error}`));
      throw error;
    }
  }

  leaveRoom(): void {
    try {
      this.webrtcEngine.leaveRoom();
      this.roomManager.leaveRoom();

      this.updateState({
        roomId: undefined,
        isHost: false,
        peers: new Map(),
        cursors: new Map(),
        isConnected: false,
        connectionType: 'offline'
      });
    } catch (error) {
      this.handleError(new Error(`Failed to leave room: ${error}`));
    }
  }

  // Action Broadcasting
  sendAction(action: Omit<CollaborationAction, 'peerId' | 'timestamp'>): void {
    if (!this.state.isConnected) {
      console.warn('Cannot send action: not connected to room');
      return;
    }

    const fullAction: CollaborationAction = {
      ...action,
      peerId: this.getLocalPeerId(),
      timestamp: Date.now()
    };

    try {
      this.webrtcEngine.sendAction(fullAction);
    } catch (error) {
      this.handleError(new Error(`Failed to send action: ${error}`));
    }
  }

  // Cursor Management
  updateCursor(x: number, y: number, gridPosition?: { row: number; col: number }): void {
    const cursorAction: Omit<CollaborationAction, 'peerId' | 'timestamp'> = {
      type: 'cursor_move',
      data: { x, y, gridPosition }
    };

    this.sendAction(cursorAction);
  }

  // Event Listeners
  onAction(callback: (action: CollaborationAction) => void): void {
    this.actionCallbacks.push(callback);
  }

  onStateChange(callback: (state: CollaborationState) => void): void {
    this.stateChangeCallbacks.push(callback);
  }

  onError(callback: (error: Error) => void): void {
    this.errorCallbacks.push(callback);
  }

  // Getters
  getState(): CollaborationState {
    return { ...this.state };
  }

  getCurrentRoom(): RoomInfo | null {
    return this.roomManager.getCurrentRoom();
  }

  generateShareableLink(): string | null {
    if (!this.state.roomId) return null;
    return this.roomManager.generateShareableLink(this.state.roomId);
  }

  parseShareableLink(url: string): string | null {
    return this.roomManager.parseShareableLink(url);
  }

  // Connection Management
  async reconnect(): Promise<void> {
    if (!this.state.roomId || this.reconnectAttempts >= this.config.reconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    
    try {
      await this.joinRoom(this.state.roomId);
    } catch (error) {
      console.warn(`Reconnection attempt ${this.reconnectAttempts} failed:`, error);
      
      if (this.reconnectAttempts >= this.config.reconnectAttempts) {
        this.handleError(new Error('Maximum reconnection attempts reached'));
      } else {
        // Exponential backoff
        setTimeout(() => this.reconnect(), Math.pow(2, this.reconnectAttempts) * 1000);
      }
    }
  }

  // Private Methods
  private setupWebRTCCallbacks(): void {
    this.webrtcEngine.onAction((action) => {
      this.handleIncomingAction(action);
    });

    this.webrtcEngine.onPeerConnect((peer) => {
      this.handlePeerConnect(peer);
    });

    this.webrtcEngine.onPeerDisconnect((peerId) => {
      this.handlePeerDisconnect(peerId);
    });
  }

  private handleIncomingAction(action: CollaborationAction): void {
    // Update cursor positions
    if (action.type === 'cursor_move') {
      this.state.cursors.set(action.peerId, action.data);
    }

    // Notify listeners
    this.actionCallbacks.forEach(callback => {
      try {
        callback(action);
      } catch (error) {
        console.error('Error in action callback:', error);
      }
    });
  }

  private handlePeerConnect(peer: CollaborationPeer): void {
    this.state.peers.set(peer.id, peer);
    
    this.updateState({
      connectionType: this.webrtcEngine.connectionType
    });

    // Send peer join action
    this.sendAction({
      type: 'peer_join',
      data: { peer }
    });
  }

  private handlePeerDisconnect(peerId: string): void {
    this.state.peers.delete(peerId);
    this.state.cursors.delete(peerId);
    
    this.updateState({
      connectionType: this.webrtcEngine.connectionType
    });

    // Send peer leave action
    this.sendAction({
      type: 'peer_leave',
      data: { peerId }
    });
  }

  private updateState(updates: Partial<CollaborationState>): void {
    this.state = { ...this.state, ...updates };
    
    this.stateChangeCallbacks.forEach(callback => {
      try {
        callback(this.state);
      } catch (error) {
        console.error('Error in state change callback:', error);
      }
    });
  }

  private handleError(error: Error): void {
    console.error('Collaboration engine error:', error);
    
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    });
  }

  private getLocalPeerId(): string {
    // Generate a consistent local peer ID
    let peerId = localStorage.getItem('local_peer_id');
    if (!peerId) {
      peerId = Array.from(crypto.getRandomValues(new Uint8Array(8)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      localStorage.setItem('local_peer_id', peerId);
    }
    return peerId;
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = window.setInterval(() => {
      if (this.state.isConnected) {
        // Send heartbeat to maintain connection
        this.sendAction({
          type: 'peer_join', // Reuse peer_join as heartbeat
          data: { heartbeat: true }
        });
      }
    }, this.config.heartbeatInterval);
  }

  // Cleanup
  destroy(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    
    this.leaveRoom();
    this.actionCallbacks.length = 0;
    this.stateChangeCallbacks.length = 0;
    this.errorCallbacks.length = 0;
  }
}