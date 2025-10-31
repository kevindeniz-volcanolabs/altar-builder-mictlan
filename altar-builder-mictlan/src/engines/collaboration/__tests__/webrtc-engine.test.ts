import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebRTCCollaborationEngine } from '../webrtc-engine';
import type { CollaborationAction } from '../../../types';

// Mock WebRTC APIs
const mockRTCPeerConnection = vi.fn(() => ({
  createDataChannel: vi.fn(() => ({
    onopen: null,
    onmessage: null,
    onclose: null,
    onerror: null,
    readyState: 'open',
    send: vi.fn()
  })),
  ondatachannel: null,
  onicecandidate: null,
  onconnectionstatechange: null,
  connectionState: 'connected',
  createOffer: vi.fn(() => Promise.resolve({ type: 'offer', sdp: 'mock-sdp' })),
  setLocalDescription: vi.fn(() => Promise.resolve()),
  close: vi.fn()
}));

const mockWebSocket = vi.fn(() => ({
  readyState: WebSocket.OPEN,
  send: vi.fn(),
  close: vi.fn(),
  onopen: null,
  onmessage: null,
  onclose: null,
  onerror: null
}));

// Mock crypto.getRandomValues
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: vi.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    })
  }
});

global.RTCPeerConnection = mockRTCPeerConnection as any;
global.WebSocket = mockWebSocket as any;

describe('WebRTCCollaborationEngine', () => {
  let engine: WebRTCCollaborationEngine;
  let actionCallback: ReturnType<typeof vi.fn>;
  let peerConnectCallback: ReturnType<typeof vi.fn>;
  let peerDisconnectCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new WebRTCCollaborationEngine();
    actionCallback = vi.fn();
    peerConnectCallback = vi.fn();
    peerDisconnectCallback = vi.fn();

    engine.onAction(actionCallback);
    engine.onPeerConnect(peerConnectCallback);
    engine.onPeerDisconnect(peerDisconnectCallback);
  });

  afterEach(() => {
    engine.leaveRoom();
  });

  describe('Room Management', () => {
    it('should create a room with unique ID', async () => {
      const roomId = await engine.createRoom();
      
      expect(roomId).toBeDefined();
      expect(typeof roomId).toBe('string');
      expect(roomId.length).toBe(12);
      expect(engine.currentRoomId).toBe(roomId);
    });

    it('should join an existing room', async () => {
      const roomId = 'test-room-123';
      
      await engine.joinRoom(roomId);
      
      expect(engine.currentRoomId).toBe(roomId);
      expect(mockRTCPeerConnection).toHaveBeenCalled();
    });

    it('should handle room joining failure gracefully', async () => {
      // Mock signaling failure
      const originalInitialize = engine['initializeSignalingConnection'];
      engine['initializeSignalingConnection'] = vi.fn(() => 
        Promise.reject(new Error('Signaling failed'))
      );

      await expect(engine.joinRoom('invalid-room')).rejects.toThrow();
    });

    it('should leave room and cleanup connections', () => {
      const mockPeerConnection = {
        close: vi.fn()
      };
      const mockDataChannel = {
        readyState: 'open',
        close: vi.fn()
      };

      engine['peers'].set('peer1', mockPeerConnection as any);
      engine['dataChannels'].set('peer1', mockDataChannel as any);

      engine.leaveRoom();

      expect(mockPeerConnection.close).toHaveBeenCalled();
      expect(mockDataChannel.close).toHaveBeenCalled();
      expect(engine.currentRoomId).toBeUndefined();
    });
  });

  describe('WebRTC Connection', () => {
    it('should establish peer connection', async () => {
      await engine.createRoom();
      
      expect(mockRTCPeerConnection).toHaveBeenCalledWith({
        iceServers: expect.arrayContaining([
          { urls: 'stun:stun.l.google.com:19302' }
        ])
      });
    });

    it('should create data channel for communication', async () => {
      const mockConnection = mockRTCPeerConnection();
      await engine.createRoom();
      
      expect(mockConnection.createDataChannel).toHaveBeenCalledWith(
        'collaboration',
        { ordered: true }
      );
    });

    it('should handle connection state changes', async () => {
      const mockConnection = mockRTCPeerConnection();
      mockConnection.connectionState = 'connected';
      
      await engine.createRoom();
      
      // Simulate connection state change
      if (mockConnection.onconnectionstatechange) {
        mockConnection.onconnectionstatechange();
      }
      
      expect(peerConnectCallback).toHaveBeenCalled();
    });

    it('should handle peer disconnection', async () => {
      const mockConnection = mockRTCPeerConnection();
      mockConnection.connectionState = 'disconnected';
      
      await engine.createRoom();
      
      // Simulate disconnection
      if (mockConnection.onconnectionstatechange) {
        mockConnection.onconnectionstatechange();
      }
      
      expect(peerDisconnectCallback).toHaveBeenCalled();
    });
  });

  describe('WebSocket Fallback', () => {
    it('should fallback to WebSocket when WebRTC fails', async () => {
      // Mock WebRTC failure
      mockRTCPeerConnection.mockImplementation(() => {
        throw new Error('WebRTC not supported');
      });

      await engine.joinRoom('test-room');
      
      expect(engine.connectionType).toBe('websocket');
    });

    it('should send messages via WebSocket fallback', async () => {
      // Force WebSocket fallback
      await engine['initializeWebSocketFallback']();
      
      const action: CollaborationAction = {
        type: 'element_place',
        peerId: 'test-peer',
        timestamp: Date.now(),
        data: { elementType: 'vela', position: { row: 0, col: 0 } }
      };

      engine.sendAction(action);
      
      expect(engine.connectionType).toBe('websocket');
    });
  });

  describe('Action Broadcasting', () => {
    it('should send actions via data channels', async () => {
      const mockDataChannel = {
        readyState: 'open',
        send: vi.fn()
      };
      
      engine['dataChannels'].set('peer1', mockDataChannel as any);
      
      const action: CollaborationAction = {
        type: 'element_place',
        peerId: 'test-peer',
        timestamp: Date.now(),
        data: { elementType: 'vela', position: { row: 0, col: 0 } }
      };

      engine.sendAction(action);
      
      expect(mockDataChannel.send).toHaveBeenCalledWith(JSON.stringify(action));
    });

    it('should handle data channel messages', async () => {
      const mockDataChannel = {
        onopen: null,
        onmessage: null,
        onclose: null,
        onerror: null
      };

      engine['setupDataChannel'](mockDataChannel as any, 'peer1');
      
      const action: CollaborationAction = {
        type: 'cursor_move',
        peerId: 'peer1',
        timestamp: Date.now(),
        data: { x: 100, y: 200 }
      };

      // Simulate incoming message
      if (mockDataChannel.onmessage) {
        mockDataChannel.onmessage({ data: JSON.stringify(action) } as any);
      }
      
      expect(actionCallback).toHaveBeenCalledWith(action);
    });

    it('should handle malformed messages gracefully', async () => {
      const mockDataChannel = {
        onopen: null,
        onmessage: null,
        onclose: null,
        onerror: null
      };

      engine['setupDataChannel'](mockDataChannel as any, 'peer1');
      
      // Simulate malformed message
      if (mockDataChannel.onmessage) {
        mockDataChannel.onmessage({ data: 'invalid-json' } as any);
      }
      
      // Should not crash and not call action callback
      expect(actionCallback).not.toHaveBeenCalled();
    });
  });

  describe('Connection Status', () => {
    it('should report correct connection status', () => {
      expect(engine.isConnected).toBe(false);
      expect(engine.connectionType).toBe('offline');
    });

    it('should report WebRTC connection when data channels are open', () => {
      const mockDataChannel = { readyState: 'open' };
      engine['dataChannels'].set('peer1', mockDataChannel as any);
      
      expect(engine.isConnected).toBe(true);
      expect(engine.connectionType).toBe('webrtc');
    });

    it('should report connected peers', () => {
      engine['dataChannels'].set('peer1', {} as any);
      engine['dataChannels'].set('peer2', {} as any);
      
      expect(engine.connectedPeers).toEqual(['peer1', 'peer2']);
    });
  });

  describe('Peer Color Generation', () => {
    it('should generate consistent colors for same peer ID', () => {
      const peerId = 'test-peer-123';
      const color1 = engine['generatePeerColor'](peerId);
      const color2 = engine['generatePeerColor'](peerId);
      
      expect(color1).toBe(color2);
      expect(color1).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it('should generate different colors for different peer IDs', () => {
      const color1 = engine['generatePeerColor']('peer1');
      const color2 = engine['generatePeerColor']('peer2');
      
      // While not guaranteed, very likely to be different
      expect(color1).not.toBe(color2);
    });
  });
});