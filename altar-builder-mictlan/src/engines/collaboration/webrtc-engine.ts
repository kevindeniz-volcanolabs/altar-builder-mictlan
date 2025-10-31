import type { 
  CollaborationEngine, 
  CollaborationAction, 
  CollaborationPeer, 
  WebRTCConfig 
} from '../../types';

export class WebRTCCollaborationEngine implements CollaborationEngine {
  private roomId?: string;
  private isHost = false;
  private peers = new Map<string, RTCPeerConnection>();
  private dataChannels = new Map<string, RTCDataChannel>();
  private localPeerId: string;
  private config: WebRTCConfig;
  private websocketFallback?: WebSocket;
  private actionCallbacks: ((action: CollaborationAction) => void)[] = [];
  private peerConnectCallbacks: ((peer: CollaborationPeer) => void)[] = [];
  private peerDisconnectCallbacks: ((peerId: string) => void)[] = [];

  constructor(config?: Partial<WebRTCConfig>) {
    this.localPeerId = this.generatePeerId();
    this.config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
      maxRetries: 3,
      connectionTimeout: 10000,
      ...config
    };
  }

  async createRoom(): Promise<string> {
    this.roomId = this.generateRoomId();
    this.isHost = true;
    
    // Initialize signaling server connection for room creation
    await this.initializeSignalingConnection();
    
    return this.roomId;
  }

  async joinRoom(roomId: string): Promise<void> {
    this.roomId = roomId;
    this.isHost = false;
    
    try {
      // Try WebRTC connection first
      await this.initializeSignalingConnection();
      await this.connectToRoom();
    } catch (error) {
      console.warn('WebRTC connection failed, falling back to WebSocket:', error);
      await this.initializeWebSocketFallback();
    }
  }

  leaveRoom(): void {
    // Close all peer connections
    this.peers.forEach((connection, peerId) => {
      connection.close();
      this.notifyPeerDisconnect(peerId);
    });
    
    // Close data channels
    this.dataChannels.forEach(channel => {
      if (channel.readyState === 'open') {
        channel.close();
      }
    });
    
    // Close WebSocket fallback if active
    if (this.websocketFallback) {
      this.websocketFallback.close();
    }
    
    // Clear state
    this.peers.clear();
    this.dataChannels.clear();
    this.roomId = undefined;
    this.isHost = false;
  }

  sendAction(action: CollaborationAction): void {
    const message = JSON.stringify(action);
    
    // Send via WebRTC data channels
    this.dataChannels.forEach(channel => {
      if (channel.readyState === 'open') {
        try {
          channel.send(message);
        } catch (error) {
          console.error('Failed to send action via WebRTC:', error);
        }
      }
    });
    
    // Send via WebSocket fallback if active
    if (this.websocketFallback && this.websocketFallback.readyState === WebSocket.OPEN) {
      try {
        this.websocketFallback.send(message);
      } catch (error) {
        console.error('Failed to send action via WebSocket:', error);
      }
    }
  }

  onAction(callback: (action: CollaborationAction) => void): void {
    this.actionCallbacks.push(callback);
  }

  onPeerConnect(callback: (peer: CollaborationPeer) => void): void {
    this.peerConnectCallbacks.push(callback);
  }

  onPeerDisconnect(callback: (peerId: string) => void): void {
    this.peerDisconnectCallbacks.push(callback);
  }

  private generateRoomId(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .substring(0, 12);
  }

  private generatePeerId(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private async initializeSignalingConnection(): Promise<void> {
    // In a real implementation, this would connect to a signaling server
    // For this demo, we'll simulate the signaling process
    return new Promise((resolve, reject) => {
      // Simulate signaling server connection
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate
          resolve();
        } else {
          reject(new Error('Signaling server connection failed'));
        }
      }, 1000);
    });
  }

  private async connectToRoom(): Promise<void> {
    if (!this.roomId) {
      throw new Error('No room ID specified');
    }

    // Create peer connection for the host (if joining) or first peer (if hosting)
    const hostPeerId = this.isHost ? this.localPeerId : 'host';
    await this.createPeerConnection(hostPeerId);
  }

  private async createPeerConnection(peerId: string): Promise<void> {
    const peerConnection = new RTCPeerConnection({
      iceServers: this.config.iceServers
    });

    // Set up data channel
    const dataChannel = peerConnection.createDataChannel('collaboration', {
      ordered: true
    });

    this.setupDataChannel(dataChannel, peerId);

    // Handle incoming data channels
    peerConnection.ondatachannel = (event) => {
      this.setupDataChannel(event.channel, peerId);
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // In a real implementation, send this to the signaling server
        this.handleIceCandidate(event.candidate, peerId);
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      console.log(`Peer ${peerId} connection state:`, state);
      
      if (state === 'connected') {
        this.notifyPeerConnect(peerId);
      } else if (state === 'disconnected' || state === 'failed') {
        this.handlePeerDisconnection(peerId);
      }
    };

    this.peers.set(peerId, peerConnection);

    // Create offer if we're the initiator
    if (this.isHost || peerId !== 'host') {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      // In a real implementation, send offer to signaling server
      this.handleOffer(offer, peerId);
    }
  }

  private setupDataChannel(channel: RTCDataChannel, peerId: string): void {
    channel.onopen = () => {
      console.log(`Data channel opened with peer ${peerId}`);
      this.dataChannels.set(peerId, channel);
    };

    channel.onmessage = (event) => {
      try {
        const action: CollaborationAction = JSON.parse(event.data);
        this.notifyAction(action);
      } catch (error) {
        console.error('Failed to parse collaboration action:', error);
      }
    };

    channel.onclose = () => {
      console.log(`Data channel closed with peer ${peerId}`);
      this.dataChannels.delete(peerId);
    };

    channel.onerror = (error) => {
      console.error(`Data channel error with peer ${peerId}:`, error);
    };
  }

  private async initializeWebSocketFallback(): Promise<void> {
    return new Promise((resolve, reject) => {
      // In a real implementation, this would connect to a WebSocket relay server
      // For this demo, we'll simulate a WebSocket connection
      const mockWebSocket = {
        readyState: WebSocket.OPEN,
        send: (data: string) => {
          // Simulate echo for testing
          setTimeout(() => {
            try {
              const action: CollaborationAction = JSON.parse(data);
              // Don't echo back our own actions
              if (action.peerId !== this.localPeerId) {
                this.notifyAction(action);
              }
            } catch (error) {
              console.error('WebSocket fallback parse error:', error);
            }
          }, 100);
        },
        close: () => {
          console.log('WebSocket fallback closed');
        }
      } as WebSocket;

      this.websocketFallback = mockWebSocket;
      
      setTimeout(() => {
        console.log('WebSocket fallback connected');
        resolve();
      }, 500);
    });
  }

  private handleIceCandidate(candidate: RTCIceCandidate, peerId: string): void {
    // In a real implementation, send to signaling server
    console.log(`ICE candidate for peer ${peerId}:`, candidate);
  }

  private handleOffer(offer: RTCSessionDescriptionInit, peerId: string): void {
    // In a real implementation, send to signaling server
    console.log(`Offer created for peer ${peerId}:`, offer);
  }

  private handlePeerDisconnection(peerId: string): void {
    const peerConnection = this.peers.get(peerId);
    if (peerConnection) {
      peerConnection.close();
      this.peers.delete(peerId);
    }
    
    this.dataChannels.delete(peerId);
    this.notifyPeerDisconnect(peerId);
  }

  private notifyAction(action: CollaborationAction): void {
    this.actionCallbacks.forEach(callback => {
      try {
        callback(action);
      } catch (error) {
        console.error('Error in action callback:', error);
      }
    });
  }

  private notifyPeerConnect(peerId: string): void {
    const peer: CollaborationPeer = {
      id: peerId,
      name: `User ${peerId.substring(0, 4)}`,
      color: this.generatePeerColor(peerId),
      isConnected: true,
      lastSeen: new Date()
    };

    this.peerConnectCallbacks.forEach(callback => {
      try {
        callback(peer);
      } catch (error) {
        console.error('Error in peer connect callback:', error);
      }
    });
  }

  private notifyPeerDisconnect(peerId: string): void {
    this.peerDisconnectCallbacks.forEach(callback => {
      try {
        callback(peerId);
      } catch (error) {
        console.error('Error in peer disconnect callback:', error);
      }
    });
  }

  private generatePeerColor(peerId: string): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
    ];
    
    const hash = peerId.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    return colors[hash % colors.length];
  }

  // Getters for current state
  get currentRoomId(): string | undefined {
    return this.roomId;
  }

  get isConnected(): boolean {
    return this.dataChannels.size > 0 || 
           (this.websocketFallback?.readyState === WebSocket.OPEN);
  }

  get connectionType(): 'webrtc' | 'websocket' | 'offline' {
    if (this.dataChannels.size > 0) return 'webrtc';
    if (this.websocketFallback?.readyState === WebSocket.OPEN) return 'websocket';
    return 'offline';
  }

  get connectedPeers(): string[] {
    return Array.from(this.dataChannels.keys());
  }
}