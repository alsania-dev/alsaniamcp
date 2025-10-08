# AlsaniaMCP 🌐

> Universal Model Context Protocol (MCP) server with dynamic proxy, multi-transport support, and AI-to-AI communication capabilities

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![MCP SDK](https://img.shields.io/badge/MCP_SDK-latest-green.svg)](https://modelcontextprotocol.io)

## ✨ Features

- 🔄 **Universal MCP Proxy** - Acts as a 2-way gateway between AI systems and MCP servers
- 🌍 **Multi-Transport Support** - STDIO, HTTP/SSE, and Streamable HTTP transports
- 🎯 **Dynamic Tool Registry** - On-demand loading/unloading of tools from multiple servers
- 🔌 **HTTP Gateway** - RESTful API with Server-Sent Events for streaming
- 🔐 **Secure** - JWT authentication and BLAKE3 hashing
- 🐳 **Docker Ready** - Easy deployment with Docker and docker-compose
- 📦 **NPX Support** - Install and run with `npx @alsaniamcp/mcp`

## 🚀 Quick Start

### Using NPX (Easiest)

```bash
npx -y @alsaniamcp/mcp start
```

### Using Docker

```bash
# Pull and run
docker run -p 5000:5000 alsaniamcp/mcp:latest

# Or with docker-compose
docker-compose up
```

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build
npm run build

# Start production server
npm start
```

## 📡 Transport Layer

AlsaniaMCP supports three transport mechanisms:

### 1. STDIO Transport (Local MCP Servers)
Connect to local MCP servers via stdin/stdout:
```bash
# Server automatically uses STDIO for local communication
```

### 2. HTTP/SSE Gateway (Remote Clients)
Expose tools to remote clients via HTTP REST API:
- **Base URL**: `http://localhost:5000`
- **SSE Stream**: `http://localhost:5000/stream`
- **Health Check**: `http://localhost:5000/health`

### 3. HTTP Proxy Transport (Remote MCP Servers)
Connect to remote MCP servers using Streamable HTTP:
```bash
POST /proxy/connect
{
  "id": "remote-server",
  "transport": "http",
  "endpoint": "http://remote-mcp-server.com/mcp"
}
```

## 🛠️ API Endpoints

### Core Endpoints
- `GET /health` - Health check
- `GET /stream` - SSE streaming endpoint for notifications
- `POST /message` - Call tools (requires: serverId, toolName, args)
- `GET /tools` - List all available tools
- `GET /resources` - List all resources
- `POST /resource` - Read a specific resource
- `GET /prompts` - List all prompts
- `POST /prompt` - Get a prompt with arguments

### Proxy Management
- `POST /proxy/connect` - Connect to external MCP server
- `POST /proxy/disconnect/:serverId` - Disconnect server
- `GET /proxy/servers` - List active proxy connections
- `GET /proxy/status/:serverId` - Get server status

## 📋 Usage Examples

### Connect to Remote MCP Server
```bash
curl -X POST http://localhost:5000/proxy/connect \
  -H "Content-Type: application/json" \
  -d '{
    "id": "github-server",
    "transport": "http",
    "endpoint": "http://localhost:3000/mcp"
  }'
```

### Call a Tool
```bash
curl -X POST http://localhost:5000/message \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "core",
    "toolName": "echo",
    "args": {"message": "Hello AlsaniaMCP!"}
  }'
```

### List All Tools
```bash
curl http://localhost:5000/tools
```

### Stream Notifications (SSE)
```bash
curl -N http://localhost:5000/stream
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│          AlsaniaMCP Server              │
│  ┌──────────────────────────────────┐   │
│  │   UniversalMCPServer             │   │
│  │   - Tool Registry                │   │
│  │   - Resource Registry            │   │
│  │   - Prompt Registry              │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │   MCPProxyManager                │   │
│  │   - STDIO Transport              │   │
│  │   - HTTP Transport               │   │
│  │   - Dynamic Loading              │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │   HTTPGateway                    │   │
│  │   - REST API                     │   │
│  │   - SSE Streaming                │   │
│  │   - Proxy Endpoints              │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## 🔧 Configuration

### Environment Variables
- `PORT` - HTTP gateway port (default: 5000)
- `SESSION_SECRET` - JWT secret for authentication
- `NODE_ENV` - Environment (development/production)

### Server Configuration Example
```typescript
const config: MCPServerConfig = {
  id: 'my-server',
  transport: 'http',
  endpoint: 'http://localhost:3000/mcp',
  lifespan: 3600000, // 1 hour
  permissions: {
    tools: ['read', 'write'],
    resources: ['read']
  }
};
```

## 🔒 Security

- **JWT Authentication** - Secure session management
- **BLAKE3 Hashing** - Fast and secure cryptographic hashing
- **Environment Secrets** - API keys stored in environment variables
- **Input Validation** - Zod schema validation for all inputs

## 📦 CLI Commands

```bash
# Start server
alsaniamcp start

# Or use short alias
amcp start

# Initialize configuration
alsaniamcp init

# Manage proxy connections
alsaniamcp proxy --list
```

## 🐳 Docker Deployment

### Build Image
```bash
docker build -t alsaniamcp/mcp:latest .
```

### Run Container
```bash
docker run -d \
  -p 5000:5000 \
  -e SESSION_SECRET=your-secret-here \
  --name alsaniamcp \
  alsaniamcp/mcp:latest
```

### Docker Compose
```bash
docker-compose up -d
```

## 🧪 Development

### Project Structure
```
src/
├── core/           # Core MCP server implementation
├── proxy/          # MCP proxy manager
├── transport/      # HTTP gateway and transports
├── types/          # TypeScript type definitions
├── cli.ts          # CLI implementation
└── index.ts        # Entry point
```

### Scripts
- `npm run dev` - Start development server with watch mode
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests (coming soon)

## 🎯 Roadmap

- [x] Core MCP server with JSON-RPC 2.0
- [x] Dynamic proxy/registry system
- [x] Multi-transport layer (STDIO, HTTP/SSE)
- [x] HTTP streaming gateway
- [x] Streamable HTTP proxy transport
- [ ] AI-to-AI communication framework
- [ ] Voice activation with keyword detection
- [ ] Speech-to-text and text-to-speech
- [ ] Dynamic MCP server spawning
- [ ] Advanced security layer
- [ ] Chaos testing framework
- [ ] Performance monitoring

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

- **Documentation**: [MCP Protocol Docs](https://modelcontextprotocol.io)
- **Issues**: [GitHub Issues](https://github.com/alsaniamcp/mcp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/alsaniamcp/mcp/discussions)

---

Built with ❤️ using the [Model Context Protocol](https://modelcontextprotocol.io)
