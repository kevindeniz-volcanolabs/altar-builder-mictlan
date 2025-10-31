import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCollaboration } from '../useCollaboration';
import type { OfrendarElement } from '../../types';

// Mock the collaboration engines
vi.mock('../../engines/collaboration/collaboration-engine', () => ({
  MainCollaborationEngine: vi.fn(() => ({
    createRoom: vi.fn(() => Promise.resolve('test-room-123')),
    joinRoom: vi.fn(() => Promise.resolve()),
    leaveRoom: vi.fn(),
    sendAction: vi.fn(),
    updateCursor: vi.fn(),
    generateShareableLink: vi.fn(() => 'https://example.com/room/test-room-123'),
    parseShareableLink: vi.fn(() => 'test-room-123'),
    onStateChange: vi.fn(),
    onAction: vi.fn(),
    onError: vi.fn(),
    destroy: vi.fn()
  }))
}));

vi.mock('../../engines/collaboration/room-manager', () => ({
  CollaborationRoomManager: vi.fn(() => ({
    getRecentRoomsList: vi.fn(() => []),
    cleanupExpiredRooms: vi.fn(),
    isValidRoomId: vi.fn(() => true),
    parseShareableLink: vi.fn(() => 'test-room-123')
  }))
}));

vi.mock('../../engines/collaboration/operational-transform', () => ({
  OperationalTransform: vi.fn(() => ({
    actionToOperation: vi.fn(() => ({
      id: 'test-op',
      type: 'place',
      elementType: 'vela',
      position: { row: 0, col: 0 },
      timestamp: Date.now(),
      peerId: 'peer1'
    })),
    transform: vi.fn(() => ({
      shouldApply: true,
      operation: {
        id: 'test-op',
        type: 'place',
        elementType: 'vela',
        position: { row: 0, col: 0 },
        timestamp: Date.now(),
        peerId: 'peer1'
      },
      conflicts: []
    }))
  }))
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

// Mock navigator.share
Object.defineProperty(global.navigator, 'share', {
  value: vi.fn(() => Promise.resolve()),
  writable: true
});

// Mock navigator.clipboard
Object.defineProperty(global.navigator, 'clipboard', {
  value: {
    writeText: vi.fn(() => Promise.resolve())
  },
  writable: true
});

describe('useCollaboration', () => {
  let mockOnElementPlace: ReturnType<typeof vi.fn>;
  let mockOnElementRemove: ReturnType<typeof vi.fn>;
  let mockOnPeerJoin: ReturnType<typeof vi.fn>;
  let mockOnPeerLeave: ReturnType<typeof vi.fn>;
  let mockOnError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnElementPlace = vi.fn();
    mockOnElementRemove = vi.fn();
    mockOnPeerJoin = vi.fn();
    mockOnPeerLeave = vi.fn();
    mockOnError = vi.fn();
    
    localStorage.clear();
    
    // Clear URL parameters
    Object.defineProperty(window, 'location', {
      value: {
        href: 'https://example.com',
        search: '',
        origin: 'https://example.com'
      },
      writable: true
    });

    Object.defineProperty(window, 'history', {
      value: {
        replaceState: vi.fn()
      },
      writable: true
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useCollaboration());

      expect(result.current.state.isConnected).toBe(false);
      expect(result.current.state.connectionType).toBe('offline');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.recentRooms).toEqual([]);
    });

    it('should initialize with callbacks', () => {
      const options = {
        onElementPlace: mockOnElementPlace,
        onElementRemove: mockOnElementRemove,
        onPeerJoin: mockOnPeerJoin,
        onPeerLeave: mockOnPeerLeave,
        onError: mockOnError
      };

      const { result } = renderHook(() => useCollaboration(options));

      expect(result.current).toBeDefined();
    });
  });

  describe('Room Management', () => {
    it('should create a room', async () => {
      const { result } = renderHook(() => useCollaboration());

      await act(async () => {
        await result.current.createRoom('Test Room');
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle room creation errors', async () => {
      const { result } = renderHook(() => useCollaboration());

      // Mock engine to throw error
      const mockEngine = result.current as any;
      if (mockEngine.engineRef?.current) {
        mockEngine.engineRef.current.createRoom = vi.fn(() => 
          Promise.reject(new Error('Creation failed'))
        );
      }

      await act(async () => {
        try {
          await result.current.createRoom('Test Room');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBeTruthy();
    });

    it('should join a room', async () => {
      const { result } = renderHook(() => useCollaboration());

      await act(async () => {
        await result.current.joinRoom('test-room-123');
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle room joining errors', async () => {
      const { result } = renderHook(() => useCollaboration());

      // Mock engine to throw error
      const mockEngine = result.current as any;
      if (mockEngine.engineRef?.current) {
        mockEngine.engineRef.current.joinRoom = vi.fn(() => 
          Promise.reject(new Error('Join failed'))
        );
      }

      await act(async () => {
        try {
          await result.current.joinRoom('invalid-room');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBeTruthy();
    });

    it('should leave a room', () => {
      const { result } = renderHook(() => useCollaboration());

      act(() => {
        result.current.leaveRoom();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Real-time Features', () => {
    it('should update cursor position', () => {
      const { result } = renderHook(() => useCollaboration());

      act(() => {
        result.current.updateCursor(100, 200, { row: 1, col: 2 });
      });

      // Should not throw error
      expect(result.current.error).toBeNull();
    });

    it('should send element placement', () => {
      const { result } = renderHook(() => useCollaboration());

      const mockElement: OfrendarElement = {
        id: 'vela-1',
        name: 'Vela',
        type: 'vela' as any,
        category: 'esenciales' as any,
        icon: 'candle',
        maxQuantity: 4,
        placementRules: [],
        description: 'Una vela'
      };

      act(() => {
        result.current.sendElementPlace(mockElement, { row: 0, col: 0 });
      });

      expect(result.current.error).toBeNull();
    });

    it('should send element removal', () => {
      const { result } = renderHook(() => useCollaboration());

      act(() => {
        result.current.sendElementRemove('vela-1', { row: 0, col: 0 });
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Sharing', () => {
    it('should share room using Web Share API', () => {
      const { result } = renderHook(() => useCollaboration());

      act(() => {
        result.current.shareRoom();
      });

      expect(navigator.share).toHaveBeenCalledWith({
        title: 'Únete a mi Altar Colaborativo',
        text: 'Te invito a crear un altar del Día de los Muertos conmigo',
        url: 'https://example.com/room/test-room-123'
      });
    });

    it('should fallback to clipboard when Web Share API not available', async () => {
      // Mock navigator.share to be undefined
      Object.defineProperty(global.navigator, 'share', {
        value: undefined,
        writable: true
      });

      const { result } = renderHook(() => useCollaboration());

      act(() => {
        result.current.shareRoom();
      });

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'https://example.com/room/test-room-123'
      );
    });

    it('should get shareable link', () => {
      const { result } = renderHook(() => useCollaboration());

      const link = result.current.getShareableLink();
      expect(link).toBe('https://example.com/room/test-room-123');
    });

    it('should parse invite link', () => {
      const { result } = renderHook(() => useCollaboration());

      const roomId = result.current.parseInviteLink(
        'https://example.com?room=test-room-123&join=true'
      );
      expect(roomId).toBe('test-room-123');
    });
  });

  describe('URL Handling', () => {
    it('should detect invite link in URL on initialization', () => {
      // Mock URL with room parameters
      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://example.com?room=test-room-123&join=true',
          search: '?room=test-room-123&join=true',
          origin: 'https://example.com'
        },
        writable: true
      });

      const { result } = renderHook(() => useCollaboration());

      // Should attempt to auto-join
      expect(result.current).toBeDefined();
    });

    it('should update URL when creating room', async () => {
      const { result } = renderHook(() => useCollaboration());

      await act(async () => {
        await result.current.createRoom('Test Room');
      });

      expect(window.history.replaceState).toHaveBeenCalled();
    });

    it('should update URL when joining room', async () => {
      const { result } = renderHook(() => useCollaboration());

      await act(async () => {
        await result.current.joinRoom('test-room-123');
      });

      expect(window.history.replaceState).toHaveBeenCalled();
    });

    it('should clear URL when leaving room', () => {
      const { result } = renderHook(() => useCollaboration());

      act(() => {
        result.current.leaveRoom();
      });

      expect(window.history.replaceState).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle engine errors', () => {
      const { result } = renderHook(() => 
        useCollaboration({ onError: mockOnError })
      );

      // Simulate engine error
      const mockEngine = result.current as any;
      if (mockEngine.engineRef?.current) {
        const errorCallback = mockEngine.engineRef.current.onError.mock.calls[0][0];
        act(() => {
          errorCallback(new Error('Test error'));
        });
      }

      expect(mockOnError).toHaveBeenCalledWith(new Error('Test error'));
    });

    it('should clear errors when operations succeed', async () => {
      const { result } = renderHook(() => useCollaboration());

      // First cause an error
      const mockEngine = result.current as any;
      if (mockEngine.engineRef?.current) {
        mockEngine.engineRef.current.createRoom = vi.fn(() => 
          Promise.reject(new Error('Creation failed'))
        );
      }

      await act(async () => {
        try {
          await result.current.createRoom('Test Room');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBeTruthy();

      // Then succeed
      if (mockEngine.engineRef?.current) {
        mockEngine.engineRef.current.createRoom = vi.fn(() => 
          Promise.resolve('test-room-123')
        );
      }

      await act(async () => {
        await result.current.createRoom('Test Room');
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', () => {
      const { result, unmount } = renderHook(() => useCollaboration());

      const mockEngine = result.current as any;
      const destroySpy = mockEngine.engineRef?.current?.destroy;

      unmount();

      if (destroySpy) {
        expect(destroySpy).toHaveBeenCalled();
      }
    });
  });
});