import crypto from 'node:crypto';

export interface ErpTokenPayload {
  userId: string;
  role: string;
  organizationId: string;
  permissions?: string[];
  iat: number;
  exp: number;
  iss?: string;
  aud?: string;
}

export interface ErpTokenVerificationResult {
  valid: boolean;
  payload?: ErpTokenPayload;
  code?: 'MISSING_TOKEN' | 'MALFORMED_TOKEN' | 'INVALID_SIGNATURE' | 'TOKEN_EXPIRED';
  error?: string;
}

// Server-side authoritative secret key
const DEFAULT_SECRET = process.env.ERP_AUTH_SECRET || 'erp-monolith-auth-secret-key-2026-production-grade';
const DEFAULT_ISSUER = 'erp-authoritative-auth';
const DEFAULT_AUDIENCE = 'erp-manufacturing-monolith';
const DEFAULT_EXPIRATION_SECONDS = 86400; // 24 hours

function base64UrlEncode(data: string | Buffer): string {
  const buf = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(data: string): string {
  let str = data.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString('utf8');
}

function createSignature(headerPayloadStr: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(headerPayloadStr);
  return base64UrlEncode(hmac.digest());
}

/**
 * Generates a cryptographically signed HMAC-SHA256 Bearer token.
 */
export function generateErpToken(
  claims: {
    userId: string;
    role: string;
    organizationId: string;
    permissions?: string[];
  },
  options: {
    expiresInSeconds?: number;
    secret?: string;
    issuer?: string;
    audience?: string;
  } = {}
): string {
  const secret = options.secret || DEFAULT_SECRET;
  const expiresIn = options.expiresInSeconds ?? DEFAULT_EXPIRATION_SECONDS;
  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const payload: ErpTokenPayload = {
    userId: claims.userId,
    role: claims.role,
    organizationId: claims.organizationId,
    permissions: claims.permissions || [],
    iat: now,
    exp: now + expiresIn,
    iss: options.issuer || DEFAULT_ISSUER,
    aud: options.audience || DEFAULT_AUDIENCE,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const headerPayloadStr = `${encodedHeader}.${encodedPayload}`;
  const signature = createSignature(headerPayloadStr, secret);

  return `${headerPayloadStr}.${signature}`;
}

/**
 * Verifies the signature, structure, and expiration of an ERP Bearer token.
 */
export function verifyErpToken(
  token?: string | null,
  options: {
    secret?: string;
    clockToleranceSeconds?: number;
  } = {}
): ErpTokenVerificationResult {
  if (!token || typeof token !== 'string' || token.trim() === '') {
    return {
      valid: false,
      code: 'MISSING_TOKEN',
      error: 'Missing authentication credentials (Bearer token required).',
    };
  }

  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    return {
      valid: false,
      code: 'MALFORMED_TOKEN',
      error: 'Malformed authentication token format.',
    };
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const secret = options.secret || DEFAULT_SECRET;
  const expectedSignature = createSignature(`${encodedHeader}.${encodedPayload}`, secret);

  // Constant-time signature comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return {
      valid: false,
      code: 'INVALID_SIGNATURE',
      error: 'Invalid token signature.',
    };
  }

  let payload: ErpTokenPayload;
  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload)) as ErpTokenPayload;
  } catch {
    return {
      valid: false,
      code: 'MALFORMED_TOKEN',
      error: 'Malformed token payload.',
    };
  }

  const now = Math.floor(Date.now() / 1000);
  const clockTolerance = options.clockToleranceSeconds ?? 0;

  if (payload.exp && now > payload.exp + clockTolerance) {
    return {
      valid: false,
      code: 'TOKEN_EXPIRED',
      error: 'Authentication token has expired.',
      payload,
    };
  }

  if (!payload.userId || !payload.role || !payload.organizationId) {
    return {
      valid: false,
      code: 'MALFORMED_TOKEN',
      error: 'Authentication token missing mandatory claims (userId, role, organizationId).',
    };
  }

  return {
    valid: true,
    payload,
  };
}

/**
 * Development token generator for standard testing and development personas.
 * Generates valid signed tokens conforming to server-side cryptographic verification.
 */
export function createDevToken(
  role: string,
  userId = `usr-${role.toLowerCase().replace(/\s+/g, '-')}-01`,
  organizationId = 'default-org',
  expiresInSeconds = 86400
): string {
  return generateErpToken(
    {
      userId,
      role,
      organizationId,
    },
    { expiresInSeconds }
  );
}
