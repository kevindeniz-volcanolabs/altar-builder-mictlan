import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CollaborationRoomManager } from '../room-manager';

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

describe('CollaborationRoomManager', () => {
  let roomManager: CollaborationRoomManager;

  beforeEach(() => {
    roomManager = new CollaborationRoomManager();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Room Creation', () => {
    it('should create a room with default name', async () => {
      const room = await roomManager.createRoom();
      
      expect(room.id).toBeDefined();
      expect(room.name).toContain('Altar de');
      expect(room.participants).toBe(1);
      expect(room.maxParticipants).toBe(4);
      expect(room.isPublic).toBe(false);
      expect(room.createdAt).toBeInstanceOf(Date);
    });

    it('should create a room with custom name', async () => {
      const customName = 'Mi Altar Especial';
      const room = await roomManager.createRoom(customName);
      
      expect(room.name).toBe(customName);
    });

    it('should create a public room', async () => {
      const room = await roomManager.createRoom('Public Room', true);
      
      expect(room.isPublic).toBe(true);
    });

    it('should generate valid room ID format', async () => {
      const room = await roomManager.createRoom();
      
      // Should match format: adjective-noun-number
      expect(room.id).toMatch(/^[a-z]+-[a-z]+-\d{3}$/);
    });

    it('should store room info in localStorage', async () => {
      const room = await roomManager.createRoom();
      
      const stored = localStorage.getItem(`room_${room.id}`);
      expect(stored).toBeDefined();
      
      const parsedRoom = JSON.parse(stored!);
      expect(parsedRoom.id).toBe(room.id);
      expect(parsedRoom.name).toBe(room.name);
    });
  });

  describe('Room Joining', () => {
    it('should join an existing room', async () => {
      // Create a room first
      const createdRoom = await roomManager.createRoom();
      
      // Create new manager instance to simulate different user
      const newManager = new CollaborationRoomManager();
      const joinedRoom = await newManager.joinRoom(createdRoom.id);
      
      expect(joinedRoom.id).toBe(createdRoom.id);
      expect(joinedRoom.participants).toBe(2);
    });

    it('should throw error for non-existent room', async () => {
      await expect(roomManager.joinRoom('non-existent-room'))
        .rejects.toThrow('Room non-existent-room not found');
    });

    it('should throw error when room is full', async () => {
      const room = await roomManager.createRoom();
      
      // Manually set participants to max
      room.participants = room.maxParticipants;
      localStorage.setItem(`room_${room.id}`, JSON.stringify(room));
      
      const newManager = new CollaborationRoomManager();
      await expect(newManager.joinRoom(room.id))
        .rejects.toThrow(`Room ${room.id} is full`);
    });
  });

  describe('Room Leaving', () => {
    it('should decrease participant count when leaving', async () => {
      const room = await roomManager.createRoom();
      expect(room.participants).toBe(1);
      
      roomManager.leaveRoom();
      
      const storedRoom = await roomManager.getRoomInfo(room.id);
      expect(storedRoom?.participants).toBe(0);
    });

    it('should clean up empty rooms', async () => {
      const room = await roomManager.createRoom();
      roomManager.leaveRoom();
      
      // Room should be removed when no participants left
      const storedRoom = await roomManager.getRoomInfo(room.id);
      expect(storedRoom).toBeNull();
    });

    it('should handle leaving when not in a room', () => {
      expect(() => roomManager.leaveRoom()).not.toThrow();
    });
  });

  describe('Room Information', () => {
    it('should retrieve room info', async () => {
      const room = await roomManager.createRoom();
      const retrieved = await roomManager.getRoomInfo(room.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(room.id);
      expect(retrieved!.createdAt).toBeInstanceOf(Date);
    });

    it('should return null for non-existent room', async () => {
      const retrieved = await roomManager.getRoomInfo('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should get current room', async () => {
      expect(roomManager.getCurrentRoom()).toBeNull();
      
      const room = await roomManager.createRoom();
      expect(roomManager.getCurrentRoom()).toEqual(room);
      
      roomManager.leaveRoom();
      expect(roomManager.getCurrentRoom()).toBeNull();
    });
  });

  describe('Shareable Links', () => {
    it('should generate shareable link', () => {
      const roomId = 'test-room-123';
      const link = roomManager.generateShareableLink(roomId);
      
      expect(link).toContain(roomId);
      expect(link).toContain('room=');
      expect(link).toContain('join=true');
    });

    it('should parse shareable link', () => {
      const roomId = 'test-room-123';
      const link = roomManager.generateShareableLink(roomId);
      const parsed = roomManager.parseShareableLink(link);
      
      expect(parsed).toBe(roomId);
    });

    it('should return null for invalid link', () => {
      const parsed = roomManager.parseShareableLink('https://example.com');
      expect(parsed).toBeNull();
    });

    it('should handle malformed URLs gracefully', () => {
      const parsed = roomManager.parseShareableLink('not-a-url');
      expect(parsed).toBeNull();
    });
  });

  describe('Recent Rooms', () => {
    it('should track recent rooms', async () => {
      const room1 = await roomManager.createRoom('Room 1');
      const room2 = await roomManager.createRoom('Room 2');
      
      const recent = roomManager.getRecentRoomsList();
      expect(recent).toHaveLength(2);
      expect(recent[0].id).toBe(room2.id); // Most recent first
      expect(recent[1].id).toBe(room1.id);
    });

    it('should limit recent rooms to 10', async () => {
      // Create 12 rooms
      for (let i = 0; i < 12; i++) {
        await roomManager.createRoom(`Room ${i}`);
      }
      
      const recent = roomManager.getRecentRoomsList();
      expect(recent).toHaveLength(10);
    });

    it('should cleanup expired rooms', async () => {
      const room = await roomManager.createRoom();
      
      // Manually set old creation date
      const oldRoom = { ...room, createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000) };
      localStorage.setItem(`room_${room.id}`, JSON.stringify(oldRoom));
      localStorage.setItem('recent_rooms', JSON.stringify([oldRoom]));
      
      roomManager.cleanupExpiredRooms();
      
      const recent = roomManager.getRecentRoomsList();
      expect(recent).toHaveLength(0);
    });
  });

  describe('Room ID Validation', () => {
    it('should validate correct room ID format', () => {
      expect(roomManager.isValidRoomId('brillante-altar-123')).toBe(true);
      expect(roomManager.isValidRoomId('hermoso-ofrenda-456')).toBe(true);
    });

    it('should reject invalid room ID formats', () => {
      expect(roomManager.isValidRoomId('invalid')).toBe(false);
      expect(roomManager.isValidRoomId('too-many-parts-here-123')).toBe(false);
      expect(roomManager.isValidRoomId('missing-number')).toBe(false);
      expect(roomManager.isValidRoomId('123-numeric-first')).toBe(false);
    });
  });
});