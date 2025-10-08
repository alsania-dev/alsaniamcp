import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { ToolRegistry } from '../types/index.js';

interface ResourceRegistry {
  [serverId: string]: {
    [resourceUri: string]: {
      name: string;
      description?: string;
      mimeType?: string;
      handler: Function;
      lastUsed: number;
    };
  };
}

interface PromptRegistry {
  [serverId: string]: {
    [promptName: string]: {
      description?: string;
      arguments?: any[];
      handler: Function;
      lastUsed: number;
    };
  };
}

export class UniversalMCPServer {
  private server: Server;
  private toolRegistry: ToolRegistry = {};
  private resourceRegistry: ResourceRegistry = {};
  private promptRegistry: PromptRegistry = {};
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

    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resources: any[] = [];
      
      for (const [serverId, serverResources] of Object.entries(this.resourceRegistry)) {
        for (const [resourceUri, resourceData] of Object.entries(serverResources)) {
          resources.push({
            uri: `${serverId}://${resourceUri}`,
            name: resourceData.name,
            description: resourceData.description,
            mimeType: resourceData.mimeType,
          });
        }
      }

      return { resources };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;
      const [serverId, ...resourceParts] = uri.split('://');
      const resourceUri = resourceParts.join('://');
      
      if (!this.resourceRegistry[serverId]?.[resourceUri]) {
        throw new Error(`Resource ${uri} not found`);
      }

      const resource = this.resourceRegistry[serverId][resourceUri];
      resource.lastUsed = Date.now();

      const content = await resource.handler();
      
      return {
        contents: [
          {
            uri,
            mimeType: resource.mimeType || 'text/plain',
            text: typeof content === 'string' ? content : JSON.stringify(content, null, 2),
          },
        ],
      };
    });

    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      const prompts: any[] = [];
      
      for (const [serverId, serverPrompts] of Object.entries(this.promptRegistry)) {
        for (const [promptName, promptData] of Object.entries(serverPrompts)) {
          prompts.push({
            name: `${serverId}/${promptName}`,
            description: promptData.description,
            arguments: promptData.arguments || [],
          });
        }
      }

      return { prompts };
    });

    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const [serverId, promptName] = request.params.name.split('/');
      
      if (!this.promptRegistry[serverId]?.[promptName]) {
        throw new Error(`Prompt ${request.params.name} not found`);
      }

      const prompt = this.promptRegistry[serverId][promptName];
      prompt.lastUsed = Date.now();

      const result = await prompt.handler(request.params.arguments);
      
      return {
        description: prompt.description,
        messages: Array.isArray(result) ? result : [
          {
            role: 'user',
            content: {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            },
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

  registerResource(
    serverId: string,
    resourceUri: string,
    name: string,
    handler: Function,
    description?: string,
    mimeType?: string
  ) {
    if (!this.resourceRegistry[serverId]) {
      this.resourceRegistry[serverId] = {};
    }

    this.resourceRegistry[serverId][resourceUri] = {
      name,
      description,
      mimeType,
      handler,
      lastUsed: Date.now(),
    };
  }

  unregisterResource(serverId: string, resourceUri: string) {
    if (this.resourceRegistry[serverId]?.[resourceUri]) {
      delete this.resourceRegistry[serverId][resourceUri];
    }
  }

  registerPrompt(
    serverId: string,
    promptName: string,
    handler: Function,
    description?: string,
    args?: any[]
  ) {
    if (!this.promptRegistry[serverId]) {
      this.promptRegistry[serverId] = {};
    }

    this.promptRegistry[serverId][promptName] = {
      description,
      arguments: args,
      handler,
      lastUsed: Date.now(),
    };
  }

  unregisterPrompt(serverId: string, promptName: string) {
    if (this.promptRegistry[serverId]?.[promptName]) {
      delete this.promptRegistry[serverId][promptName];
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

    for (const [serverId, serverResources] of Object.entries(this.resourceRegistry)) {
      for (const [resourceUri, resourceData] of Object.entries(serverResources)) {
        if (now - resourceData.lastUsed > maxAge) {
          this.unregisterResource(serverId, resourceUri);
        }
      }
    }

    for (const [serverId, serverPrompts] of Object.entries(this.promptRegistry)) {
      for (const [promptName, promptData] of Object.entries(serverPrompts)) {
        if (now - promptData.lastUsed > maxAge) {
          this.unregisterPrompt(serverId, promptName);
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

  async readResource(serverId: string, resourceUri: string): Promise<any> {
    if (!this.resourceRegistry[serverId]?.[resourceUri]) {
      throw new Error(`Resource ${serverId}://${resourceUri} not found`);
    }

    const resource = this.resourceRegistry[serverId][resourceUri];
    resource.lastUsed = Date.now();

    return await resource.handler();
  }

  async getPrompt(serverId: string, promptName: string, args?: any): Promise<any> {
    if (!this.promptRegistry[serverId]?.[promptName]) {
      throw new Error(`Prompt ${serverId}/${promptName} not found`);
    }

    const prompt = this.promptRegistry[serverId][promptName];
    prompt.lastUsed = Date.now();

    return await prompt.handler(args);
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

  listResources(): Array<{ serverId: string; resourceUri: string; name: string; description?: string; mimeType?: string }> {
    const resources: Array<any> = [];
    
    for (const [serverId, serverResources] of Object.entries(this.resourceRegistry)) {
      for (const [resourceUri, resourceData] of Object.entries(serverResources)) {
        resources.push({
          serverId,
          resourceUri,
          name: resourceData.name,
          description: resourceData.description,
          mimeType: resourceData.mimeType,
        });
      }
    }

    return resources;
  }

  listPrompts(): Array<{ serverId: string; promptName: string; description?: string; arguments?: any[] }> {
    const prompts: Array<any> = [];
    
    for (const [serverId, serverPrompts] of Object.entries(this.promptRegistry)) {
      for (const [promptName, promptData] of Object.entries(serverPrompts)) {
        prompts.push({
          serverId,
          promptName,
          description: promptData.description,
          arguments: promptData.arguments,
        });
      }
    }

    return prompts;
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
