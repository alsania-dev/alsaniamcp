# Testing Guide

Comprehensive guide for testing AlsaniaMCP including unit tests, integration tests, performance tests, and CI/CD testing strategies.

## Overview

AlsaniaMCP uses Jest as the primary testing framework with additional tools for different testing scenarios. The test suite is designed to provide comprehensive coverage of the codebase while maintaining fast execution in development.

## Testing Structure

### Directory Layout

```
├── tests/                           # Test directory
│   ├── unit/                       # Unit tests
│   │   ├── core/                   # Core functionality tests
│   │   ├── transport/              # Transport layer tests
│   │   ├── security/               # Security module tests
│   │   └── monitoring/             # Monitoring tests
│   ├── integration/                # Integration tests
│   │   ├── api/                    # API integration tests
│   │   └── server/                 # Server integration tests
│   ├── performance/                # Performance tests
│   ├── e2e/                        # End-to-end tests
│   ├── fixtures/                   # Test data and mocks
│   ├── helpers/                    # Test utilities
│   └── setup.ts                    # Global test setup
├── src/
│   └── **/*.test.ts                # Colocated unit tests
│   └── **/*.spec.ts                # Alternative naming
```

## Running Tests

### Quick Start

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test -- tests/unit/core/server.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="authentication"

# Run tests for specific path
npm test -- --testPathPattern=transport
```

### Test Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:integration": "jest --testPathPattern=integration",
    "test:performance": "jest --testPathPattern=performance",
    "test:e2e": "jest --testPathPattern=e2e",
    "test:unit": "jest --testPathPattern=unit",
    "test:ci": "jest --coverage --watchAll=false --passWithNoTests"
  }
}
```

## Unit Testing

### Basic Test Structure

```typescript
// server.test.ts
import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { AlsaniaMCPServer } from "../../src/core/server";

describe("AlsaniaMCPServer", () => {
  let server: AlsaniaMCPServer;

  beforeEach(async () => {
    server = new AlsaniaMCPServer();
    await server.initialize();
  });

  afterEach(async () => {
    await server.shutdown();
  });

  describe("initialization", () => {
    it("should initialize with default config", () => {
      expect(server.isInitialized()).toBe(true);
      expect(server.getPort()).toBe(3000);
    });

    it("should initialize with custom config", () => {
      const customServer = new AlsaniaMCPServer({ port: 8080 });
      expect(customServer.getPort()).toBe(8080);
    });
  });

  describe("server lifecycle", () => {
    it("should start and stop gracefully", async () => {
      await server.start();
      expect(server.isRunning()).toBe(true);

      await server.stop();
      expect(server.isRunning()).toBe(false);
    });
  });
});
```

### Testing with Mocks

```typescript
// Using jest mocks for external dependencies
import { jest } from "@jest/globals";

const mockTransport = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  execute: jest.fn(),
};

jest.mock("../../src/transport/http-gateway", () => ({
  HTTPTransport: jest.fn().mockImplementation(() => mockTransport),
}));

describe("MCP Server with Transport", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should use transport for execution", async () => {
    mockTransport.execute.mockResolvedValue({ result: "success" });

    const server = new AlsaniaMCPServer();
    const result = await server.executeTool("test-server", "test-tool", {});

    expect(mockTransport.execute).toHaveBeenCalledWith("test-tool", {});
    expect(result).toEqual({ result: "success" });
  });
});
```

### Testing Async Operations

```typescript
describe("Async Operations", () => {
  it("should handle successful async operations", async () => {
    const server = new AlsaniaMCPServer();

    // Use fake timers for timeout testing
    jest.useFakeTimers();

    const asyncOperation = server.performAsyncOperation();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Operation timed out")), 5000)
    );

    await expect(
      Promise.race([asyncOperation, timeoutPromise])
    ).resolves.toBeDefined();

    jest.useRealTimers();
  });

  it("should timeout async operations", async () => {
    const server = new AlsaniaMCPServer();

    // Mock implementation that never resolves
    const mockAsyncOp = jest.spyOn(server, "performAsyncOperation");
    mockAsyncOp.mockImplementation(() => new Promise(() => {})); // Never resolves

    await expect(server.performAsyncOperation(100)).rejects.toThrow(
      "Operation timed out"
    );
  });
});
```

## Integration Testing

### API Integration Tests

```typescript
// tests/integration/api/server-api.test.ts
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import { AlsaniaMCPServer } from "../../../src/core/server";

describe("Server API Integration", () => {
  let server: AlsaniaMCPServer;
  let app: any;

  beforeAll(async () => {
    server = new AlsaniaMCPServer({ port: 0 }); // Use random port
    await server.start();
    app = server.getExpressApp();
  });

  afterAll(async () => {
    await server.stop();
  });

  describe("GET /api/status", () => {
    it("should return server status", async () => {
      const response = await request(app).get("/api/status").expect(200);

      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("version");
      expect(response.body).toHaveProperty("uptime");
    });
  });

  describe("Server Management", () => {
    it("should list MCP servers", async () => {
      const response = await request(app).get("/api/servers").expect(200);

      expect(Array.isArray(response.body.servers)).toBe(true);
    });

    it("should add new server", async () => {
      const newServer = {
        id: "test-server",
        name: "Test Server",
        transport: "stdio",
        command: "echo",
        args: ["hello"],
      };

      const response = await request(app)
        .post("/api/servers")
        .send(newServer)
        .expect(201);

      expect(response.body.id).toBe("test-server");
    });
  });
});
```

### Database Integration Tests

```typescript
// tests/integration/database/storage.test.ts
describe("Database Storage Integration", () => {
  let db: Database;

  beforeEach(async () => {
    // Use in-memory database for tests
    db = new Database(":memory:");
    await db.initialize();
  });

  afterEach(async () => {
    await db.close();
  });

  it("should persist server configurations", async () => {
    const serverConfig = {
      id: "test-server",
      name: "Test Server",
      transport: "stdio",
      command: "test",
    };

    await db.saveServerConfig(serverConfig);
    const retrieved = await db.getServerConfig("test-server");

    expect(retrieved).toEqual(serverConfig);
  });

  it("should handle concurrent operations", async () => {
    const operations = Array.from({ length: 10 }, (_, i) => ({
      id: `server-${i}`,
      name: `Server ${i}`,
      transport: "stdio",
      command: "test",
    }));

    // Test concurrent saves
    await Promise.all(operations.map((config) => db.saveServerConfig(config)));

    const allServers = await db.listServerConfigs();
    expect(allServers).toHaveLength(10);
  });
});
```

## End-to-End Testing

### Full System Tests

```typescript
// tests/e2e/full-system.test.ts
describe("Full System E2E Tests", () => {
  let testServer: TestServer;
  let client: TestClient;

  beforeAll(async () => {
    testServer = new TestServer();
    client = new TestClient();

    await testServer.start();
    await client.connect(testServer.getUrl());
  });

  afterAll(async () => {
    await client.disconnect();
    await testServer.stop();
  });

  it("should execute complete workflow", async () => {
    // Register MCP server
    const serverId = await client.registerServer({
      id: "math-server",
      name: "Math Server",
      transport: "stdio",
      command: "python",
      args: ["./tests/fixtures/math_server.py"],
    });

    // Verify server registration
    const servers = await client.listServers();
    expect(servers.find((s) => s.id === serverId)).toBeDefined();

    // Execute tool
    const result = await client.executeTool("math-server", "add", {
      a: 5,
      b: 3,
    });

    expect(result).toEqual({ sum: 8 });

    // Test error handling
    await expect(
      client.executeTool("math-server", "divide", { a: 5, b: 0 })
    ).rejects.toThrow("Division by zero");
  });
});
```

### Browser-Based E2E Tests

```typescript
// tests/e2e/browser/admin-interface.test.ts
describe("Admin Interface E2E", () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  it("should display server dashboard", async () => {
    await page.goto("http://localhost:3000/admin");

    // Wait for dashboard to load
    await page.waitForSelector(".dashboard");

    // Check server list
    const servers = await page.$$eval(".server-item", (items) =>
      items.map((item) => item.textContent)
    );

    expect(servers.length).toBeGreaterThan(0);
  });

  it("should add new server via UI", async () => {
    await page.goto("http://localhost:3000/admin");

    // Click add server button
    await page.click(".add-server-btn");

    // Fill form
    await page.type("#server-id", "ui-test-server");
    await page.type("#server-name", "UI Test Server");
    await page.select("#transport", "stdio");
    await page.type("#command", "echo");

    // Submit form
    await page.click(".submit-btn");

    // Verify server appears in list
    await page.waitForSelector(`[data-server-id="ui-test-server"]`);
    const serverElement = await page.$(`[data-server-id="ui-test-server"]`);
    expect(serverElement).toBeTruthy();
  });
});
```

## Performance Testing

### Benchmark Tests

```typescript
// tests/performance/benchmark.test.ts
describe("Performance Benchmarks", () => {
  let server: AlsaniaMCPServer;
  let benchmark: Benchmark;

  beforeAll(async () => {
    server = new AlsaniaMCPServer();
    await server.start();
    benchmark = new Benchmark();
  });

  afterAll(async () => {
    await server.stop();
  });

  it("should handle high concurrent load", async () => {
    const concurrentRequests = 100;
    const requests = Array.from({ length: concurrentRequests }, (_, i) =>
      benchmark.measure(`request-${i}`, () =>
        server.executeTool("test-server", "echo", { message: `test-${i}` })
      )
    );

    const startTime = Date.now();
    const results = await Promise.all(requests);
    const endTime = Date.now();

    const totalTime = endTime - startTime;
    const avgResponseTime = totalTime / concurrentRequests;

    // Assertions based on requirements
    expect(avgResponseTime).toBeLessThan(100); // < 100ms average
    expect(results.filter((r) => r.success).length).toBe(concurrentRequests); // All successful
  });

  it("should maintain performance under sustained load", async () => {
    const duration = 30000; // 30 seconds
    const sustainedRequests = [];

    const startTime = Date.now();

    while (Date.now() - startTime < duration) {
      sustainedRequests.push(
        server.executeTool("test-server", "echo", { message: "load-test" })
      );

      // Small delay to prevent overwhelming
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    const results = await Promise.all(sustainedRequests);
    const successRate =
      results.filter((r) => r.success).length / results.length;

    expect(successRate).toBeGreaterThan(0.995); // > 99.5% success rate
  });
});
```

### Memory Leak Tests

```typescript
// tests/performance/memory-leak.test.ts
describe("Memory Leak Detection", () => {
  it("should not leak memory during extended operation", async () => {
    const server = new AlsaniaMCPServer();

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const initialMemory = process.memoryUsage().heapUsed;
    console.log(`Initial memory: ${initialMemory / 1024 / 1024} MB`);

    // Perform many operations
    for (let i = 0; i < 1000; i++) {
      await server.executeTool("test-server", "echo", { iteration: i });

      // Periodic garbage collection check
      if (i % 100 === 0 && global.gc) {
        global.gc();
      }
    }

    // Force final garbage collection
    if (global.gc) {
      global.gc();
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    const allowedLeak = initialMemory * 0.1; // Allow 10% increase

    console.log(`Final memory: ${finalMemory / 1024 / 1024} MB`);
    console.log(`Memory increase: ${memoryIncrease / 1024 / 1024} MB`);

    // Assert memory leak threshold
    expect(memoryIncrease).toBeLessThan(allowedLeak);
  }, 120000); // 2 minute timeout
});
```

## Testing Best Practices

### Test Organization

```typescript
// Use descriptive test names
describe("User Authentication", () => {
  describe("when user provides valid credentials", () => {
    it("should return JWT token", async () => {
      // Test implementation
    });
  });

  describe("when user provides invalid credentials", () => {
    it("should return 401 Unauthorized", async () => {
      // Test implementation
    });
  });
});
```

### Test Data Management

```typescript
// tests/helpers/test-data.ts
export const validServerConfigs = {
  basic: {
    id: "test-server",
    name: "Test Server",
    transport: "stdio" as const,
    command: "echo",
    args: ["test"],
  },
  complex: {
    id: "complex-server",
    name: "Complex Server",
    transport: "http" as const,
    endpoint: "https://api.example.com",
    apiKey: "test-key",
    permissions: ["read", "write"],
  },
};

export const mockResponses = {
  success: { status: "ok", result: "success" },
  error: { status: "error", message: "Operation failed" },
  timeout: new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timeout")), 100)
  ),
};
```

### Custom Matchers and Assertions

```typescript
// tests/helpers/custom-matchers.ts
expect.extend({
  toBeValidServerConfig(received) {
    const pass =
      received &&
      typeof received.id === "string" &&
      typeof received.name === "string" &&
      ["stdio", "http", "sse"].includes(received.transport);

    return {
      message: () => `expected ${received} to be a valid server config`,
      pass,
    };
  },

  toHaveResponseTimeLessThan(received, expected) {
    const pass = received < expected;
    return {
      message: () =>
        `expected response time ${received}ms to be less than ${expected}ms`,
      pass,
    };
  },
});

// Usage in tests
expect(serverConfig).toBeValidServerConfig();
expect(responseTime).toHaveResponseTimeLessThan(100);
```

## CI/CD Testing

### GitHub Actions Configuration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]

    steps:
      - uses: actions/checkout@v3

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run type-check

      - name: Run unit tests
        run: npm run test:unit -- --coverage --watchAll=false

      - name: Run integration tests
        run: npm run test:integration

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  e2e:
    runs-on: ubuntu-latest
    needs: test

    steps:
      - uses: actions/checkout@v3

      - name: Setup test environment
        run: |
          docker-compose -f docker-compose.test.yml up -d
          npm run wait-for-services

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Cleanup
        run: docker-compose -f docker-compose.test.yml down
```

### Coverage Requirements

```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    "src/**/*.{ts,js}",
    "!src/**/*.d.ts",
    "!src/**/index.ts", // Barrel exports
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    "src/core/": {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  coverageReporters: ["text", "lcov", "html", "json-summary"],
};
```

### Test Environment Setup

```typescript
// tests/setup.ts
import { jest } from "@jest/globals";

// Set test environment
process.env.NODE_ENV = "test";
process.env.JEST_WORKER_ID = "1";

// Global test setup
beforeAll(async () => {
  // Setup test database
  await setupTestDatabase();

  // Start test services
  await startTestServices();

  // Configure mocks
  setupGlobalMocks();
});

afterAll(async () => {
  // Cleanup
  await cleanupTestDatabase();
  await stopTestServices();
});

// Custom console methods for cleaner test output
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: originalConsole.error, // Keep error logging
};
```

This comprehensive testing guide provides the framework needed to ensure AlsaniaMCP maintains high quality and reliability across all development stages.
