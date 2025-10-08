# AlsaniaMCP Server

## Overview
AlsaniaMCP is a universal Model Context Protocol (MCP) server that acts as a 2-way proxy with dynamic tool registry, AI-to-AI communication, voice activation, and server spawning capabilities.

## Current State
- ✅ Core MCP server with JSON-RPC 2.0 protocol supporting tools, resources, and prompts
- ✅ Dynamic MCP proxy/registry system with on-demand tool loading and unloading
- ✅ Multi-transport layer (STDIO, HTTP/SSE gateway, HTTP proxy for remote MCP servers)
- ✅ HTTP streaming gateway with proxy management endpoints
- ✅ Streamable HTTP proxy transport using MCP SDK for remote server connections
- 🚧 AI-to-AI communication framework (pending)
- 🚧 Voice activation system with keyword detection (pending)
- 🚧 Speech-to-text and text-to-speech (pending)
- 🚧 Dynamic MCP server spawning with permissions (pending)
- 🚧 Security layer with BLAKE3 and authentication (pending)
- 🚧 CLI management tools (basic implementation)

## Recent Changes
- **2025-10-08**: Renamed project to AlsaniaMCP (@alsaniamcp/mcp)
- **2025-10-08**: Added npm package configuration with bin support for npx usage
- **2025-10-08**: Created Dockerfile and docker-compose.yml for containerization
- **2025-10-08**: Implemented HTTP proxy transport using StreamableHTTPClientTransport from MCP SDK
- **2025-10-08**: Fixed proxy cleanup to properly close clients and transports
- **2025-10-08**: Updated greeting prompt to reflect AlsaniaMCP branding
- **2025-10-08**: Completed multi-transport layer (STDIO, HTTP/SSE gateway, HTTP proxy)

## Installation & Usage

### NPX (Quick Start)
```bash
npx -y @alsaniamcp/mcp@latest start
```

### Docker
```bash
# Build
docker build -t @alsaniamcp/mcp:latest .

# Run
docker run -p 5000:5000 @alsaniamcp/mcp:latest

# Or use docker-compose
docker-compose up
```

### Local Development
```bash
npm install
npm run dev
```

### CLI Commands
```bash
# Start server
alsaniamcp start

# Or use short alias
amcp start

# Manage proxy connections
alsaniamcp proxy --list
```

## Project Architecture

### Core Components
- **UniversalMCPServer** (`src/core/server.ts`): Main MCP server with tool/resource/prompt registries
- **MCPProxyManager** (`src/proxy/mcp-proxy.ts`): Dynamic proxy for connecting to external MCP servers
- **HTTPGateway** (`src/transport/http-gateway.ts`): HTTP/SSE streaming gateway with proxy endpoints

### Transport Layer
AlsaniaMCP supports multiple transport mechanisms:

1. **STDIO Transport** (Local MCP Servers):
   - Used for spawning and communicating with local MCP servers via stdin/stdout
   - Example: Connect to a local MCP server by running its command
   - Proxy uses `StdioClientTransport` for client connections

2. **HTTP/SSE Gateway** (Remote Clients):
   - Exposes HTTP REST API for remote clients to access tools/resources/prompts
   - SSE streaming at `/stream` for real-time notifications
   - Allows web applications and remote systems to connect

3. **HTTP Proxy Transport** (Remote MCP Servers):
   - Uses `StreamableHTTPClientTransport` from MCP SDK
   - Connects to remote MCP servers via HTTP POST + SSE
   - Supports session management and automatic reconnection

### API Endpoints
- `GET /health` - Health check
- `GET /stream` - SSE streaming endpoint
- `POST /message` - Call tools (serverId, toolName, args)
- `GET /tools` - List all available tools
- `GET /resources` - List all resources
- `POST /resource` - Read a resource
- `GET /prompts` - List all prompts
- `POST /prompt` - Get a prompt
- `POST /proxy/connect` - Connect to external MCP server
- `POST /proxy/disconnect/:serverId` - Disconnect server
- `GET /proxy/servers` - List active proxy connections
- `GET /proxy/status/:serverId` - Get server status

## User Preferences
None configured yet.

## Technical Stack
- TypeScript + Node.js 20
- MCP SDK (@modelcontextprotocol/sdk)
- Express for HTTP gateway
- BLAKE3 hashing (@noble/hashes)
- JWT for authentication
- WebSocket/SSE for streaming
