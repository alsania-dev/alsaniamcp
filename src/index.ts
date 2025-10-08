import 'dotenv/config';
import { UniversalMCPServer } from './core/server.js';
import { HTTPGateway } from './transport/http-gateway.js';
import { MCPProxyManager } from './proxy/mcp-proxy.js';

async function main() {
  console.log('🚀 Starting AlsaniaMCP Server...');

  const mcpServer = new UniversalMCPServer();
  const proxyManager = new MCPProxyManager(mcpServer);
  
  mcpServer.registerTool(
    'core',
    'echo',
    {
      description: 'Echo back the input',
      inputSchema: {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
        required: ['message'],
      },
    },
    async (args: any) => {
      return { echo: args.message };
    }
  );

  mcpServer.registerResource(
    'core',
    'status',
    'Server Status',
    async () => {
      return {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: Date.now(),
      };
    },
    'Current server status and metrics',
    'application/json'
  );

  mcpServer.registerPrompt(
    'core',
    'greeting',
    async (args: any) => {
      const name = args?.name || 'there';
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Hello ${name}! I'm AlsaniaMCP - your universal AI communication and tool proxy server. How can I help you today?`,
          },
        },
      ];
    },
    'Generate a greeting message',
    [{ name: 'name', description: 'Name to greet', required: false }]
  );

  await mcpServer.start();

  const gateway = new HTTPGateway(mcpServer, proxyManager, 5000);
  
  setInterval(async () => {
    await proxyManager.cleanupExpired();
  }, 60000);
  
  gateway.addRoute('test', {
    path: '/test',
    targetServerId: 'core',
    method: 'POST',
    requiresAuth: false,
  });

  gateway.start();

  console.log('✅ AlsaniaMCP Server is running');
  console.log('📡 HTTP Gateway: http://localhost:5000');
  console.log('🔊 SSE Stream: http://localhost:5000/stream');
}

main().catch(console.error);
