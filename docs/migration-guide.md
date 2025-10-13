# Migration Guide

This guide helps you migrate from other MCP implementations or earlier versions of AlsaniaMCP to the current version.

## Migrating from Other MCP Servers

### From MCP CLI Tools

If you're currently using the MCP CLI tools (mcp-cli, @modelcontextprotocol/cli), follow these steps:

1. **Export existing configuration**:

   ```bash
   # Export MCP CLI servers
   mcp-cli servers export --format json > existing_servers.json
   ```

2. **Convert configuration**:

   ```bash
   # Use AlsaniaMCP's conversion tool
   alsaniamcp migrate --from mcp-cli --input existing_servers.json
   ```

3. **Validate migration**:
   ```bash
   alsaniamcp config --validate
   alsaniamcp test --all-servers
   ```

### From Custom MCP Implementations

For custom MCP server implementations:

1. **Analyze your servers**:

   - Document all tools and their schemas
   - Identify transport methods used
   - Note authentication requirements

2. **Create equivalent configuration**:

```json
{
  "mcpServers": [
    {
      "id": "migrated-server",
      "name": "Migrated Custom Server",
      "transport": "stdio",
      "command": "python",
      "args": ["your_custom_server.py"],
      "permissions": ["read", "write"],
      "allowedTools": ["tool1", "tool2", "tool3"]
    }
  ]
}
```

3. **Test compatibility**:
   ```bash
   alsaniamcp servers test migrated-server
   alsaniamcp call migrated-server tool1 --params '{}'
   ```

## Version Migration Guides

### Migrating from AlsaniaMCP 0.1.x to 1.0.0

#### Configuration Changes

**Security configuration updates**:

```json
// Before (0.1.x)
{
  "security": {
    "enabled": true,
    "secret": "your-secret"
  }
}

// After (1.0.0)
{
  "security": {
    "enableAuth": true,
    "jwtSecret": "your-super-secret-jwt-key",
    "jwtExpiry": "24h",
    "apiKeys": ["key1", "key2"]
  }
}
```

**Server configuration updates**:

```json
// Before (0.1.x)
{
  "servers": [
    {
      "type": "mcp",
      "path": "/path/to/server"
    }
  ]
}

// After (1.0.0)
{
  "mcpServers": [
    {
      "id": "server-id",
      "name": "Server Name",
      "transport": "stdio",
      "command": "python",
      "args": ["/path/to/server"]
    }
  ]
}
```

#### Migration Steps

1. **Backup your configuration**:

   ```bash
   cp config.json config.backup.json
   ```

2. **Install the new version**:

   ```bash
   npm install -g @alsania/mcp-proxy@latest
   ```

3. **Run the migration tool**:

   ```bash
   alsaniamcp migrate --from 0.1.x --config config.backup.json
   ```

4. **Update server configurations**:

   - Change `servers` array to `mcpServers`
   - Add `id` and `name` fields to each server
   - Convert `path` to `command` and `args`
   - Update `type` to `transport`

5. **Update security settings**:

   ```bash
   # Generate new JWT secret
   alsaniamcp auth generate-secret

   # Update configuration with new security settings
   alsaniamcp config edit
   ```

#### Breaking Changes

- **Server registration**: All servers now require unique `id` fields
- **Transport configuration**: Simplified to three types: `stdio`, `http`, `sse`
- **Authentication**: JWT-based authentication now required by default
- **CLI commands**: Some command names have changed (use `alsaniamcp --help`)

### Migrating from AlsaniaMCP 0.0.x to 0.1.x

**Note**: Version 0.0.x is deprecated. Please migrate directly to 1.0.0.

## MCP Server-to-AlsaniaMCP Mapping

### Transport Protocol Mapping

| Original Protocol | AlsaniaMCP Transport | Notes                    |
| ----------------- | -------------------- | ------------------------ |
| stdio             | stdio                | Direct command execution |
| HTTP POST         | http                 | REST API endpoints       |
| WebSocket         | sse                  | Server-sent events       |
| SSE               | sse                  | Server-sent events       |
| TCP Socket        | custom               | Requires custom adapter  |

### Tool Schema Conversion

**Original MCP tool schema**:

```json
{
  "name": "calculate",
  "description": "Calculate mathematical expression",
  "parameters": {
    "type": "object",
    "properties": {
      "expression": {
        "type": "string",
        "description": "Mathematical expression to evaluate"
      }
    },
    "required": ["expression"]
  }
}
```

**AlsaniaMCP tool configuration**:

```json
{
  "id": "math-server",
  "name": "Math Server",
  "transport": "stdio",
  "command": "python",
  "args": ["math_server.py"],
  "allowedTools": ["calculate"]
}
```

## Data Migration

### Migrating Persistent Data

1. **Export data from old system**:

   ```bash
   # Export MCP data (if applicable)
   mcp-cli data export > old_data.json
   ```

2. **Import data into AlsaniaMCP**:

   ```bash
   alsaniamcp data import --from mcp-cli --input old_data.json
   ```

3. **Verify data integrity**:
   ```bash
   alsaniamcp data validate
   ```

### Migrating Configuration Files

**Automated migration**:

```bash
# Auto-migrate configuration
alsaniamcp migrate config --source /path/to/old/config.json

# Check migration results
alsaniamcp config --validate
```

**Manual migration script**:

```javascript
// migrate-config.js
const fs = require("fs");

const oldConfig = JSON.parse(fs.readFileSync("old-config.json", "utf8"));

const newConfig = {
  version: "1.0",
  server: {
    port: oldConfig.port || 3000,
    host: oldConfig.host || "localhost",
  },
  mcpServers: oldConfig.servers.map((server) => ({
    id: server.name.toLowerCase().replace(/\s+/g, "-"),
    name: server.name,
    transport: server.type === "mcp" ? "stdio" : server.type,
    command: server.path,
    args: [],
    permissions: ["read", "write"],
  })),
  security: {
    enableAuth: oldConfig.security?.enabled || false,
    jwtSecret: oldConfig.security?.secret || generateSecret(),
  },
};

fs.writeFileSync("new-config.json", JSON.stringify(newConfig, null, 2));
```

## Testing Migration

### Pre-migration Testing

1. **Backup all data**:

   ```bash
   # Create comprehensive backup
   alsaniamcp backup create --full --output migration-backup.tar.gz
   ```

2. **Test current functionality**:

   ```bash
   # Run your test suite
   npm test

   # Check all server connections
   alsaniamcp servers test --all
   ```

### Post-migration Testing

1. **Validate configuration**:

   ```bash
   alsaniamcp config --validate
   alsaniamcp config --lint
   ```

2. **Test server connections**:

   ```bash
   # Test all migrated servers
   alsaniamcp servers list
   alsaniamcp servers test --all
   ```

3. **Test functionality**:

   ```bash
   # Test key tools
   alsaniamcp call math-server calculate '{"expression": "2 + 2"}'
   alsaniamcp call weather-server get_forecast '{"location": "NYC"}'
   ```

4. **Performance testing**:
   ```bash
   # Run performance benchmarks
   alsaniamcp benchmark --config benchmark-config.json
   ```

## Rollback Procedures

### Emergency Rollback

If migration fails, rollback steps:

1. **Stop AlsaniaMCP**:

   ```bash
   alsaniamcp stop
   ```

2. **Restore backup**:

   ```bash
   alsaniamcp backup restore migration-backup.tar.gz
   ```

3. **Restore old configuration**:

   ```bash
   cp config.backup.json config.json
   ```

4. **Restart with old version**:
   ```bash
   # Reinstall old version if needed
   npm install -g @alsania/mcp-proxy@0.1.x
   alsaniamcp start
   ```

### Gradual Rollback

For phased rollback:

1. **Scale down new deployment**:

   ```bash
   # Kubernetes
   kubectl scale deployment alsaniamcp-new --replicas=0

   # Docker Compose
   docker-compose up -d alsaniamcp-old
   ```

2. **Restore data incrementally**:
   ```bash
   alsaniamcp data rollback --to 2025-10-10
   ```

## Compatibility Matrix

| Source System     | Compatibility | Migration Difficulty | Notes                       |
| ----------------- | ------------- | -------------------- | --------------------------- |
| MCP CLI 0.1.x     | High          | Low                  | Direct conversion available |
| MCP SDK 0.4.x     | High          | Medium               | Some schema updates needed  |
| Custom MCP impl   | Medium        | High                 | Requires custom mapping     |
| Other MCP proxies | Medium        | High                 | Dependent on feature set    |

## Common Migration Issues

### Configuration Errors

**Problem**: Invalid property names

```
Error: Property 'servers' is not allowed
```

**Solution**: Use `mcpServers` instead of `servers`

### Transport Issues

**Problem**: Server connection fails

```
Error: Transport 'tcp' not supported
```

**Solution**: Use custom transport adapter or change to supported transport

### Authentication Problems

**Problem**: API keys not working

**Solution**: Generate new API keys for JWT authentication

```bash
# Generate new keys
alsaniamcp auth generate-key

# Update client applications
alsaniamcp auth list-keys
```

## Best Practices for Migration

### Planning

1. **Schedule migration during low-traffic periods**
2. **Communicate with stakeholders**
3. **Prepare rollback plan**
4. **Test in staging environment first**

### Execution

1. **Use version control for configuration files**
2. **Test each step before proceeding**
3. **Monitor system during migration**
4. **Document any custom modifications**

### Validation

1. **Verify all servers are accessible**
2. **Test critical functionality**
3. **Monitor performance metrics**
4. **Check data integrity**

### Support

Keep these resources handy during migration:

- [AlsaniaMCP Configuration Guide](user-guide/configuration.md)
- [Troubleshooting Guide](user-guide/troubleshooting.md)
- [GitHub Issues](https://github.com/alsania-dev/alsaniamcp/issues)
- [Community Support](https://discord.gg/alsania-support)

This guide provides a comprehensive migration path. If you encounter issues not covered here, please open an issue on GitHub or contact support.
