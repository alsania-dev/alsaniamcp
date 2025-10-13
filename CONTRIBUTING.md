# Contributing to AlsaniaMCP

Welcome! We're excited that you're interested in contributing to AlsaniaMCP. This document outlines our guidelines and processes for contributing to the project.

## 🏗️ Project Overview

AlsaniaMCP is a universal Model Context Protocol (MCP) server that acts as a 2-way proxy between AI systems and MCP servers. It provides dynamic tool registry, multi-transport support, AI-to-AI communication, and voice activation capabilities.

## 🚀 Quick Start for Contributors

### Prerequisites

- Node.js 20.x or later
- TypeScript 5.x
- npm or yarn
- Git

### Development Setup

```bash
# Clone the repository
git clone https://github.com/alsania-dev/alsaniamcp.git
cd alsaniamcp

# Install dependencies
npm install

# Start development mode with hot reload
npm run dev

# Run tests
npm test

# Run development CLI commands
npm run cli
```

### Development Workflow

1. **Create a feature branch**: `git checkout -b feature/your-feature-name`
2. **Make your changes** with tests
3. **Run tests**: `npm test`
4. **Run linting**: `npm run lint` (if available)
5. **Build the project**: `npm run build`
6. **Create a Pull Request** with detailed description

## 📝 Code Style and Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint configuration (when available)
- Use meaningful variable and function names
- Add JSDoc/TSDoc comments for public APIs
- Use async/await over Promises for readability

### Commit Conventions

We follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Testing related changes
- `chore`: Maintenance tasks

Examples:

```
feat(cli): add voice command support
fix(proxy): resolve connection timeout issue
docs(readme): update installation instructions
```

### Branch Naming

- `feature/description-of-feature`
- `bugfix/description-of-bug`
- `hotfix/critical-fix`
- `docs/update-documentation`

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Write unit tests for all new functionality
- Use Jest framework
- Aim for >80% code coverage
- Place test files alongside implementation: `component.test.ts`
- Mock external dependencies appropriately

### Testing Standards

- Test both positive and negative scenarios
- Test error conditions and edge cases
- Use descriptive test names (e.g., `describe("when user is authenticated", () => {...})`)
- Keep tests DRY (Don't Repeat Yourself)

## 📚 Documentation

### Code Documentation

- All public methods/functions require JSDoc comments
- Include parameter and return type descriptions
- Document thrown exceptions
- Use `@example` blocks for complex usage

````typescript
/**
 * Registers a new tool with the MCP server
 * @param serverId - Unique identifier for the server
 * @param toolName - Name of the tool to register
 * @param handler - Function to handle tool execution
 * @returns Promise resolving when tool is registered
 * @throws {Error} If tool registration fails
 * @example
 * ```typescript
 * registerTool('my-server', 'echo', async (args) => {
 *   return { echo: args.message };
 * });
 * ```
 */
async function registerTool(
  serverId: string,
  toolName: string,
  handler: Function
): Promise<void> {
  // implementation
}
````

### Documentation Updates

When making changes:

- Update README.md if adding new features or changing usage
- Update relevant docs in `docs/` directory
- Add migration guides for breaking changes
- Update CHANGELOG.md with changes

## 🔧 Architecture Guidelines

### Code Organization

```
src/
├── cli/              # CLI command implementations
├── communication/    # AI-to-AI communication logic
├── core/            # Core MCP server implementation
├── proxy/           # MCP proxy and client management
├── transport/       # Transport layer implementations
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── voice/           # Voice activation features
└── index.ts         # Main entry point
```

### Design Principles

- **Modularity**: Keep components loosely coupled and highly cohesive
- **Type Safety**: Use TypeScript's type system extensively
- **Error Handling**: Implement proper error handling throughout
- **Performance**: Optimize for low-latency operations
- **Security**: Follow security best practices for network communication
- **Observability**: Include logging and monitoring capabilities

## 🚨 Issue Reporting

When reporting bugs:

1. **Check existing issues** first
2. **Use the bug report template** if available
3. **Include environment details**: OS, Node.js version, npm version
4. **Describe the bug**: What happened vs. expected behavior
5. **Provide reproduction steps** with minimal code examples
6. **Include error messages and stack traces**
7. **Add labels**: `bug`, `enhancement`, `documentation`, etc.

### Bug Report Template

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:

1. Go to '...'
2. Run '....'
3. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Environment:**

- OS: [e.g. Ubuntu 20.04]
- Node.js version: [e.g. 20.10.0]
- AlsaniaMCP version: [e.g. 1.0.0]
- Browser: [e.g. chrome, safari] (if applicable)

**Additional context**
Add any other context about the problem here.
```

## 💡 Feature Requests

For feature requests:

1. **Check for existing discussions** about the feature
2. **Create an enhancement issue** with detailed description
3. **Explain the use case** and why it's valuable
4. **Consider alternative solutions** if applicable
5. **Add mockups or examples** if helpful

## 🔄 Pull Request Process

### Before Creating a PR

1. **Update your feature branch** with the latest main branch
2. **Write tests** for your changes
3. **Run all tests** and ensure they pass
4. **Build the project** successfully
5. **Update documentation** as needed
6. **Write a clear commit message** following conventions

### PR Description Template

```markdown
## Description

Brief description of the changes made.

## Type of Change

- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix or feature)
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed
- [ ] Code coverage maintained

## Related Issues

Fixes #issue-number

## Breaking Changes

List any breaking changes and migration steps if applicable.

## Screenshots

Add screenshots if UI changes are made.
```

### Review Process

1. **Automated checks** run first (tests, linting, build)
2. **Code review** by maintainers
3. **Approval** required before merge
4. **Merge using squash-and-merge** to maintain clean history

## 🤝 Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help fellow contributors
- Maintain professional communication

### Getting Help

- Use GitHub Discussions for questions
- Join our community channels (if available)
- Check documentation first

## 📄 Additional Resources

- [README.md](README.md) - Project overview and usage
- [docs/](docs/) - Comprehensive documentation
- [API Documentation](docs/api/) - API reference
- [Architecture Guide](docs/developer-guide/architecture.md) - Technical architecture
- [Testing Guide](docs/developer-guide/testing.md) - Testing best practices

Thank you for contributing to AlsaniaMCP! 🎉
