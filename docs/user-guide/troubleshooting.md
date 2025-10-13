# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with AlsaniaMCP.

## Quick Start Diagnostics

### Health Check

Always start troubleshooting with a health check:

```bash
# Basic health check
alsaniamcp --health

# Detailed diagnostic report
alsaniamcp diagnose

# Generate troubleshooting report
alsaniamcp diagnose --report
```

### Server Status Check

```bash
# Check overall server status
alsaniamcp status

# List all MCP servers and their status
alsaniamcp servers list --detailed

# Check specific server
alsaniamcp servers status math-server
```

## Common Issues and Solutions

### Server Won't Start

**Symptoms**: `alsaniamcp start` fails with errors

**Possible Causes & Solutions:**

1. **Port already in use**:

   ```bash
   # Check what's using the port
   lsof -i :3000

   # Start on different port
   alsaniamcp start --port 3001
   ```

2. **Permission denied**:

   ```bash
   # Run with elevated privileges (not recommended for production)
   sudo alsaniamcp start

   # Or configure to use non-privileged port (>1024)
   alsaniamcp config set server.port 8080
   ```

3. **Invalid configuration**:

   ```bash
   # Validate configuration
   alsaniamcp config --validate

   # Fix configuration
   alsaniamcp config --edit
   ```

4. **Missing dependencies**:

   ```bash
   # Check Node.js version
   node --version

   # Reinstall dependencies
   npm install
   ```

### MCP Server Connection Issues

**Symptoms**: MCP servers show as "error" or "inactive"

**Diagnosis**:

```bash
# Check server logs
alsaniamcp logs --server math-server --tail 50

# Test server connection
alsaniamcp servers test math-server
```

**Common Solutions:**

1. **stdio servers**:

   ```bash
   # Verify command exists
   which python

   # Test server script manually
   python math_server.py

   # Check file permissions
   ls -la math_server.py
   ```

2. **HTTP servers**:

   ```bash
   # Test endpoint connectivity
   curl https://api.example.com/v1/health

   # Check network connectivity
   ping api.example.com
   ```

3. **WebSocket servers**:
   ```bash
   # Test WebSocket connection
   alsaniamcp test ws://localhost:8080 --protocol websocket
   ```

### Configuration Problems

**Invalid JSON syntax**:

```
Error: Unexpected token in JSON at position 42
```

```bash
# Use online validator
curl -X POST https://jsonlint.com/api/validate \
  -H "Content-Type: application/json" \
  -d @config.json

# Or validate locally
alsaniamcp config --lint
```

**Schema validation errors**:

```
Error: 'transport' must be one of: stdio, http, sse
```

```bash
# Check valid transport types
alsaniamcp config --help-transports

# View configuration schema
alsaniamcp config --schema
```

### Permission and Access Issues

**API Authentication failures**:

```bash
# Generate new API key
alsaniamcp auth generate-key

# List current keys
alsaniamcp auth list-keys

# Test authentication
curl -H "X-API-Key: YOUR_KEY" http://localhost:3000/api/status
```

**Tool permission denied**:

```
Error: Tool 'dangerous_tool' not allowed for server
```

```bash
# Check server permissions
alsaniamcp servers permissions math-server

# Update allowed tools
alsaniamcp servers config math-server --add-tool dangerous_tool
```

### Voice Integration Problems

**Microphone not detected**:

```bash
# Check audio devices
alsaniamcp voice devices

# Test audio input
alsaniamcp voice test --input

# Reset voice settings
alsaniamcp voice reset
```

**Wake word not recognized**:

```bash
# Adjust sensitivity
alsaniamcp voice config --sensitivity 0.8

# Test wake word detection
alsaniamcp voice test-wake-word

# Change wake word
alsaniamcp voice config --wake-word "ok alsania"
```

**TTS not working**:

```bash
# Check TTS providers
alsaniamcp voice providers --tts

# Test text-to-speech
alsaniamcp voice speak "Hello, world"

# Switch TTS provider
alsaniamcp voice config --tts-provider google
```

### Performance Issues

**High memory usage**:

```bash
# Check memory usage
alsaniamcp monitor memory

# Enable garbage collection
alsaniamcp config set performance.gcInterval 30000

# Set memory limits
alsaniamcp config set performance.maxMemory "512MB"
```

**Slow response times**:

```bash
# Enable performance monitoring
alsaniamcp monitor --enable

# Profile specific operation
alsaniamcp profile call math-server add --params '{"a": 1, "b": 2}'

# Check connection pooling
alsaniamcp config get performance.connectionPooling
```

**High CPU usage**:

```bash
# Monitor CPU usage
alsaniamcp monitor cpu --interval 5

# Adjust worker threads
alsaniamcp config set performance.maxWorkers 4

# Enable load balancing
alsaniamcp config set performance.loadBalancing true
```

### Docker-specific Issues

**Container won't start**:

```bash
# Check Docker logs
docker logs alsania-mcp

# Verify environment variables
docker exec alsania-mcp env

# Check resource limits
docker stats
```

**Port mapping issues**:

```bash
# Verify port mappings
docker port alsania-mcp

# Test container connectivity
docker exec alsania-mcp curl localhost:3000/api/status
```

### Database/Storage Issues

**Data persistence problems**:

```bash
# Check storage mount
alsaniamcp storage check

# Verify disk space
df -h

# Clean up old data
alsaniamcp storage cleanup --older-than 30d
```

### Security Issues

**SSL/TLS certificate errors**:

```bash
# Check certificate validity
openssl s_client -connect localhost:3000

# Regenerate certificates
alsaniamcp ssl regenerate

# Use custom certificates
alsaniamcp ssl import cert.pem key.pem
```

**Rate limiting triggered**:

```bash
# Check rate limit status
alsaniamcp rate-limit status

# Reset rate limits
alsaniamcp rate-limit reset

# Adjust limits
alsaniamcp rate-limit config --requests-per-minute 100
```

## Advanced Troubleshooting

### Log Analysis

```bash
# Search for specific errors
alsaniamcp logs grep "ERROR"

# Analyze log patterns
alsaniamcp logs analyze --last-hour

# Export logs for external analysis
alsaniamcp logs export --format json --output logs.json
```

### Network Debugging

```bash
# Enable network tracing
alsaniamcp debug network --enable

# Capture network packets
alsaniamcp debug network --capture

# Test connectivity between servers
alsaniamcp debug ping math-server
```

### Process Debugging

```bash
# Attach debugger
alsaniamcp debug attach --pid 1234

# Generate core dump
alsaniamcp debug dump --path /var/crash

# Profile memory leaks
alsaniamcp debug memory --profile
```

## Getting Help

### Support Channels

1. **Community Support**:

   - GitHub Discussions
   - Discord server: `#alsania-support`

2. **Professional Support**:
   - Premium support tickets available to enterprise customers
   - Direct engineering support for critical issues

### Information to Provide

When seeking help, please include:

- **Full error messages** and stack traces
- **Configuration files** (with sensitive data removed)
- **System information**: `alsaniamcp diagnose --report`
- **Recent log entries**: `alsaniamcp logs export --last-1h`

### Error Reporting

```bash
# Generate error report
alsaniamcp error-report --include-config --include-logs

# Submit automatically (if enabled)
alsaniamcp error-report --auto-submit
```

## Prevention Best Practices

### Monitoring and Alerts

```bash
# Set up health monitoring
alsaniamcp monitor health --enable --alert-email admin@example.com

# Configure log rotation
alsaniamcp logs rotate --max-size 100MB --max-files 5

# Enable automatic backups
alsaniamcp backup auto --schedule "0 2 * * *" --retention 30d
```

### Maintenance Tasks

```bash
# Regular health checks
alsaniamcp cron add "health-check" "alsaniamcp --health"

# Performance optimization
alsaniamcp cron add "performance-tune" "alsaniamcp optimize"

# Security updates
alsaniamcp cron add "security-scan" "alsaniamcp security scan"
```

This troubleshooting guide covers the most common issues. For issues not addressed here, please check the GitHub issues or community forums, or contact support with the diagnostic information gathered using the commands above.
