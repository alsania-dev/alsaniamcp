# Usage Examples

This guide provides practical examples of using AlsaniaMCP in different scenarios and configurations.

## Getting Started Examples

### Starting the Server

```bash
# Start with default configuration
alsaniamcp start

# Start with custom config file
alsaniamcp start --config /path/to/config.json

# Start in development mode (with debug logging)
alsaniamcp start --dev

# Start with specific port
alsaniamcp start --port 8080
```

### Basic CLI Operations

```bash
# Check server status
alsaniamcp status

# List active MCP servers
alsaniamcp servers list

# Add a new MCP server
alsaniamcp servers add my-server --type stdio --command python --args server.py

# Remove a server
alsaniamcp servers remove my-server

# Restart all servers
alsaniamcp servers restart
```

## Configuration Examples

### Simple HTTP MCP Server

```json
{
  "mcpServers": [
    {
      "id": "simple-api",
      "name": "Simple API Server",
      "transport": "http",
      "endpoint": "https://api.example.com/v1",
      "permissions": ["read"]
    }
  ]
}
```

**Usage**:

```bash
# Call the server via CLI
alsaniamcp call simple-api get_data '{"param": "value"}'

# Via REST API
curl -X POST http://localhost:3000/api/simple-api/get_data \
  -H "Content-Type: application/json" \
  -d '{"param": "value"}'
```

### Python Math Server

**Python server code (`math_server.py`)**:

```python
#!/usr/bin/env python3

import json
import sys

def main():
    for line in sys.stdin:
        try:
            data = json.loads(line.strip())
            command = data.get('command')
            params = data.get('params', {})

            if command == 'add':
                result = params['a'] + params['b']
            elif command == 'multiply':
                result = params['a'] * params['b']
            else:
                result = 'Unknown command'

            response = {'result': result}
            print(json.dumps(response))
            sys.stdout.flush()
        except Exception as e:
            print(json.dumps({'error': str(e)}))
            sys.stdout.flush()

if __name__ == '__main__':
    main()
```

**MCP Server Configuration**:

```json
{
  "mcpServers": [
    {
      "id": "math-server",
      "name": "Python Math Server",
      "transport": "stdio",
      "command": "python",
      "args": ["math_server.py"],
      "allowedTools": ["add", "multiply"]
    }
  ]
}
```

**Usage**:

```bash
# Interactive mode
alsaniamcp call math-server add --params '{"a": 5, "b": 3}'
# Output: {"result": 8}

alsaniamcp call math-server multiply --params '{"a": 4, "b": 7}'
# Output: {"result": 28}
```

## Voice Integration Examples

### Wake Word Activation

**Configuration**:

```json
{
  "voice": {
    "wakeWord": "hey alsania",
    "language": "en-US",
    "enableSTT": true,
    "enableTTS": true
  }
}
```

**Usage**:

```bash
# Enable voice mode
alsaniamcp voice --enable

# Start listening
alsaniamcp voice listen

# Voice command example: "Hey Alsania, add 5 and 3"
# Server responds with: "The result is 8"
```

### Voice Commands

```bash
# List voice commands
alsaniamcp voice commands

# Add custom voice command
alsaniamcp voice add-command "check_weather" \
  --tool weather:get_forecast \
  --params '{"location": "current"}'

# Remove voice command
alsaniamcp voice remove-command check_weather
```

## A2A (Agent-to-Agent) Communication

### Setting up Agent Communication

**Agent A Configuration**:

```json
{
  "agents": {
    "agent-A": {
      "id": "agent-a",
      "type": "coordinator",
      "communication": {
        "protocol": "websocket",
        "endpoint": "ws://localhost:3001"
      }
    }
  }
}
```

**Agent B Configuration**:

```json
{
  "agents": {
    "agent-B": {
      "id": "agent-b",
      "type": "worker",
      "communication": {
        "protocol": "websocket",
        "endpoint": "ws://localhost:3000"
      }
    }
  }
}
```

**Usage**:

```bash
# Agent A sends message to Agent B
alsaniamcp agent send agent-b --message "Process this data" --data '{"input": [1,2,3,4,5]}'

# Agent A receives response
alsaniamcp agent receive --from agent-b

# List active agent connections
alsaniamcp agent list
```

## REST API Examples

### Server Management via REST API

```bash
# Get server status
curl http://localhost:3000/api/status

# List MCP servers
curl http://localhost:3000/api/servers

# Add new server
curl -X POST http://localhost:3000/api/servers \
  -H "Content-Type: application/json" \
  -d '{
    "id": "new-server",
    "name": "New MCP Server",
    "transport": "http",
    "endpoint": "https://api.newserver.com"
  }'

# Execute tool via REST
curl -X POST http://localhost:3000/api/tool/math/add \
  -H "Content-Type: application/json" \
  -d '{
    "params": {"a": 10, "b": 20},
    "serverId": "math-server"
  }'
```

### Authentication Example

```bash
# Generate API key
curl -X POST http://localhost:3000/api/auth/generate-key \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Use API key in requests
curl -X GET http://localhost:3000/api/servers \
  -H "X-API-Key: YOUR_API_KEY"
```

## WebSocket Examples

### Real-time Tool Execution

```javascript
// Client-side JavaScript for WebSocket connection
const ws = new WebSocket("ws://localhost:3000");

ws.onopen = () => {
  // Register for real-time updates
  ws.send(
    JSON.stringify({
      type: "subscribe",
      serverId: "math-server",
      tools: ["add", "multiply"],
    })
  );
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Received:", data);

  // Execute tool in response to events
  if (data.type === "tool_called") {
    ws.send(
      JSON.stringify({
        type: "execute",
        toolId: data.toolId,
        params: data.params,
      })
    );
  }
};
```

### Voice Streaming

```bash
# Start voice streaming session
alsaniamcp voice stream --server weather-server

# The server will now accept voice commands and stream responses
# "Hey Alsania, what's the weather like in Tokyo?"
```

## Advanced Usage Examples

### Custom Transport Plugins

**Custom Transport Implementation**:

```javascript
// custom-transport.js
export class CustomTransport {
  constructor(config) {
    this.config = config;
  }

  async connect() {
    // Custom connection logic
    this.connection = await this.createCustomConnection(this.config.endpoint);
    return this.connection;
  }

  async execute(toolName, params) {
    // Custom execution logic
    return await this.connection.callTool(toolName, params);
  }
}
```

**Configuration**:

```json
{
  "mcpServers": [
    {
      "id": "custom-server",
      "name": "Custom Protocol Server",
      "transport": "custom",
      "transportConfig": {
        "adapter": "./custom-transport.js",
        "endpoint": "custom://server.endpoint"
      }
    }
  ]
}
```

### Monitoring and Logging

```bash
# Enable performance monitoring
alsaniamcp monitor --enable --metrics-port 9090

# View real-time metrics
alsaniamcp monitor status

# Export metrics to Prometheus format
alsaniamcp monitor export --format prometheus

# Set up logging filters
alsaniamcp logs filter --level info --server weather-server

# Tail logs in real-time
alsaniamcp logs tail --follow
```

### Container Orchestration

**Docker Compose Example**:

```yaml
version: "3.8"
services:
  alsaniamcp:
    image: alsania/mcp-proxy:latest
    ports:
      - "3000:3000"
    volumes:
      - ./config.json:/app/config.json
      - ./servers:/app/servers
    environment:
      - NODE_ENV=production
    depends_on:
      - math-server
      - weather-server

  math-server:
    build: ./servers/math
    expose:
      - "8001"

  weather-server:
    image: weather/mcp-server:latest
    environment:
      - API_KEY=${WEATHER_API_KEY}
```

**Kubernetes Deployment**:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: alsaniamcp
spec:
  replicas: 2
  selector:
    matchLabels:
      app: alsaniamcp
  template:
    metadata:
      labels:
        app: alsaniamcp
    spec:
      containers:
        - name: alsaniamcp
          image: alsania/mcp-proxy:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: "production"
          volumeMounts:
            - name: config
              mountPath: /app/config.json
              subPath: config.json
      volumes:
        - name: config
          configMap:
            name: alsaniamcp-config
```

## Error Handling Examples

```bash
# Retry failed operations
alsaniamcp retry --server failed-server --max-attempts 3

# Check server health
alsaniamcp health check --all-servers

# Graceful server shutdown
alsaniamcp shutdown --graceful --timeout 30
```

## Performance Optimization

```bash
# Enable connection pooling
alsaniamcp config set performance.connectionPooling true

# Set worker thread limits
alsaniamcp config set performance.maxWorkers 8

# Configure caching
alsaniamcp cache configure --ttl 3600 --size 100MB

# Performance profiling
alsaniamcp profile start --duration 60
```

This completes the usage examples. For more advanced scenarios, refer to the API documentation and developer guides.
