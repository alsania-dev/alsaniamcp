# AlsaniaMCP Documentation

Welcome to the comprehensive documentation for AlsaniaMCP - the universal Model Context Protocol server.

## 📚 Documentation Overview

This documentation is organized into sections for different audiences and use cases:

### 🎯 For Users

- **[Getting Started](user-guide/getting-started.md)** - Quick start guide
- **[Installation](user-guide/installation.md)** - Multiple installation options
- **[Configuration](user-guide/configuration.md)** - Server and client configuration
- **[Usage Examples](user-guide/usage-examples.md)** - Real-world examples
- **[Troubleshooting](user-guide/troubleshooting.md)** - Common issues and solutions
- **[Migration Guide](user-guide/migration-guide.md)** - Upgrading between versions

### 🔧 For Developers

- **[Architecture Overview](design/architecture.md)** - Technical architecture
- **[API Reference](api/api-reference.md)** - Complete API documentation
- **[Testing Guide](developer-guide/testing.md)** - Testing framework and procedures
- **[Deployment](developer-guide/deployment.md)** - Deployment and operations
- **[Performance Tuning](developer-guide/performance.md)** - Optimization and monitoring

### 🎨 Design & API

- **[Design Principles](design/overview.md)** - Project philosophy and design decisions
- **[REST API](api/rest-api.md)** - HTTP REST API reference
- **[WebSocket API](api/websocket-api.md)** - Real-time communication API

### 🤝 Contributing

- **[Development Setup](contributing/development-setup.md)** - Environment setup for contributors
- **[Code Style](contributing/code-style.md)** - Coding standards and conventions
- **[Pull Request Template](contributing/pull-request-template.md)** - PR submission guidelines

## 🚀 Quick Navigation

### New to AlsaniaMCP?

1. Start with [Getting Started](user-guide/getting-started.md)
2. Choose your [installation method](user-guide/installation.md)
3. Follow the [usage examples](user-guide/usage-examples.md)

### Developing with AlsaniaMCP?

1. Learn about the [architecture](developer-guide/architecture.md)
2. Check the [API reference](developer-guide/api-reference.md)
3. Follow [testing guidelines](developer-guide/testing.md)

### Contributing to the Project?

1. Read [CONTRIBUTING.md](../CONTRIBUTING.md) in the root
2. Set up your [development environment](contributing/development-setup.md)
3. Follow our [code style](contributing/code-style.md)

## 📋 Key Concepts

### Universal MCP Proxy

AlsaniaMCP acts as a bridge between AI systems and MCP servers, providing:

- **Multi-Transport Support**: STDIO, HTTP/SSE, and Streamable HTTP transports
- **Dynamic Tool Registry**: On-demand loading/unloading of tools
- **AI-to-AI Communication**: Direct communication between AI agents
- **Voice Integration**: Speech-to-text and text-to-speech capabilities

### Core Components

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

## 🔗 Useful Links

- **[Project Homepage](https://github.com/alsania-dev/alsaniamcp)**
- **[Issues & Bug Reports](https://github.com/alsania-dev/alsaniamcp/issues)**
- **[Discussions & Community](https://github.com/alsania-dev/alsaniamcp/discussions)**
- **[CHANGELOG](../CHANGELOG.md)** - Version history and changes
- **[CONTRIBUTING](../CONTRIBUTING.md)** - How to contribute

## 🎯 Support

- **Documentation Issues**: Found a problem with these docs? [Report it here](https://github.com/alsania-dev/alsaniamcp/issues/new?labels=documentation&template=documentation-issue.md)
- **General Support**: Check the [troubleshooting guide](user-guide/troubleshooting.md) or start a discussion
- **Community**: Join our [GitHub Discussions](https://github.com/alsania-dev/alsaniamcp/discussions)

---

**Version**: 1.0.0 | **Last Updated**: 2025-10-12

Built with ❤️ using the [Model Context Protocol](https://modelcontextprotocol.io)
