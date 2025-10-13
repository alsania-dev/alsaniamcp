# Getting Started with AlsaniaMCP

Welcome to AlsaniaMCP! This guide will help you get up and running quickly with the universal Model Context Protocol server.

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have:

- **Node.js 20.x or later** installed
- **npm** or **yarn** package manager
- **Git** for cloning repositories

### Installation Options

#### Option 1: NPX (Quickest)

The easiest way to get started is using npx:

```bash
npx -y @alsania-io/mcp@latest start
```

This will download, install, and start the server automatically.

#### Option 2: Local Development

For development or more control:

```bash
# Clone the repository
git clone https://github.com/alsania-dev/alsaniamcp.git
cd alsaniamcp

# Install dependencies
npm install

# Start the development server
npm run dev
```

#### Option 3: Docker

For containerized deployment:

```bash
# Build and run with docker-compose
docker-compose up -d

# Or run directly
docker run -p 8050:8050 alsaniamcp/mcp:latest
```

## 🧪 First Test

Once the server is running, test the basic functionality:

```bash
# Check if server is healthy
curl http://localhost:8050/health
```

You should see: `{"status":"ok","timestamp":1234567890}`

## 🎯 Core Concepts

### What is AlsaniaMCP?

AlsaniaMCP is a **universal proxy server** that bridges AI systems and MCP-compatible tools. Think of it as a:

- 🌐 **Multi-transport gateway** (supports STDIO, HTTP, WebSocket)
- 🎯 **Dynamic tool registry** (load/unload tools on-demand)
- 🔄 **MCP proxy manager** (connect to remote MCP servers)
- 🎤 **Voice integration layer** (speech-to-text, text-to-speech)
- 🤖 **AI-to-AI communication** (direct agent messaging)

### Key Components

```
Client Application → AlsaniaMCP Server → MCP Servers → Tools/Resources
       ↓                    ↓                    ↓             ↓
   Your App          HTTP/WebSocket      External MCP    GitHub API
   Browser               STDIO           Filesystem IO    Database
   Mobile                SSE             Calculator       Calendar
```

## 📡 Transport Methods

AlsaniaMCP supports three transport mechanisms:

### 1. STDIO Transport (Local)

Direct process communication for local MCP servers:

```bash
# Server automatically handles STDIO for local connections
```

### 2. HTTP/SSE Gateway (Remote Clients)

REST API with Server-Sent Events for streaming:

- **Base URL**: `http://localhost:8050`
- **Health Check**: `GET /health`
- **Tool List**: `GET /tools`
- **Tool Call**: `POST /message`

### 3. HTTP Proxy Transport (Remote MCP Servers)

Connect to remote MCP servers via HTTP:

```bash
curl -X POST http://localhost:8050/proxy/connect \
  -H "Content-Type: application/json" \
  -d '{
    "id": "github-server",
    "transport": "http",
    "endpoint": "http://remote-mcp-server.com/mcp"
  }'
```

## 🛠️ Basic Usage Examples

### Hello World Tool

By default, AlsaniaMCP includes a simple echo tool:

```bash
curl -X POST http://localhost:8050/message \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "core",
    "toolName": "echo",
    "args": {"message": "Hello AlsaniaMCP!"}
  }'
```

Response:

```json
{
  "success": true,
  "result": {
    "echo": "Hello AlsaniaMCP!"
  }
}
```

### Connect an External MCP Server

```bash
# Connect to a remote MCP server
curl -X POST http://localhost:8050/proxy/connect \
  -H "Content-Type: application/json" \
  -d '{
    "id": "filesystem",
    "transport": "stdio",
    "command": "npx",
    "args": ["@modelcontextprotocol/server-filesystem", "/tmp"]
  }'
```

### List Available Tools

```bash
curl http://localhost:8050/tools
```

## 📋 Server Status Check

Always verify your server is running correctly:

```bash
# Health check
curl http://localhost:8050/health

# List active proxy connections
curl http://localhost:8050/proxy/servers

# View server logs (if running in development mode)
npm run cli server logs
```

## 🎵 Voice Features (Optional)

If voice integration is enabled:

```bash
# Check voice support
alsaniamcp voice check

# Configure voice settings
alsaniamcp voice config
```

## 🚨 Troubleshooting

### Common Issues

#### Server won't start

- Check Node.js version: `node --version` (should be 20+)
- Verify port 8050 is not in use
- Check for missing dependencies: `npm install`

#### Connection refused

- Verify server is running: `curl http://localhost:8050/health`
- Check firewall settings
- Confirm correct port and host

#### Tool not found

- List available tools: `curl http://localhost:8050/tools`
- Connect required proxy servers first
- Check server logs for errors

## 🏆 Next Steps

Now that you have AlsaniaMCP running:

1. **[Connect more MCP servers](usage-examples.md)** - Add functionality like filesystem access, GitHub integration, etc.
2. **[Configure for production](configuration.md)** - Security, performance tuning, scaling
3. **[Explore advanced features](usage-examples.md)** - AI-to-AI communication, voice integration
4. **[Contribute to the project](../CONTRIBUTING.md)** - Help improve AlsaniaMCP

## 📞 Getting Help

- **Need help?** Check the [troubleshooting guide](troubleshooting.md)
- **Have questions?** Start a [GitHub Discussion](https://github.com/alsania-dev/alsaniamcp/discussions)
- **Found a bug?** [Report it](https://github.com/alsania-dev/alsaniamcp/issues)

---

Congratulations! You now have AlsaniaMCP running. The world of connected AI tools awaits! 🌟
