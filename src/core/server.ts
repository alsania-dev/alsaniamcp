import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { ToolRegistry } from '../types/index.js';

export class UniversalMCPServer {
  private server: Server;
  private toolRegistry: ToolRegistry = {};
  private activeServers: Map<string, any> = new Map();

  constructor() {
    this.server = new Server(
      {
        name: 'universal-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = [];
      
      for (const [serverId, serverTools] of Object.entries(this.toolRegistry)) {
        for (const [toolName, toolData] of Object.entries(serverTools)) {
          tools.push({
            name: `${serverId}/${toolName}`,
            description: toolData.schema.description || `Tool from ${serverId}`,
            inputSchema: toolData.schema.inputSchema || {
              type: 'object',
              properties: {},
            },
          });
        }
      }

      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const [serverId, toolName] = request.params.name.split('/');
      
      if (!this.toolRegistry[serverId]?.[toolName]) {
        throw new Error(`Tool ${request.params.name} not found`);
      }

      const tool = this.toolRegistry[serverId][toolName];
      tool.lastUsed = Date.now();

      const result = await tool.handler(request.params.arguments);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    });
  }

  registerTool(serverId: string, toolName: string, schema: any, handler: Function) {
    if (!this.toolRegistry[serverId]) {
      this.toolRegistry[serverId] = {};
    }

    this.toolRegistry[serverId][toolName] = {
      schema,
      handler,
      lastUsed: Date.now(),
    };
  }

  unregisterTool(serverId: string, toolName: string) {
    if (this.toolRegistry[serverId]?.[toolName]) {
      delete this.toolRegistry[serverId][toolName];
    }
  }

  cleanupUnusedTools(maxAge: number = 300000) {
    const now = Date.now();
    for (const [serverId, serverTools] of Object.entries(this.toolRegistry)) {
      for (const [toolName, toolData] of Object.entries(serverTools)) {
        if (now - toolData.lastUsed > maxAge) {
          this.unregisterTool(serverId, toolName);
        }
      }
    }
  }

  async callTool(serverId: string, toolName: string, args: any): Promise<any> {
    const fullName = `${serverId}/${toolName}`;
    
    if (!this.toolRegistry[serverId]?.[toolName]) {
      throw new Error(`Tool ${fullName} not found`);
    }

    const tool = this.toolRegistry[serverId][toolName];
    tool.lastUsed = Date.now();

    return await tool.handler(args);
  }

  listTools(): Array<{ serverId: string; toolName: string; schema: any }> {
    const tools: Array<{ serverId: string; toolName: string; schema: any }> = [];
    
    for (const [serverId, serverTools] of Object.entries(this.toolRegistry)) {
      for (const [toolName, toolData] of Object.entries(serverTools)) {
        tools.push({
          serverId,
          toolName,
          schema: toolData.schema,
        });
      }
    }

    return tools;
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    setInterval(() => this.cleanupUnusedTools(), 60000);
  }

  getServer() {
    return this.server;
  }
}
