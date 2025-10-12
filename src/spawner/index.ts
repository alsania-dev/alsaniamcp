/**
 * Dynamic MCP Server Spawning Module for AlsaniaMCP
 * Handles on-demand spawning and management of external MCP servers
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

export interface SpawnerConfig {
  maxServers: number;
  timeoutMs: number;
  workingDirectory: string;
  environmentVars: Record<string, string>;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

export interface ServerProcess {
  id: string;
  command: string;
  args: string[];
  process: ChildProcess;
  startedAt: Date;
  config: ServerConfig;
}

export interface ServerConfig {
  id: string;
  name: string;
  command: string;
  args: string[];
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
  maxRestarts: number;
  healthCheck?: {
    endpoint: string;
    interval: number;
  };
}

export interface SpawnResult {
  success: boolean;
  serverId: string;
  process?: ServerProcess;
  error?: string;
}

/**
 * Server Spawner Event Types
 */
export interface SpawnerEvents {
  serverStarted: [serverId: string, process: ServerProcess];
  serverStopped: [serverId: string, code: number | null, signal: string | null];
  serverError: [serverId: string, error: Error];
  serverRestart: [serverId: string, attempt: number];
  healthCheckFailed: [serverId: string, error: Error];
}

/**
 * Dynamic MCP Server Spawner
 * Manages spawning, monitoring, and lifecycle of external MCP servers
 */
export class MCPServerSpawner extends EventEmitter {
  private config: SpawnerConfig;
  private activeServers: Map<string, ServerProcess> = new Map();
  private restartCounts: Map<string, number> = new Map();

  constructor(config: Partial<SpawnerConfig> = {}) {
    super();

    this.config = {
      maxServers: 10,
      timeoutMs: 30000,
      workingDirectory: process.cwd(),
      environmentVars: {},
      logLevel: 'info',
      ...config,
    };
  }

  /**
   * Spawn a new MCP server process
   */
  async spawnServer(serverConfig: ServerConfig): Promise<SpawnResult> {
    // Check if we've reached the maximum number of servers
    if (this.activeServers.size >= this.config.maxServers) {
      return {
        success: false,
        serverId: serverConfig.id,
        error: `Maximum server limit reached (${this.config.maxServers})`,
      };
    }

    // Check if server is already running
    if (this.activeServers.has(serverConfig.id)) {
      return {
        success: false,
        serverId: serverConfig.id,
        error: `Server ${serverConfig.id} is already running`,
      };
    }

    try {
      const process = await this.spawnProcess(serverConfig);
      const serverProcess: ServerProcess = {
        id: serverConfig.id,
        command: serverConfig.command,
        args: serverConfig.args,
        process,
        startedAt: new Date(),
        config: serverConfig,
      };

      this.activeServers.set(serverConfig.id, serverProcess);
      this.setupProcessHandlers(serverProcess);

      if (serverConfig.healthCheck) {
        this.setupHealthCheck(serverProcess);
      }

      this.log('info', `Server ${serverConfig.id} spawned successfully`);

      this.emit('serverStarted', serverConfig.id, serverProcess);

      return {
        success: true,
        serverId: serverConfig.id,
        process: serverProcess,
      };

    } catch (error) {
      this.log('error', `Failed to spawn server ${serverConfig.id}:`, error);
      return {
        success: false,
        serverId: serverConfig.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Stop a running server
   */
  async stopServer(serverId: string, signal: NodeJS.Signals = 'SIGTERM'): Promise<boolean> {
    const serverProcess = this.activeServers.get(serverId);
    if (!serverProcess) {
      this.log('warn', `Server ${serverId} not found or not running`);
      return false;
    }

    try {
      const success = await this.terminateProcess(serverProcess.process, signal);
      if (success) {
        this.activeServers.delete(serverId);
        this.restartCounts.delete(serverId);
        this.log('info', `Server ${serverId} stopped successfully`);
        this.emit('serverStopped', serverId, null, signal);
      }
      return success;
    } catch (error) {
      this.log('error', `Failed to stop server ${serverId}:`, error);
      return false;
    }
  }

  /**
   * Stop all running servers
   */
  async stopAllServers(signal: NodeJS.Signals = 'SIGTERM'): Promise<void> {
    const promises = Array.from(this.activeServers.keys()).map(
      serverId => this.stopServer(serverId, signal)
    );

    await Promise.allSettled(promises);
    this.activeServers.clear();
    this.restartCounts.clear();
    this.log('info', 'All servers stopped');
  }

  /**
   * Restart a server with exponential backoff
   */
  async restartServer(serverId: string): Promise<SpawnResult> {
    const serverProcess = this.activeServers.get(serverId);
    if (!serverProcess) {
      return {
        success: false,
        serverId,
        error: `Server ${serverId} not found`,
      };
    }

    const currentRestarts = this.restartCounts.get(serverId) || 0;
    if (currentRestarts >= serverProcess.config.maxRestarts) {
      return {
        success: false,
        serverId,
        error: `Maximum restart attempts exceeded for server ${serverId}`,
      };
    }

    // Stop the current server
    await this.stopServer(serverId, 'SIGKILL');

    // Wait with exponential backoff
    const delay = Math.min(1000 * Math.pow(2, currentRestarts), 30000);
    await new Promise(resolve => setTimeout(resolve, delay));

    this.restartCounts.set(serverId, currentRestarts + 1);
    const result = await this.spawnServer(serverProcess.config);

    if (result.success) {
      this.emit('serverRestart', serverId, currentRestarts + 1);
    }

    return result;
  }

  /**
   * Get status of all servers
   */
  getStatus(): {
    total: number;
    active: string[];
    servers: Array<{
      id: string;
      name: string;
      uptime: number;
      restarts: number;
      memory?: NodeJS.MemoryUsage;
    }>;
  } {
    const servers = Array.from(this.activeServers.entries()).map(([id, server]) => ({
      id,
      name: server.config.name,
      uptime: Date.now() - server.startedAt.getTime(),
      restarts: this.restartCounts.get(id) || 0,
      // memory: server.process.memoryUsage?.(), // Not available in ChildProcess
    }));

    return {
      total: this.activeServers.size,
      active: Array.from(this.activeServers.keys()),
      servers,
    };
  }

  /**
   * Execute process spawning
   */
  private async spawnProcess(config: ServerConfig): Promise<ChildProcess> {
    const env = {
      ...process.env,
      ...this.config.environmentVars,
      ...config.env,
    };

    const cwd = config.cwd || this.config.workingDirectory;

    this.log('info', `Spawning server ${config.id}: ${config.command} ${config.args.join(' ')}`);

    const childProcess = spawn(config.command, config.args, {
      cwd,
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Set up timeout
    const timeout = config.timeout || this.config.timeoutMs;
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Server spawn timeout after ${timeout}ms`));
      }, timeout);
    });

    const spawnPromise = new Promise<ChildProcess>((resolve) => {
      childProcess.on('spawn', () => {
        resolve(childProcess);
      });
    });

    return Promise.race([spawnPromise, timeoutPromise]);
  }

  /**
   * Set up process event handlers
   */
  private setupProcessHandlers(serverProcess: ServerProcess): void {
    const { process, config } = serverProcess;

    // Handle process exit
    process.on('exit', (code, signal) => {
      this.activeServers.delete(config.id);
      this.emit('serverStopped', config.id, code, signal);

      if (code !== 0 && code !== null) {
        this.log('warn', `Server ${config.id} exited with code ${code}`);

        // Auto-restart if enabled and within limits
        if (config.maxRestarts > 0) {
          setTimeout(() => {
            this.restartServer(config.id);
          }, 1000);
        }
      } else {
        this.restartCounts.delete(config.id);
      }
    });

    // Handle errors
    process.on('error', (error) => {
      this.log('error', `Server ${config.id} process error:`, error);
      this.emit('serverError', config.id, error);
    });

    // Pipe logs to console for debugging
    if (this.config.logLevel === 'debug') {
      process.stdout?.on('data', (data) => {
        console.log(`[${config.id}]`, data.toString().trim());
      });

      process.stderr?.on('data', (data) => {
        console.error(`[${config.id}]`, data.toString().trim());
      });
    }
  }

  /**
   * Set up health checks for server monitoring
   */
  private setupHealthCheck(serverProcess: ServerProcess): void {
    const { config } = serverProcess;
    const healthCheck = config.healthCheck;

    if (!healthCheck) return;

    const check = () => {
      // Basic health check implementation
      // This would typically make HTTP requests to check server health
      // For now, just check if process is still running
      if (!this.activeServers.has(config.id)) {
        return; // Server already stopped
      }

      // Placeholder for HTTP health check
      // In a real implementation, you'd make HTTP requests here
      // For now, just ensure the process is still alive
      const process = serverProcess.process;
      if (process.killed) {
        this.emit('healthCheckFailed', config.id, new Error('Process killed'));
      }
    };

    setInterval(check, healthCheck.interval);
  }

  /**
   * Terminate a process gracefully
   */
  private async terminateProcess(childProcess: ChildProcess, signal: NodeJS.Signals): Promise<boolean> {
    return new Promise((resolve) => {
      if (childProcess.killed) {
        resolve(true);
        return;
      }

      childProcess.kill(signal);

      // Wait for exit or timeout
      const timeout = setTimeout(() => {
        if (!childProcess.killed) {
          childProcess.kill('SIGKILL');
        }
        resolve(false);
      }, 5000);

      childProcess.on('exit', () => {
        clearTimeout(timeout);
        resolve(true);
      });
    });
  }

  /**
   * Internal logging function
   */
  private log(level: string, message: string, ...args: any[]): void {
    if (level === 'error') {
      console.error(`[Spawner] ${message}`, ...args);
    } else if (level === 'warn' && ['warn', 'info', 'debug'].includes(this.config.logLevel)) {
      console.warn(`[Spawner] ${message}`, ...args);
    } else if (level === 'info' && ['info', 'debug'].includes(this.config.logLevel)) {
      console.log(`[Spawner] ${message}`, ...args);
    } else if (level === 'debug' && this.config.logLevel === 'debug') {
      console.debug(`[Spawner] ${message}`, ...args);
    }
  }

  /**
   * Get spawner configuration
   */
  getConfig(): SpawnerConfig {
    return { ...this.config };
  }

  /**
   * Update spawner configuration
   */
  updateConfig(newConfig: Partial<SpawnerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.log('info', 'Spawner configuration updated');
  }
}

/**
 * Predefined server configurations for common MCP servers
 */
export const COMMON_SERVER_CONFIGS: Record<string, ServerConfig> = {
  'filesystem': {
    id: 'filesystem-server',
    name: 'Filesystem MCP Server',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
    maxRestarts: 3,
    healthCheck: {
      endpoint: '/health',
      interval: 30000,
    },
  },

  'github': {
    id: 'github-server',
    name: 'GitHub MCP Server',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: {
      GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_TOKEN || '',
    },
    maxRestarts: 3,
  },

  'git': {
    id: 'git-server',
    name: 'Git MCP Server',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-git', '--repository', process.cwd()],
    maxRestarts: 3,
  },
};

/**
 * Server Spawner Manager - High-level interface
 */
export class ServerSpawnerManager extends EventEmitter {
  private spawner: MCPServerSpawner;
  private activeConfigurations: Map<string, ServerConfig> = new Map();

  constructor(config: Partial<SpawnerConfig> = {}) {
    super();
    this.spawner = new MCPServerSpawner(config);

    // Forward events from spawner
    ['serverStarted', 'serverStopped', 'serverError', 'serverRestart', 'healthCheckFailed']
      .forEach(event => {
        this.spawner.on(event, (...args) => this.emit(event, ...args));
      });
  }

  /**
   * Start a server by ID using common configurations
   */
  async startCommonServer(serverId: keyof typeof COMMON_SERVER_CONFIGS): Promise<SpawnResult> {
    const config = COMMON_SERVER_CONFIGS[serverId];
    if (!config) {
      return {
        success: false,
        serverId,
        error: `Unknown server configuration: ${serverId}`,
      };
    }

    this.activeConfigurations.set(config.id, config);
    return this.spawner.spawnServer(config);
  }

  /**
   * Start a custom server with provided configuration
   */
  async startCustomServer(config: ServerConfig): Promise<SpawnResult> {
    this.activeConfigurations.set(config.id, config);
    return this.spawner.spawnServer(config);
  }

  /**
   * Stop a server by ID
   */
  async stopServer(serverId: string): Promise<boolean> {
    return this.spawner.stopServer(serverId);
  }

  /**
   * Stop all servers
   */
  async stopAll(): Promise<void> {
    return this.spawner.stopAllServers();
  }

  /**
   * Get spawn manager status
   */
  getStatus() {
    return this.spawner.getStatus();
  }

  /**
   * Get available common server configurations
   */
  getAvailableServers(): string[] {
    return Object.keys(COMMON_SERVER_CONFIGS);
  }

  /**
   * Get server configuration by ID
   */
  getServerConfig(serverId: string): ServerConfig | undefined {
    return this.activeConfigurations.get(serverId);
  }

  /**
   * Forward events from spawner
   */
  emit(event: string, ...args: any[]): boolean {
    return super.emit(event, ...args);
  }

  on(event: string, listener: (...args: any[]) => void): this {
    super.on(event, listener);
    return this;
  }
}

console.log('[Spawner Module] Dynamic MCP server spawning module loaded');
