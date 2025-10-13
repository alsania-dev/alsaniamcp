# Configuration Guide

This guide explains how to configure AlsaniaMCP for your specific needs and environment.

## Configuration Overview

AlsaniaMCP uses a JSON configuration file to manage MCP servers, transport settings, security options, and more. The configuration is validated using Zod schemas for type safety.

## Configuration File Location

The default configuration file is located at:

- **Linux/macOS**: `~/.config/alsaniamcp/config.json`
- **Windows**: `%APPDATA%\alsaniamcp\config.json`

You can specify a custom config file using the `--config` flag.

## Basic Configuration Structure

```json
{
  "version": "1.0",
  "server": {
    "port": 3000,
    "host": "localhost",
    "logLevel": "info"
  },
  "mcpServers": [
    {
      "id": "example-server",
      "name": "Example MCP Server",
      "transport": "stdio",
      "command": "python",
      "args": ["server.py"],
      "permissions": ["read", "write"],
      "allowedTools": ["tool1", "tool2"]
    }
  ],
  "security": {
    "enableAuth": true,
    "jwtSecret": "your-secret-key",
    "apiKeys": ["key1", "key2"]
  },
  "voice": {
    "wakeWord": "hey alsania",
    "language": "en-US",
    "enableSTT": true,
    "enableTTS": true
  }
}
```

## Server Configuration

### Basic Server Settings

```json
{
  "server": {
    "port": 3000,
    "host": "localhost",
    "logLevel": "info", // error, warn, info, debug
    "timeout": 30000,
    "maxConnections": 100
  }
}
```

### Transport Settings

AlsaniaMCP supports multiple transport protocols:

- **HTTP**: RESTful API endpoints
- **WebSocket**: Real-time bidirectional communication
- **TCP**: Direct socket connections
- **stdio**: Standard input/output (for local processes)

#### HTTP Transport Example

```json
{
  "mcpServers": [
    {
      "id": "http-server",
      "name": "HTTP MCP Server",
      "transport": "http",
      "endpoint": "https://api.example.com/v1/mcp",
      "apiKey": "your-api-key"
    }
  ]
}
```

#### WebSocket Transport Example

```json
{
  "mcpServers": [
    {
      "id": "ws-server",
      "name": "WebSocket MCP Server",
      "transport": "sse",
      "endpoint": "wss://ws.example.com/mcp",
      "apiKey": "your-api-key"
    }
  ]
}
```

## MCP Server Configuration

### MCP Server Properties

Each MCP server in the configuration has these properties:

- **`id`**: Unique identifier for the server
- **`name`**: Human-readable name
- **`transport`**: Transport protocol (`stdio`, `http`, `sse`)
- **`command`** (stdio only): Executable command
- **`args`** (stdio only): Command arguments array
- **`endpoint`** (http/sse only): URL endpoint
- **`lifespan`**: Server lifespan in milliseconds (optional)
- **`roles`**: Permission roles array (optional)
- **`permissions`**: Access permissions array (optional)
- **`allowedTools`**: Whitelisted tools array (optional)
- **`apiKey`**: Authentication key (optional)
- **`password`**: Password for authentication (optional)
- **`isOpen`**: Public access flag (default: false)

### Example MCP Server Configurations

#### Python MCP Server

```json
{
  "id": "python-math",
  "name": "Python Math Server",
  "transport": "stdio",
  "command": "python",
  "args": ["./servers/math_server.py"],
  "permissions": ["read"],
  "allowedTools": ["calculate", "plot"]
}
```

#### Node.js MCP Server

```json
{
  "id": "nodejs-weather",
  "name": "Weather API Server",
  "transport": "http",
  "endpoint": "https://weather-api.example.com",
  "apiKey": "weather-api-key-123",
  "permissions": ["read", "write"],
  "allowedTools": ["get_weather", "forecast"]
}
```

## Security Configuration

### Authentication Settings

```json
{
  "security": {
    "enableAuth": true,
    "jwtSecret": "your-super-secret-jwt-key-change-this-in-production",
    "jwtExpiry": "24h",
    "apiKeys": ["key1-for-client-a", "key2-for-client-b"],
    "allowedOrigins": ["https://your-app.com", "http://localhost:3000"]
  }
}
```

### Access Control

```json
{
  "security": {
    "rateLimit": {
      "windowMs": 900000,
      "max": 100
    },
    "cors": {
      "enabled": true,
      "origins": ["*"]
    }
  }
}
```

## Voice Configuration

### Voice Settings

```json
{
  "voice": {
    "wakeWord": "hey alsania",
    "language": "en-US",
    "voiceId": "alloy",
    "enableSTT": true,
    "enableTTS": true,
    "sttProvider": "google",
    "ttsProvider": "openai"
  }
}
```

## Environment Variables

AlsaniaMCP also supports configuration via environment variables:

```bash
# Server settings
AMCP_PORT=3000
AMCP_HOST=localhost
AMCP_LOG_LEVEL=info

# Security
AMCP_JWT_SECRET=your-secret-key
AMCP_API_KEY=key1,key2

# Voice
AMCP_WAKE_WORD="hey alsania"
AMCP_VOICE_LANGUAGE=en-US
```

## Configuration Validation

To validate your configuration:

```bash
# Validate config file
alsaniamcp config --validate

# Check for syntax errors
alsaniamcp config --lint
```

## Hot Reloading

Configuration changes can be applied without restarting:

```bash
# Reload configuration
alsaniamcp config --reload

# Watch for changes
alsaniamcp --watch-config
```

## Advanced Configuration

### Custom Transport Adapters

```json
{
  "transports": {
    "custom": {
      "adapter": "path/to/custom-adapter.js",
      "config": {
        "customParam": "value"
      }
    }
  }
}
```

### Performance Tuning

```json
{
  "performance": {
    "maxWorkers": 10,
    "workerTimeout": 30000,
    "memoryLimit": "512MB",
    "cpuLimit": "50%"
  }
}
```

## Troubleshooting

### Common Configuration Issues

**Invalid JSON syntax**:

```
Error: Invalid configuration file
Solution: Use a JSON validator like https://jsonlint.com
```

**Missing required fields**:

```
Error: 'id' is required for MCP server configuration
Solution: Add the missing required fields to your server config
```

**Permissions mismatch**:

```
Error: Tool 'toolName' not allowed for server
Solution: Check allowedTools array in server configuration
```

For more troubleshooting help, see [Troubleshooting Guide](troubleshooting.md).
