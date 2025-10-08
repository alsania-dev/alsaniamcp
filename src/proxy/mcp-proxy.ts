import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { spawn, ChildProcess } from 'child_process';
import { MCPServerConfig, ServerInstance } from '../types/index.js';
import { UniversalMCPServer } from '../core/server.js';

export class MCPProxyManager {
  private instances: Map<string, ServerInstance> = new Map();
  private mcpServer: UniversalMCPServer;

  constructor(mcpServer: UniversalMCPServer) {
    this.mcpServer = mcpServer;
  }

  async connectToServer(config: MCPServerConfig): Promise<string> {
    const instance: ServerInstance = {
      id: config.id,
      config,
      status: 'spawning',
      createdAt: Date.now(),
      expiresAt: config.lifespan ? Date.now() + config.lifespan : undefined,
    };

    try {
      if (config.transport === 'stdio' && config.command) {
        await this.connectStdio(instance);
      } else if (config.transport === 'http' && config.endpoint) {
        await this.connectHTTP(instance);
      } else {
        throw new Error(`Unsupported transport: ${config.transport}`);
      }

      this.instances.set(config.id, instance);

      await this.syncTools(config.id);

      instance.status = 'active';
      return config.id;
    } catch (error: any) {
      instance.status = 'error';
      throw new Error(`Failed to connect to ${config.id}: ${error.message}`);
    }
  }

  private async connectStdio(instance: ServerInstance): Promise<void> {
    const { command, args = [] } = instance.config;
    
    if (!command) {
      throw new Error('STDIO transport requires a command');
    }

    const transport = new StdioClientTransport({
      command,
      args,
    });

    const client = new Client(
      {
        name: 'AlsaniaMCP-Proxy',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    await client.connect(transport);
    instance.client = client;
    instance.transport = transport;
  }

  private async connectHTTP(instance: ServerInstance): Promise<void> {
    const { endpoint } = instance.config;
    
    if (!endpoint) {
      throw new Error('HTTP transport requires an endpoint');
    }

    const transport = new StreamableHTTPClientTransport(new URL(endpoint));

    const client = new Client(
      {
        name: 'AlsaniaMCP-Proxy',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    await client.connect(transport);
    instance.client = client;
    instance.transport = transport;
  }

  private async syncTools(serverId: string): Promise<void> {
    const instance = this.instances.get(serverId);
    if (!instance?.client) {
      throw new Error(`Server ${serverId} not connected`);
    }

    const { tools } = await instance.client.request(
      { method: 'tools/list' },
      {} as any
    );

    for (const tool of tools || []) {
      this.mcpServer.registerTool(
        serverId,
        tool.name,
        {
          description: tool.description,
          inputSchema: tool.inputSchema,
        },
        async (args: any) => {
          return await this.callRemoteTool(serverId, tool.name, args);
        }
      );
    }

    try {
      const { resources } = await instance.client.request(
        { method: 'resources/list' },
        {} as any
      );

      for (const resource of resources || []) {
        this.mcpServer.registerResource(
          serverId,
          resource.uri,
          resource.name,
          async () => {
            return await this.readRemoteResource(serverId, resource.uri);
          },
          resource.description,
          resource.mimeType
        );
      }
    } catch {}

    try {
      const { prompts } = await instance.client.request(
        { method: 'prompts/list' },
        {} as any
      );

      for (const prompt of prompts || []) {
        this.mcpServer.registerPrompt(
          serverId,
          prompt.name,
          async (args: any) => {
            return await this.getRemotePrompt(serverId, prompt.name, args);
          },
          prompt.description,
          prompt.arguments
        );
      }
    } catch {}
  }

  private async callRemoteTool(serverId: string, toolName: string, args: any): Promise<any> {
    const instance = this.instances.get(serverId);
    if (!instance?.client) {
      throw new Error(`Server ${serverId} not connected`);
    }

    const result = await instance.client.request(
      {
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args,
        },
      },
      {} as any
    );

    return result;
  }

  private async readRemoteResource(serverId: string, uri: string): Promise<any> {
    const instance = this.instances.get(serverId);
    if (!instance?.client) {
      throw new Error(`Server ${serverId} not connected`);
    }

    const result = await instance.client.request(
      {
        method: 'resources/read',
        params: { uri },
      },
      {} as any
    );

    return result;
  }

  private async getRemotePrompt(serverId: string, promptName: string, args: any): Promise<any> {
    const instance = this.instances.get(serverId);
    if (!instance?.client) {
      throw new Error(`Server ${serverId} not connected`);
    }

    const result = await instance.client.request(
      {
        method: 'prompts/get',
        params: {
          name: promptName,
          arguments: args,
        },
      },
      {} as any
    );

    return result;
  }

  async disconnectServer(serverId: string): Promise<void> {
    const instance = this.instances.get(serverId);
    if (!instance) {
      return;
    }

    try {
      if (instance.client) {
        await instance.client.close();
      }
    } catch (error) {
      console.error(`Error closing client for ${serverId}:`, error);
    }

    try {
      if (instance.transport && typeof instance.transport.close === 'function') {
        await instance.transport.close();
      }
    } catch (error) {
      console.error(`Error closing transport for ${serverId}:`, error);
    }

    if (instance.process) {
      try {
        instance.process.kill();
      } catch (error) {
        console.error(`Error killing process for ${serverId}:`, error);
      }
    }

    const tools = this.mcpServer.listTools().filter(t => t.serverId === serverId);
    for (const tool of tools) {
      this.mcpServer.unregisterTool(serverId, tool.toolName);
    }

    const resources = this.mcpServer.listResources().filter(r => r.serverId === serverId);
    for (const resource of resources) {
      this.mcpServer.unregisterResource(serverId, resource.resourceUri);
    }

    const prompts = this.mcpServer.listPrompts().filter(p => p.serverId === serverId);
    for (const prompt of prompts) {
      this.mcpServer.unregisterPrompt(serverId, prompt.promptName);
    }

    this.instances.delete(serverId);
  }

  async cleanupExpired(): Promise<void> {
    const now = Date.now();
    for (const [serverId, instance] of this.instances.entries()) {
      if (instance.expiresAt && now > instance.expiresAt) {
        await this.disconnectServer(serverId);
      }
    }
  }

  getActiveServers(): ServerInstance[] {
    return Array.from(this.instances.values());
  }

  getServerStatus(serverId: string): ServerInstance | undefined {
    return this.instances.get(serverId);
  }
}
