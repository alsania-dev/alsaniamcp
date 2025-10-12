/**
 * AI-to-AI Communication Framework for AlsaniaMCP
 * Enables peer-to-peer communication between AI agents and MCP servers
 */

import { EventEmitter } from 'events';
import { UniversalMCPServer } from '../core/server.js';
import { MCPProxyManager } from '../proxy/mcp-proxy.js';
import { ServerSpawnerManager } from '../spawner/index.js';

// Message types for A2A communication
export enum MessageType {
  REQUEST = 'request',
  RESPONSE = 'response',
  EVENT = 'event',
  COMMAND = 'command',
  ERROR = 'error',
  HEARTBEAT = 'heartbeat'
}

// Priority levels for messages
export enum MessagePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Message interface
export interface A2AMessage {
  id: string;
  type: MessageType;
  priority: MessagePriority;
  from: string;
  to: string;
  timestamp: number;
  payload: any;
  correlationId?: string;
  ttl?: number;
  metadata?: Record<string, any>;
}

// Response interface
export interface A2AResponse {
  id: string;
  correlationId: string;
  success: boolean;
  data?: any;
  error?: string;
  timestamp: number;
}

// Peer interface
export interface Peer {
  id: string;
  name: string;
  capabilities: string[];
  status: 'online' | 'offline' | 'busy';
  lastSeen: number;
  metadata?: Record<string, any>;
}

// Communication configuration
export interface A2AConfig {
  peerId: string;
  peerName: string;
  maxRetries: number;
  timeoutMs: number;
  heartbeatInterval: number;
  messageTTLSecs: number;
}

// Communication events
export interface A2AEvents {
  message: [message: A2AMessage];
  response: [response: A2AResponse];
  peerConnected: [peer: Peer];
  peerDisconnected: [peerId: string];
  error: [error: Error];
}

/**
 * AI-to-AI Communication Manager
 * Handles peer-to-peer communication between AI agents and MCP servers
 */
export class A2ACommunication extends EventEmitter {
  private config: A2AConfig;
  private peers: Map<string, Peer> = new Map();
  private pendingRequests: Map<string, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();
  private messageQueue: A2AMessage[] = [];
  private heartbeatInterval?: NodeJS.Timeout;

  // Integrations
  private mcpServer: UniversalMCPServer;
  private proxyManager?: MCPProxyManager;
  private spawnerManager?: ServerSpawnerManager;

  constructor(
    config: A2AConfig,
    mcpServer: UniversalMCPServer,
    proxyManager?: MCPProxyManager,
    spawnerManager?: ServerSpawnerManager
  ) {
    super();

    this.config = config;
    this.mcpServer = mcpServer;
    this.proxyManager = proxyManager;
    this.spawnerManager = spawnerManager;

    // Start heartbeat
    this.startHeartbeat();
  }

  /**
   * Send a message to a peer or broadcast to all peers
   */
  async sendMessage(
    to: string | null, // null for broadcast
    type: MessageType,
    payload: any,
    options: Partial<{
      priority: MessagePriority;
      correlationId: string;
      ttl: number;
      metadata: Record<string, any>;
    }> = {}
  ): Promise<string> {
    const messageId = this.generateId();

    const message: A2AMessage = {
      id: messageId,
      type,
      priority: options.priority || MessagePriority.NORMAL,
      from: this.config.peerId,
      to: to || '*',
      timestamp: Date.now(),
      payload,
      correlationId: options.correlationId,
      ttl: options.ttl || this.config.messageTTLSecs,
      metadata: options.metadata,
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Message timeout: ${messageId}`));
      }, this.config.timeoutMs);

      this.pendingRequests.set(messageId, {
        resolve,
        reject,
        timeout,
      });

      this.queueMessage(message);
      this.processQueue();
    });
  }

  /**
   * Send a request and wait for response
   */
  async request(
    to: string,
    payload: any,
    options: Partial<{
      priority: MessagePriority;
      timeout: number;
      metadata: Record<string, any>;
    }> = {}
  ): Promise<A2AResponse> {
    const correlationId = this.generateId();

    await this.sendMessage(to, MessageType.REQUEST, payload, {
      correlationId,
      ttl: this.config.messageTTLSecs,
      ...options,
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(correlationId);
        reject(new Error(`Request timeout: ${correlationId}`));
      }, options.timeout || this.config.timeoutMs);

      this.pendingRequests.set(correlationId, {
        resolve,
        reject,
        timeout,
      });
    });
  }

  /**
   * Send a response to a request
   */
  async sendResponse(correlationId: string, response: Omit<A2AResponse, 'id' | 'correlationId' | 'timestamp'>): Promise<void> {
    const responseMessage: A2AResponse = {
      id: this.generateId(),
      correlationId,
      ...response,
      timestamp: Date.now(),
    };

    // Find the original request to determine receiver
    const pendingRequest = this.pendingRequests.get(correlationId);
    if (pendingRequest) {
      // Resolve the pending request
      if (response.success) {
        pendingRequest.resolve(response);
      } else {
        pendingRequest.reject(new Error(response.error || 'Request failed'));
      }
      clearTimeout(pendingRequest.timeout);
      this.pendingRequests.delete(correlationId);
    } else {
      // Broadcast response if no pending request (fire and forget)
      this.emit('response', responseMessage);
    }
  }

  /**
   * Register a peer
   */
  registerPeer(peer: Peer): void {
    peer.lastSeen = Date.now();
    this.peers.set(peer.id, peer);
    this.emit('peerConnected', peer);
    console.log(`[A2A] Peer registered: ${peer.name} (${peer.id})`);
  }

  /**
   * Unregister a peer
   */
  unregisterPeer(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      this.peers.delete(peerId);
      this.emit('peerDisconnected', peerId);
      console.log(`[A2A] Peer unregistered: ${peer.name} (${peerId})`);
    }
  }

  /**
   * Get all registered peers
   */
  getPeers(): Peer[] {
    return Array.from(this.peers.values());
  }

  /**
   * Update peer status
   */
  updatePeerStatus(peerId: string, status: Peer['status']): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.status = status;
      peer.lastSeen = Date.now();
    }
  }

  /**
   * Execute an MCP tool/command via A2A communication
   */
  async executeTool(peerId: string, toolName: string, args: any): Promise<any> {
    try {
      const response = await this.request(peerId, {
        action: 'execute_tool',
        toolName,
        args,
      });

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Tool execution failed');
      }
    } catch (error) {
      console.error(`[A2A] Tool execution failed:`, error);
      throw error;
    }
  }

  /**
   * Spawn a server on a remote peer
   */
  async spawnRemoteServer(peerId: string, serverConfig: any): Promise<any> {
    try {
      const response = await this.request(peerId, {
        action: 'spawn_server',
        config: serverConfig,
      });

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Server spawning failed');
      }
    } catch (error) {
      console.error(`[A2A] Remote server spawning failed:`, error);
      throw error;
    }
  }

  /**
   * Broadcast a message to all peers
   */
  async broadcast(type: MessageType, payload: any, options: any = {}): Promise<void> {
    await this.sendMessage(null, type, payload, options);
  }

  /**
   * Handle incoming messages
   */
  handleIncomingMessage(message: A2AMessage): void {
    // Check TTL
    if (message.ttl && message.timestamp + (message.ttl * 1000) < Date.now()) {
      console.warn(`[A2A] Message expired: ${message.id}`);
      return;
    }

    // Update peer status
    const peer = this.peers.get(message.from);
    if (peer) {
      peer.lastSeen = Date.now();
    }

    // Handle different message types
    switch (message.type) {
      case MessageType.REQUEST:
        this.handleRequest(message);
        break;

      case MessageType.RESPONSE:
        this.handleResponse(message);
        break;

      case MessageType.EVENT:
        this.emit('message', message);
        break;

      case MessageType.COMMAND:
        this.handleCommand(message);
        break;

      case MessageType.ERROR:
        this.emit('error', new Error(message.payload.message || 'Unknown error'));
        break;

      case MessageType.HEARTBEAT:
        this.handleHeartbeat(message);
        break;

      default:
        console.warn(`[A2A] Unknown message type: ${message.type}`);
    }
  }

  /**
   * Handle incoming requests
   */
  private async handleRequest(message: A2AMessage): Promise<void> {
    try {
      const { action, ...params } = message.payload;
      let result: any;

      switch (action) {
        case 'execute_tool':
          // Execute MCP tool via local server
          result = await this.mcpServer.callTool(params.serverId || 'default', params.toolName, params.args);
          break;

        case 'list_tools':
          result = await this.mcpServer.listTools();
          break;

        case 'list_resources':
          result = await this.mcpServer.listResources();
          break;

        case 'spawn_server':
          if (this.spawnerManager) {
            const spawnResult = await this.spawnerManager.startCustomServer(params.config);
            result = spawnResult;
          } else {
            throw new Error('Server spawner not available');
          }
          break;

        case 'server_status':
          if (this.spawnerManager) {
            result = this.spawnerManager.getStatus();
          } else {
            throw new Error('Server spawner not available');
          }
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      await this.sendResponse(message.id, {
        success: true,
        data: result,
      });

    } catch (error) {
      console.error(`[A2A] Request handling failed:`, error);
      await this.sendResponse(message.id, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle incoming responses
   */
  private handleResponse(message: A2AMessage): void {
    const response = message.payload as A2AResponse;
    const pending = this.pendingRequests.get(response.correlationId || '');

    if (pending) {
      if (response.success) {
        pending.resolve(response);
      } else {
        pending.reject(new Error(response.error || 'Request failed'));
      }
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(response.correlationId || '');
    }
  }

  /**
   * Handle incoming commands
   */
  private async handleCommand(message: A2AMessage): Promise<void> {
    // Commands can trigger local actions
    this.emit('message', message);
  }

  /**
   * Handle heartbeat messages
   */
  private handleHeartbeat(message: A2AMessage): void {
    const peerId = message.from;
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.lastSeen = Date.now();
      peer.status = 'online';
    }
  }

  /**
   * Queue a message for processing
   */
  private queueMessage(message: A2AMessage): void {
    this.messageQueue.push(message);
  }

  /**
   * Process the message queue
   */
  private async processQueue(): Promise<void> {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        try {
          // Here you would actually send the message via the transport layer
          // For now, we'll just emit it locally for testing
          this.emit('message', message);
        } catch (error) {
          console.error(`[A2A] Failed to process message ${message.id}:`, error);
          // Retry logic could go here
        }
      }
    }
  }

  /**
   * Start heartbeat mechanism
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      await this.broadcast(MessageType.HEARTBEAT, {
        peer: this.config.peerId,
        timestamp: Date.now(),
      });
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat mechanism
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  /**
   * Generate a unique ID for messages
   */
  private generateId(): string {
    return `a2a-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.stopHeartbeat();

    // Clear all timeouts
    for (const pending of this.pendingRequests.values()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Communication cleanup'));
    }

    this.pendingRequests.clear();
    this.messageQueue.length = 0;
    this.peers.clear();

    console.log('[A2A] Communication manager cleaned up');
  }

  /**
   * Get communication status
   */
  getStatus(): {
    peerCount: number;
    pendingRequests: number;
    messageQueueLength: number;
    uptime: number;
  } {
    return {
      peerCount: this.peers.size,
      pendingRequests: this.pendingRequests.size,
      messageQueueLength: this.messageQueue.length,
      uptime: Date.now() - (this.config as any).startTime,
    };
  }
}

/**
 * A2A Communication Factory
 */
export class A2ACommunicationFactory {
  private static instance: A2ACommunication | null = null;

  static create(
    config: A2AConfig,
    mcpServer: UniversalMCPServer,
    proxyManager?: MCPProxyManager,
    spawnerManager?: ServerSpawnerManager
  ): A2ACommunication {
    if (this.instance) {
      return this.instance;
    }

    this.instance = new A2ACommunication(config, mcpServer, proxyManager, spawnerManager);
    return this.instance;
  }

  static getInstance(): A2ACommunication | null {
    return this.instance;
  }

  static destroy(): void {
    if (this.instance) {
      this.instance.cleanup();
      this.instance = null;
    }
  }
}

console.log('[A2A Communication] AI-to-AI communication framework loaded');
