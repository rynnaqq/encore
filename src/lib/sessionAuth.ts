import crypto from 'node:crypto';

export interface SessionPayload {
  username: string;
  role: 'user' | 'admin';
  createdAt: number;
  exp: number; // Expiration timestamp in ms
}

const JWT_SECRET = process.env.SESSION_SECRET || 'encore-secure-default-session-salt-2026-production';

/**
 * Creates a signed stateless HMAC-SHA256 session token valid for 7 days.
 */
export const createSessionToken = (
  user: { username: string; role: 'user' | 'admin'; createdAt?: number },
  expiresInMs: number = 7 * 24 * 60 * 60 * 1000,
  secret: string = JWT_SECRET
): string => {
  const payload: SessionPayload = {
    username: user.username,
    role: user.role,
    createdAt: user.createdAt || Date.now(),
    exp: Date.now() + expiresInMs,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
};

/**
 * Verifies a signed session token, checking signature integrity and expiration.
 */
export const verifySessionToken = (
  token: string | null | undefined,
  secret: string = JWT_SECRET
): SessionPayload | null => {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;

  try {
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(payloadB64)
      .digest('base64url');

    // Constant-time comparison to prevent timing attacks
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSig);

    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return null;
    }

    const payload: SessionPayload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8')
    );

    if (Date.now() > payload.exp) {
      return null; // Expired token
    }

    return payload;
  } catch (err) {
    return null;
  }
};
