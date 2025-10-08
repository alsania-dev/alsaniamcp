// @ts-ignore - TypeScript module resolution issue, works at runtime
import { blake3 } from '@noble/hashes/blake3';

export function hashData(data: string | Uint8Array): string {
  const input = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const hash = blake3(input);
  return Buffer.from(hash).toString('hex');
}

export function verifyHash(data: string, hash: string): boolean {
  return hashData(data) === hash;
}

export function generateToken(): string {
  return hashData(Date.now().toString() + Math.random().toString());
}
