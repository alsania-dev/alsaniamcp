import { UniversalMCPServer } from "../../src/core/server";

describe("UniversalMCPServer", () => {
  let server: UniversalMCPServer;

  beforeEach(() => {
    server = new UniversalMCPServer();
  });

  afterEach(() => {
    // Cleanup is handled automatically by cleanupUnusedTools
  });

  describe("Initialization", () => {
    test("should initialize with valid config", () => {
      expect(server).toBeDefined();
    });

    test("should have server instance", () => {
      expect(server.getServer).toBeDefined();
    });

    test("should be able to list tools", () => {
      expect(server.listTools).toBeDefined();
    });

    test("should be able to list resources", () => {
      expect(server.listResources).toBeDefined();
    });
  });

  describe("Registry Operations", () => {
    test("should handle tool registration", () => {
      const mockHandler = jest.fn();

      server.registerTool(
        "test-server",
        "test-tool",
        {
          name: "test-tool",
          description: "Test tool",
          inputSchema: { type: "object" },
        },
        mockHandler
      );

      const tools = server.listTools();
      expect(tools).toContainEqual(
        expect.objectContaining({
          serverId: "test-server",
          toolName: "test-tool",
        })
      );
    });

    test("should handle resource registration", () => {
      const mockHandler = jest.fn();

      server.registerResource(
        "test-server",
        "test://resource",
        "Test Resource",
        mockHandler,
        "Test resource",
        "text/plain"
      );

      const resources = server.listResources();
      expect(resources).toContainEqual(
        expect.objectContaining({
          serverId: "test-server",
          resourceUri: "test://resource",
          name: "Test Resource",
        })
      );
    });

    test("should handle prompt registration", () => {
      const mockHandler = jest.fn();

      server.registerPrompt(
        "test-server",
        "test-prompt",
        mockHandler,
        "Test prompt",
        []
      );

      const prompts = server.listPrompts();
      expect(prompts).toContainEqual(
        expect.objectContaining({
          serverId: "test-server",
          promptName: "test-prompt",
        })
      );
    });
  });

  describe("Tool and Resource Operations", () => {
    test("should handle tool calls via MCP server", async () => {
      const mockHandler = jest.fn().mockResolvedValue({ result: "echoed" });

      server.registerTool(
        "test-server",
        "echo",
        {
          name: "echo",
          description: "Echo tool",
          inputSchema: {
            type: "object",
            properties: { message: { type: "string" } },
          },
        },
        mockHandler
      );

      const result = await server.callTool("test-server", "echo", {
        message: "hello",
      });
      expect(result).toEqual({ result: "echoed" });
      expect(mockHandler).toHaveBeenCalledWith({ message: "hello" });
    });

    test("should throw error for non-existent tool", async () => {
      await expect(
        server.callTool("test-server", "nonexistent", {})
      ).rejects.toThrow("Tool test-server/nonexistent not found");
    });

    test("should handle resource reading", async () => {
      const mockHandler = jest.fn().mockResolvedValue("resource content");

      server.registerResource(
        "test-server",
        "test://resource",
        "Test Resource",
        mockHandler,
        "Test resource",
        "text/plain"
      );

      const result = await server.readResource(
        "test-server",
        "test://resource"
      );
      expect(result).toBe("resource content");
      expect(mockHandler).toHaveBeenCalled();
    });

    test("should throw error for non-existent resource", async () => {
      await expect(
        server.readResource("test-server", "nonexistent")
      ).rejects.toThrow("Resource test-server://nonexistent not found");
    });
  });
});
