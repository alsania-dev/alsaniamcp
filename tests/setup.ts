import dotenv from "dotenv";

// Extend global interface for test utilities
declare global {
  var testUtils: {
    createMockResponse: () => any;
    createMockRequest: (body?: any, params?: any, query?: any) => any;
    wait: (ms: number) => Promise<void>;
  };
}

// Load environment variables for tests
dotenv.config();

// Mock console methods to reduce noise during tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// In tests, we can control logging or suppress it
beforeAll(() => {
  // Suppress logs during tests unless explicitly needed
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  // Restore original console methods
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test utilities
global.testUtils = {
  // Mock Express response
  createMockResponse: () => ({
    json: jest.fn(),
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
    setHeader: jest.fn(),
    getHeader: jest.fn(),
  }),

  // Mock Express request
  createMockRequest: (body: any = {}, params: any = {}, query: any = {}) => ({
    body,
    params,
    query,
    headers: {},
    method: "POST",
    url: "/test",
  }),

  // Wait for async operations
  wait: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),
};
