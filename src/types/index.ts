import { z } from 'zod';

export const MCPServerConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  transport: z.enum(['stdio', 'http', 'sse']),
  endpoint: z.string().optional(),
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  lifespan: z.number().optional(),
  roles: z.array(z.string()).optional(),
  permissions: z.array(z.string()).optional(),
  allowedTools: z.array(z.string()).optional(),
  apiKey: z.string().optional(),
  password: z.string().optional(),
  isOpen: z.boolean().default(false),
});

export type MCPServerConfig = z.infer<typeof MCPServerConfigSchema>;

export const MessageSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string().or(z.array(z.string())),
  content: z.string(),
  timestamp: z.number(),
  type: z.enum(['text', 'voice', 'system']),
  metadata: z.record(z.any()).optional(),
});

export type Message = z.infer<typeof MessageSchema>;

export const VoiceConfigSchema = z.object({
  wakeWord: z.string(),
  language: z.string().default('en-US'),
  voiceId: z.string().optional(),
  enableSTT: z.boolean().default(true),
  enableTTS: z.boolean().default(true),
});

export type VoiceConfig = z.infer<typeof VoiceConfigSchema>;

export interface ToolRegistry {
  [serverId: string]: {
    [toolName: string]: {
      schema: any;
      handler: Function;
      lastUsed: number;
    };
  };
}

export interface ServerInstance {
  id: string;
  config: MCPServerConfig;
  process?: any;
  client?: any;
  transport?: any;
  status: 'active' | 'inactive' | 'spawning' | 'error';
  createdAt: number;
  expiresAt?: number;
}

export interface GatewayRoute {
  path: string;
  targetServerId: string;
  method: string;
  requiresAuth: boolean;
}
