# API Reference

This comprehensive guide covers all APIs provided by AlsaniaMCP, including REST endpoints, WebSocket events, CLI commands, and configuration schemas.

## Table of Contents

- [REST API](#rest-api)
- [WebSocket API](#websocket-api)
- [CLI Reference](#cli-reference)
- [Configuration Schema](#configuration-schema)
- [Data Types](#data-types)

## REST API

Base URL: `http://localhost:3000/api` (configurable)

### Authentication

All API endpoints support authentication via:

```bash
# API Key
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:3000/api/status

# JWT Token
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:3000/api/status
```

### Server Management

#### GET /status

Get overall server status.

**Response:**

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 3600,
  "timestamp": 1638360000000
}
```

#### GET /servers

List all configured MCP servers.

**Response:**

```json
{
  "servers": [
    {
      "id": "math-server",
      "name": "Python Math Server",
      "transport": "stdio",
      "status": "active",
      "lastSeen": 1638360000000
    }
  ]
}
```

#### POST /servers

Add a new MCP server.

**Request Body:**

```json
{
  "id": "new-server",
  "name": "New Server",
  "transport": "http",
  "endpoint": "https://api.example.com",
  "permissions": ["read"],
  "apiKey": "optional-key"
}
```

#### PUT /servers/{id}

Update an existing server configuration.

**Path Parameters:**

- `id`: Server identifier

#### DELETE /servers/{id}

Remove a server.

**Path Parameters:**

- `id`: Server identifier

#### GET /servers/{id}/status

Get detailed status for a specific server.

**Response:**

```json
{
  "id": "math-server",
  "status": "active",
  "uptime": 1800,
  "lastHealthCheck": 1638360000000,
  "stats": {
    "requests": 150,
    "errors": 2,
    "avgResponseTime": 45
  }
}
```

### Tool Execution

#### POST /tool/{serverId}/{toolName}

Execute a tool on a specific server.

**Path Parameters:**

- `serverId`: MCP server identifier
- `toolName`: Tool name to execute

**Request Body:**

```json
{
  "params": {
    "input": "example value"
  },
  "timeout": 30000
}
```

**Response:**

```json
{
  "result": "tool execution result",
  "executionTime": 25,
  "timestamp": 1638360000000
}
```

#### GET /tools/{serverId}

List all available tools for a server.

**Response:**

```json
{
  "tools": [
    {
      "name": "calculate",
      "description": "Perform mathematical calculations",
      "parameters": {
        "type": "object",
        "properties": {
          "expression": {
            "type": "string",
            "description": "Mathematical expression"
          }
        },
        "required": ["expression"]
      }
    }
  ]
}
```

### Agent Communication

#### POST /agent/send

Send message to another agent.

**Request Body:**

```json
{
  "to": "agent-b",
  "message": "Hello from agent A",
  "data": {
    "type": "task",
    "payload": { "action": "process", "input": [1, 2, 3] }
  }
}
```

#### GET /agent/messages

Get pending messages for this agent.

**Query Parameters:**

- `from`: Filter by sender
- `limit`: Maximum messages to return (default: 50)

#### POST /agent/broadcast

Broadcast message to all connected agents.

### Voice Integration

#### POST /voice/command

Process voice command (text input).

**Request Body:**

```json
{
  "command": "what is the weather in Tokyo",
  "language": "en-US",
  "sessionId": "optional-session"
}
```

#### GET /voice/status

Get voice processing status.

**Response:**

```json
{
  "sttEngine": "active",
  "ttsEngine": "ready",
  "wakeWord": "hey alsania",
  "currentSession": "session-123"
}
```

#### WebSocket /voice/stream

Real-time voice streaming endpoint.

### Monitoring and Analytics

#### GET /monitoring/metrics

Get current system metrics.

**Response:**

```json
{
  "cpu": {
    "usage": 45.2,
    "cores": 4
  },
  "memory": {
    "used": 245760,
    "total": 524288,
    "percentage": 46.9
  },
  "requests": {
    "total": 1250,
    "perSecond": 12.5,
    "errors": 25
  }
}
```

#### POST /monitoring/profile

Start performance profiling.

**Request Body:**

```json
{
  "duration": 60,
  "include": ["cpu", "memory", "requests"],
  "output": "profile-2023-12-01.json"
}
```

#### GET /monitoring/logs

Retrieve system logs.

**Query Parameters:**

- `level`: Filter by log level (error, warn, info, debug)
- `from`: Start timestamp
- `to`: End timestamp
- `limit`: Maximum log entries (default: 100)

### Security & Authentication

#### POST /auth/login

Authenticate and receive JWT token.

**Request Body:**

```json
{
  "username": "admin",
  "password": "password"
}
```

#### POST /auth/refresh

Refresh JWT token.

#### POST /auth/logout

Invalidate current session.

#### GET /auth/me

Get current user information.

### Error Responses

All endpoints return standardized error responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "serverId",
      "reason": "Server not found"
    },
    "timestamp": 1638360000000,
    "requestId": "req-abc-123"
  }
}
```

Common error codes:

- `VALIDATION_ERROR`: Invalid request parameters
- `AUTHENTICATION_ERROR`: Authentication failed
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND_ERROR`: Resource not found
- `SERVER_ERROR`: Internal server error

## WebSocket API

Base URL: `ws://localhost:3000/ws`

### Connection

```javascript
const ws = new WebSocket("ws://localhost:3000/ws?token=YOUR_JWT_TOKEN");

// Handle connection open
ws.onopen = () => {
  console.log("Connected to AlsaniaMCP");
};

// Handle incoming messages
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  handleMessage(data);
};

// Handle connection close
ws.onclose = (event) => {
  console.log("Connection closed:", event.code, event.reason);
};
```

### Message Format

All WebSocket messages follow this format:

```json
{
  "type": "message_type",
  "id": "unique-message-id",
  "payload": {
    // message-specific data
  },
  "timestamp": 1638360000000
}
```

### Events

#### Server Events

```javascript
// Server status changes
{
  "type": "server_status",
  "payload": {
    "serverId": "math-server",
    "status": "active",
    "timestamp": 1638360000000
  }
}

// Tool execution results
{
  "type": "tool_result",
  "payload": {
    "executionId": "exec-123",
    "serverId": "math-server",
    "toolName": "calculate",
    "result": 42,
    "executionTime": 25
  }
}
```

#### Agent Communication Events

```javascript
// Incoming agent message
{
  "type": "agent_message",
  "payload": {
    "from": "agent-b",
    "to": "agent-a",
    "message": "Task completed",
    "data": {"result": "success"},
    "timestamp": 1638360000000
  }
}

// Agent status updates
{
  "type": "agent_status",
  "payload": {
    "agentId": "agent-b",
    "status": "online",
    "capabilities": ["math", "search"]
  }
}
```

#### Voice Events

```javascript
// Wake word detected
{
  "type": "wake_word_detected",
  "payload": {
    "confidence": 0.95,
    "timestamp": 1638360000000
  }
}

// Speech recognition result
{
  "type": "speech_recognized",
  "payload": {
    "text": "what is the weather like",
    "confidence": 0.89,
    "language": "en-US"
  }
}
```

### Commands

#### Subscribe to Events

```javascript
ws.send(
  JSON.stringify({
    type: "subscribe",
    payload: {
      events: ["server_status", "tool_result"],
      servers: ["math-server", "weather-server"],
    },
  })
);
```

#### Execute Tool

```javascript
ws.send(
  JSON.stringify({
    type: "execute_tool",
    id: "exec-123",
    payload: {
      serverId: "math-server",
      toolName: "calculate",
      params: {
        expression: "2 + 2",
      },
    },
  })
);
```

#### Send Agent Message

```javascript
ws.send(
  JSON.stringify({
    type: "agent_message",
    payload: {
      to: "agent-b",
      message: "Hello",
      data: { urgent: true },
    },
  })
);
```

## CLI Reference

### Global Options

```bash
alsaniamcp [command] [options]

Options:
  -c, --config <path>     Configuration file path
  -v, --verbose           Enable verbose output
  --json                  Output in JSON format
  -h, --help             Show help
  -V, --version          Show version
```

### Server Lifecycle Commands

```bash
# Start server
alsaniamcp start [options]
Options:
  --port <number>         Server port (default: 3000)
  --host <string>         Server host (default: localhost)
  --dev                   Start in development mode
  --daemon                Start as daemon process

# Stop server
alsaniamcp stop [options]
Options:
  --graceful              Graceful shutdown
  --timeout <seconds>     Shutdown timeout (default: 30)

# Restart server
alsaniamcp restart [options]
  --zero-downtime         Zero-downtime restart
```

### Server Management Commands

```bash
# List servers
alsaniamcp servers list [options]
Options:
  --detailed              Show detailed information
  --status <status>       Filter by status
  --format <format>       Output format (table, json, csv)

# Add server
alsaniamcp servers add <id> [options]
Options:
  --name <string>         Server name
  --transport <type>      Transport type (stdio, http, sse)
  --command <string>      Command for stdio servers
  --endpoint <url>        Endpoint for http/sse servers
  --config <json>         Additional server config

# Remove server
alsaniamcp servers remove <id> [options]
Options:
  --force                 Force removal of active server

# Test server
alsaniamcp servers test <id> [options]
Options:
  --timeout <seconds>     Test timeout (default: 10)
  --verbose               Show detailed test output
```

### Tool Commands

```bash
# List tools
alsaniamcp tools list <serverId> [options]
Options:
  --format <format>       Output format

# Execute tool
alsaniamcp tools execute <serverId> <toolName> [options]
Options:
  --params <json>         Tool parameters as JSON string
  --params-file <path>    Load parameters from JSON file
  --timeout <seconds>     Execution timeout
  --async                 Execute asynchronously

# Call tool (shortcut)
alsaniamcp call <serverId> <toolName> --params '{"key": "value"}'
```

### Configuration Commands

```bash
# Show configuration
alsaniamcp config show [options]
Options:
  --section <string>      Show specific section
  --format <format>       Output format

# Set configuration value
alsaniamcp config set <key> <value>
Examples:
  alsaniamcp config set server.port 8080
  alsaniamcp config set security.enableAuth true

# Validate configuration
alsaniamcp config validate [options]
Options:
  --fix                   Attempt to fix issues automatically

# Edit configuration
alsaniamcp config edit [options]
Options:
  --editor <command>      Editor command (default: $EDITOR)
```

### Voice Commands

```bash
# Enable voice integration
alsaniamcp voice enable [options]

# Disable voice integration
alsaniamcp voice disable

# List voice commands
alsaniamcp voice commands [options]
Options:
  --format <format>       Output format

# Add voice command
alsaniamcp voice add-command <name> [options]
Options:
  --tool <tool>           Tool to execute
  --params <json>         Tool parameters
  --keywords <string>     Keywords to trigger command

# Test voice input
alsaniamcp voice test [options]
Options:
  --input                 Test audio input
  --output                Test audio output
  --wake-word             Test wake word detection
```

### Monitoring Commands

```bash
# Show system status
alsaniamcp status [options]
Options:
  --detailed              Show detailed status
  --watch                 Watch for changes

# Show metrics
alsaniamcp metrics [options]
Options:
  --section <string>      Show specific metrics section
  --interval <seconds>    Update interval for watch mode

# View logs
alsaniamcp logs [options]
Options:
  --level <level>         Filter by log level
  --server <id>           Filter by server
  --tail <count>          Show last N entries
  --follow                Follow log output
  --grep <pattern>        Filter by pattern
```

### Agent Commands

```bash
# List agents
alsaniamcp agents list [options]
Options:
  --status <status>       Filter by status
  --detailed              Show detailed information

# Send message to agent
alsaniamcp agents send <agentId> [options]
Options:
  --message <string>      Message to send
  --data <json>           Additional data
  --priority <level>      Message priority

# Receive messages
alsaniamcp agents receive [options]
Options:
  --from <agentId>        Filter by sender
  --limit <number>        Maximum messages to show
  --mark-read             Mark messages as read
```

## Configuration Schema

### Main Configuration

```typescript
interface Config {
  version: string;
  server: ServerConfig;
  mcpServers: MCPServerConfig[];
  security: SecurityConfig;
  voice?: VoiceConfig;
  performance?: PerformanceConfig;
  monitoring?: MonitoringConfig;
  logging?: LoggingConfig;
}
```

### Server Configuration

```typescript
interface ServerConfig {
  port: number;
  host: string;
  logLevel: "error" | "warn" | "info" | "debug";
  timeout: number;
  maxConnections: number;
  cors?: {
    enabled: boolean;
    origins: string[];
  };
  ssl?: {
    enabled: boolean;
    keyPath: string;
    certPath: string;
  };
}
```

### MCP Server Configuration

```typescript
interface MCPServerConfig {
  id: string;
  name: string;
  transport: "stdio" | "http" | "sse" | "custom";
  endpoint?: string;
  command?: string;
  args?: string[];
  lifespan?: number;
  roles?: string[];
  permissions?: string[];
  allowedTools?: string[];
  apiKey?: string;
  password?: string;
  isOpen?: boolean;
  transportConfig?: Record<string, any>;
}
```

### Security Configuration

```typescript
interface SecurityConfig {
  enableAuth: boolean;
  jwtSecret: string;
  jwtExpiry: string;
  apiKeys: string[];
  allowedOrigins: string[];
  rateLimit?: {
    windowMs: number;
    max: number;
  };
}
```

## Data Types

### Common Types

```typescript
type TransportType = "stdio" | "http" | "sse" | "custom";
type LogLevel = "error" | "warn" | "info" | "debug";
type ServerStatus = "active" | "inactive" | "spawning" | "error";
type ToolPermission = "read" | "write" | "admin";
```

### Request/Response Types

```typescript
interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: number;
  requestId: string;
}

interface ToolExecution {
  id: string;
  serverId: string;
  toolName: string;
  params: Record<string, any>;
  result?: any;
  error?: APIError;
  executionTime: number;
  timestamp: number;
}

interface ServerInfo {
  id: string;
  name: string;
  transport: TransportType;
  status: ServerStatus;
  uptime?: number;
  lastSeen: number;
  stats?: {
    requests: number;
    errors: number;
    avgResponseTime: number;
  };
}
```

### WebSocket Message Types

```typescript
interface WSMessage {
  type: string;
  id: string;
  payload: Record<string, any>;
  timestamp: number;
}

type WSMessageType =
  | "subscribe"
  | "unsubscribe"
  | "execute_tool"
  | "tool_result"
  | "server_status"
  | "agent_message"
  | "wake_word_detected"
  | "speech_recognized"
  | "error";
```
