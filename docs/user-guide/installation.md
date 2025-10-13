# Installation Guide

This guide will walk you through installing and setting up AlsaniaMCP on your system.

## Prerequisites

Before installing AlsaniaMCP, ensure your system meets these requirements:

- **Node.js**: Version 18.x or higher
- **npm**: Version 8.x or higher (comes with Node.js)
- **Git**: For cloning the repository
- **Docker** (optional): For containerized deployment

### System Requirements

- **Minimum**: 256MB RAM, 100MB storage
- **Recommended**: 512MB+ RAM, 1GB+ storage
- **Operating Systems**: Linux, macOS, Windows (via WSL2)

## Installation Methods

### Method 1: NPM Package (Recommended)

```bash
# Install globally
npm install -g @alsania/mcp-proxy

# Verify installation
alsaniamcp --version
```

### Method 2: From Source

```bash
# Clone the repository
git clone https://github.com/alsania-dev/alsaniamcp.git
cd alsaniamcp

# Install dependencies
npm install

# Build the project
npm run build

# Link for global usage (optional)
npm link
```

### Method 3: Docker Container

```bash
# Pull the official image
docker pull alsania/mcp-proxy:latest

# Or build from source
docker build -t alsania/mcp-proxy .
```

## Post-Installation Setup

### Verification

After installation, verify the setup:

```bash
# Check version
alsaniamcp --version

# Run health check
alsaniamcp --health
```

### Configuration

1. **Create configuration file**:

   ```bash
   alsaniamcp init --config
   ```

2. **Edit configuration**:

   ```bash
   # Open the generated config file
   alsaniamcp config --edit
   ```

3. **Validate configuration**:
   ```bash
   alsaniamcp config --validate
   ```

## Troubleshooting Installation

### Common Issues

**Issue**: `npm install` fails

```
Solution: Clear npm cache and try again
npm cache clean --force
npm install
```

**Issue**: Permission denied during global install

```
Solution: Use sudo (Linux/macOS) or run as administrator (Windows)
sudo npm install -g @alsania/mcp-proxy
```

**Issue**: Docker build fails

```
Solution: Ensure Docker daemon is running
# Check Docker status
docker info
```

### Next Steps

After successful installation, proceed to:

1. [Configuration Guide](../user-guide/configuration.md)
2. [Getting Started](../user-guide/getting-started.md)

## Uninstalling

To uninstall AlsaniaMCP:

```bash
# NPM uninstall
npm uninstall -g @alsania/mcp-proxy

# Docker cleanup
docker rmi alsania/mcp-proxy

# Source cleanup (if installed from source)
rm -rf alsaniamcp
npm unlink alsaniamcp
```
