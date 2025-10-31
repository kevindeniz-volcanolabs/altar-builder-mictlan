import type { CollaborationPeer } from '../../types';

export interface RoomInfo {
  id: string;
  name: string;
  createdAt: Date;
  hostId: string;
  participants: number;
  maxParticipants: number;
  isPublic: boolean;
}

export interface RoomManager {
  createRoom(name?: string, isPublic?: boolean): Promise<RoomInfo>;
  joinRoom(roomId: string): Promise<RoomInfo>;
  leaveRoom(): void;
  getRoomInfo(roomId: string): Promise<RoomInfo | null>;
  getCurrentRoom(): RoomInfo | null;
  generateShareableLink(roomId: string): string;
  parseShareableLink(url: string): string | null;
}

export class CollaborationRoomManager implements RoomManager {
  private currentRoom: RoomInfo | null = null;
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || window.location.origin;
  }

  async createRoom(name?: string, isPublic = false): Promise<RoomInfo> {
    const roomId = this.generateRoomId();
    const hostId = this.generateUserId();
    
    const room: RoomInfo = {
      id: roomId,
      name: name || `Altar de ${new Date().toLocaleDateString('es-MX')}`,
      createdAt: new Date(),
      hostId,
      participants: 1,
      maxParticipants: 4, // Limit to 4 users for performance
      isPublic
    };

    // Store room info locally (in a real app, this would be on a server)
    this.storeRoomInfo(room);
    this.currentRoom = room;

    return room;
  }

  async joinRoom(roomId: string): Promise<RoomInfo> {
    const room = await this.getRoomInfo(roomId);
    
    if (!room) {
      throw new Error(`Room ${roomId} not found`);
    }

    if (room.participants >= room.maxParticipants) {
      throw new Error(`Room ${roomId} is full`);
    }

    // Update participant count
    room.participants += 1;
    this.storeRoomInfo(room);
    this.currentRoom = room;

    return room;
  }

  leaveRoom(): void {
    if (this.currentRoom) {
      // Decrease participant count
      this.currentRoom.participants = Math.max(0, this.currentRoom.participants - 1);
      this.storeRoomInfo(this.currentRoom);
      
      // If no participants left and we're not the host, clean up
      if (this.currentRoom.participants === 0) {
        this.removeRoomInfo(this.currentRoom.id);
      }
      
      this.currentRoom = null;
    }
  }

  async getRoomInfo(roomId: string): Promise<RoomInfo | null> {
    try {
      const stored = localStorage.getItem(`room_${roomId}`);
      if (stored) {
        const room = JSON.parse(stored);
        // Convert date strings back to Date objects
        room.createdAt = new Date(room.createdAt);
        return room;
      }
      
      // In a real implementation, this would query a server
      return null;
    } catch (error) {
      console.error('Failed to get room info:', error);
      return null;
    }
  }

  getCurrentRoom(): RoomInfo | null {
    return this.currentRoom;
  }

  generateShareableLink(roomId: string): string {
    const url = new URL(this.baseUrl);
    url.searchParams.set('room', roomId);
    url.searchParams.set('join', 'true');
    return url.toString();
  }

  parseShareableLink(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const roomId = urlObj.searchParams.get('room');
      const isJoin = urlObj.searchParams.get('join') === 'true';
      
      return (roomId && isJoin) ? roomId : null;
    } catch (error) {
      console.error('Failed to parse shareable link:', error);
      return null;
    }
  }

  private generateRoomId(): string {
    // Generate a human-readable room ID
    const adjectives = [
      'brillante', 'colorido', 'hermoso', 'sagrado', 'luminoso',
      'festivo', 'tradicional', 'alegre', 'memorable', 'especial'
    ];
    
    const nouns = [
      'altar', 'ofrenda', 'recuerdo', 'homenaje', 'celebracion',
      'tradicion', 'memoria', 'flor', 'vela', 'corazon'
    ];
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `${adjective}-${noun}-${number}`;
  }

  private generateUserId(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private storeRoomInfo(room: RoomInfo): void {
    try {
      localStorage.setItem(`room_${room.id}`, JSON.stringify(room));
      
      // Also store in a list of recent rooms
      const recentRooms = this.getRecentRooms();
      const updatedRooms = [room, ...recentRooms.filter(r => r.id !== room.id)].slice(0, 10);
      localStorage.setItem('recent_rooms', JSON.stringify(updatedRooms));
    } catch (error) {
      console.error('Failed to store room info:', error);
    }
  }

  private removeRoomInfo(roomId: string): void {
    try {
      localStorage.removeItem(`room_${roomId}`);
      
      // Remove from recent rooms
      const recentRooms = this.getRecentRooms();
      const updatedRooms = recentRooms.filter(r => r.id !== roomId);
      localStorage.setItem('recent_rooms', JSON.stringify(updatedRooms));
    } catch (error) {
      console.error('Failed to remove room info:', error);
    }
  }

  private getRecentRooms(): RoomInfo[] {
    try {
      const stored = localStorage.getItem('recent_rooms');
      if (stored) {
        const rooms = JSON.parse(stored);
        // Convert date strings back to Date objects
        return rooms.map((room: any) => ({
          ...room,
          createdAt: new Date(room.createdAt)
        }));
      }
      return [];
    } catch (error) {
      console.error('Failed to get recent rooms:', error);
      return [];
    }
  }

  // Utility methods for room management
  getRecentRoomsList(): RoomInfo[] {
    return this.getRecentRooms();
  }

  cleanupExpiredRooms(): void {
    const recentRooms = this.getRecentRooms();
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    const validRooms = recentRooms.filter(room => {
      const age = now.getTime() - room.createdAt.getTime();
      return age < maxAge;
    });
    
    if (validRooms.length !== recentRooms.length) {
      localStorage.setItem('recent_rooms', JSON.stringify(validRooms));
      
      // Remove expired room data
      recentRooms.forEach(room => {
        const age = now.getTime() - room.createdAt.getTime();
        if (age >= maxAge) {
          localStorage.removeItem(`room_${room.id}`);
        }
      });
    }
  }

  isValidRoomId(roomId: string): boolean {
    // Check if room ID matches our format: adjective-noun-number
    const pattern = /^[a-z]+-[a-z]+-\d{3}$/;
    return pattern.test(roomId);
  }
}