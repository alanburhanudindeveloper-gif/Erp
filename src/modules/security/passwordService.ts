/**
 * Production-Grade Password Hashing and Verification Service.
 *
 * Implements scrypt key derivation with cryptographically secure random salts.
 * Standardized across Node.js crypto module with zero external dependencies.
 *
 * Security Requirements:
 * 1. Passwords MUST NEVER be stored in plaintext.
 * 2. Passwords MUST NEVER be logged.
 * 3. Constant-time comparison via timingSafeEqual to prevent timing attacks.
 */

import crypto from 'node:crypto';

const SALT_BYTE_LENGTH = 16;
const KEY_BYTE_LENGTH = 64;

export interface HashResult {
  readonly salt: string;
  readonly hash: string;
}

/**
 * Derives a cryptographic hash from a plaintext password using a fresh random salt.
 */
export function hashPassword(password: string): HashResult {
  const salt = crypto.randomBytes(SALT_BYTE_LENGTH).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, KEY_BYTE_LENGTH);
  return {
    salt,
    hash: derivedKey.toString('hex'),
  };
}

/**
 * Hashes a plaintext password with an existing salt (e.g. during verification).
 */
export function hashWithSalt(password: string, salt: string): string {
  const derivedKey = crypto.scryptSync(password, salt, KEY_BYTE_LENGTH);
  return derivedKey.toString('hex');
}

/**
 * Verifies a plaintext password against a stored salt and hash using constant-time comparison.
 */
export function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  if (!password || !salt || !storedHash) {
    return false;
  }

  try {
    const candidateHash = hashWithSalt(password, salt);
    const candidateBuffer = Buffer.from(candidateHash, 'hex');
    const storedBuffer = Buffer.from(storedHash, 'hex');

    if (candidateBuffer.length !== storedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(candidateBuffer, storedBuffer);
  } catch {
    return false;
  }
}
