import express, { Request, Response } from 'express';
import { GatewayRoute } from '../types/index.js';
import { UniversalMCPServer } from '../core/server.js';
import { MCPProxyManager } from '../proxy/mcp-proxy.js';
import jwt from 'jsonwebtoken';

export class HTTPGateway {
  private app: express.Application;
  private routes: Map<string, GatewayRoute> = new Map();
  private mcpServer: UniversalMCPServer;
  private proxyManager: MCPProxyManager;
  private port: number;

  constructor(mcpServer: UniversalMCPServer, proxyManager: MCPProxyManager, port: number = 5000) {
    this.app = express();
    this.mcpServer = mcpServer;
    this.proxyManager = proxyManager;
    this.port = port;
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(express.json());
    
    this.app.use((req, res, next) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      next();
    });
  }

  private setupRoutes() {
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: Date.now() });
    });

    this.app.get('/stream', this.handleSSE.bind(this));

    this.app.post('/message', async (req, res) => {
      try {
        const { serverId, toolName, args } = req.body;
        
        const result = await this.mcpServer.callTool(serverId, toolName, args);
        
        res.json({ success: true, result });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.get('/tools', async (req, res) => {
      const tools = this.mcpServer.listTools();
      res.json({ tools });
    });

    this.app.get('/resources', async (req, res) => {
      const resources = this.mcpServer.listResources();
      res.json({ resources });
    });

    this.app.post('/resource', async (req, res) => {
      try {
        const { serverId, resourceUri } = req.body;
        
        const result = await this.mcpServer.readResource(serverId, resourceUri);
        
        res.json({ success: true, result });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.get('/prompts', async (req, res) => {
      const prompts = this.mcpServer.listPrompts();
      res.json({ prompts });
    });

    this.app.post('/prompt', async (req, res) => {
      try {
        const { serverId, promptName, args } = req.body;
        
        const result = await this.mcpServer.getPrompt(serverId, promptName, args);
        
        res.json({ success: true, result });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post('/proxy/connect', async (req, res) => {
      try {
        const serverId = await this.proxyManager.connectToServer(req.body);
        res.json({ success: true, serverId });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post('/proxy/disconnect/:serverId', async (req, res) => {
      try {
        await this.proxyManager.disconnectServer(req.params.serverId);
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.get('/proxy/servers', async (req, res) => {
      const servers = this.proxyManager.getActiveServers();
      res.json({ servers });
    });

    this.app.get('/proxy/status/:serverId', async (req, res) => {
      const status = this.proxyManager.getServerStatus(req.params.serverId);
      if (!status) {
        return res.status(404).json({ error: 'Server not found' });
      }
      res.json(status);
    });

    this.app.post('/gateway/:route', async (req, res) => {
      const routeConfig = this.routes.get(req.params.route);
      
      if (!routeConfig) {
        return res.status(404).json({ error: 'Route not found' });
      }

      if (routeConfig.requiresAuth) {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token || !this.verifyToken(token)) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
      }

      try {
        const result = await this.routeToServer(routeConfig.targetServerId, req.body);
        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  private handleSSE(req: Request, res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Cache-Control', 'no-cache');

    const sendEvent = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    sendEvent({ type: 'connected', timestamp: Date.now() });

    const heartbeat = setInterval(() => {
      sendEvent({ type: 'heartbeat', timestamp: Date.now() });
    }, 30000);

    req.on('close', () => {
      clearInterval(heartbeat);
    });
  }

  private verifyToken(token: string): boolean {
    try {
      jwt.verify(token, process.env.SESSION_SECRET || 'default-secret');
      return true;
    } catch {
      return false;
    }
  }

  private async routeToServer(serverId: string, data: any): Promise<any> {
    const { toolName, args } = data;
    return await this.mcpServer.callTool(serverId, toolName, args);
  }

  addRoute(path: string, route: GatewayRoute) {
    this.routes.set(path, route);
  }

  start() {
    this.app.listen(this.port, '0.0.0.0', () => {
      console.log(`HTTP Gateway listening on port ${this.port}`);
      console.log(`SSE endpoint: http://localhost:${this.port}/stream`);
    });
  }
}
