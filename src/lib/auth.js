import crypto from 'crypto';
import { query } from './db.js';

/**
 * 🛡️ OXYGEN ORBIS ROLE-BASED ACCESS CONTROL (RBAC) & AUTHENTICATION
 * Enterprise PBKDF2 Password Hashing, Cryptographic Sessions,
 * and Role-Based Route Guards.
 */

const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEY_LENGTH = 64;
const PBKDF2_DIGEST = 'sha512';
const SESSION_EXPIRY_HOURS = 24;

export const STAFF_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',   // General Manager / Owner
  FRONT_DESK: 'FRONT_DESK',     // Reception & Concierge
  HOUSEKEEPING: 'HOUSEKEEPING', // Cleaning & Turnover
};

/**
 * Hashes a password using PBKDF2 with a cryptographically secure random salt.
 * 
 * @param {string} password 
 * @returns {string} Stored format: 'pbkdf2:iterations:salt:hash'
 */
export function hashPassword(password) {
  if (!password || typeof password !== 'string' || password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEY_LENGTH, PBKDF2_DIGEST)
    .toString('hex');

  return `pbkdf2:${PBKDF2_ITERATIONS}:${salt}:${hash}`;
}

/**
 * Verifies password against stored PBKDF2 hash using timingSafeEqual to defeat timing attacks.
 * 
 * @param {string} password - Attempted password
 * @param {string} storedHash - 'pbkdf2:iterations:salt:hash'
 * @returns {boolean} True if password matches exactly
 */
export function verifyPassword(password, storedHash) {
  try {
    const parts = storedHash.split(':');
    if (parts.length !== 4 || parts[0] !== 'pbkdf2') {
      return false;
    }

    const iterations = parseInt(parts[1], 10);
    const salt = parts[2];
    const originalHash = parts[3];

    const computedHash = crypto
      .pbkdf2Sync(password, salt, iterations, PBKDF2_KEY_LENGTH, PBKDF2_DIGEST)
      .toString('hex');

    const originalBuffer = Buffer.from(originalHash, 'hex');
    const computedBuffer = Buffer.from(computedHash, 'hex');

    if (originalBuffer.length !== computedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(originalBuffer, computedBuffer);
  } catch (err) {
    return false;
  }
}

/**
 * Creates a signed JWT-like session token with HMAC-SHA256 signature.
 * 
 * @param {object} payload - { userId, username, role, fullName }
 * @param {string} secretKey - JWT_SECRET from environment
 * @returns {string} Encrypted session token
 */
export function createSessionToken(payload, secretKey = process.env.JWT_SECRET || 'oxygen-orbis-fallback-secret-key-32chars') {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  
  const exp = Math.floor(Date.now() / 1000) + SESSION_EXPIRY_HOURS * 3600;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');

  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

/**
 * Verifies session token authenticity and returns decoded payload.
 * Throws error if expired or tampered with.
 * 
 * @param {string} token 
 * @param {string} secretKey 
 * @returns {object} Decoded session data
 */
export function verifySessionToken(token, secretKey = process.env.JWT_SECRET || 'oxygen-orbis-fallback-secret-key-32chars') {
  if (!token || typeof token !== 'string') {
    throw new Error('No authorization token provided.');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token structure.');
  }

  const [header, body, signature] = parts;

  // Verify HMAC-SHA256 signature in constant time
  const expectedSig = crypto
    .createHmac('sha256', secretKey)
    .update(`${header}.${body}`)
    .digest('base64url');

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSig);

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    throw new Error('SECURITY ALERT: Session signature is invalid or has been tampered with.');
  }

  // Parse payload and check expiration
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp && payload.exp < now) {
    throw new Error('Session has expired. Please log in again.');
  }

  return payload;
}

/**
 * Authenticates staff member credentials against PostgreSQL database.
 */
export async function authenticateStaff(usernameOrEmail, plainPassword) {
  const cleanInput = (usernameOrEmail || '').trim().toLowerCase();

  const sql = `
    SELECT id, username, email, password_hash, full_name, role, is_active
    FROM staff_users
    WHERE (LOWER(username) = $1 OR LOWER(email) = $1)
    LIMIT 1;
  `;

  const result = await query(sql, [cleanInput]);
  if (!result.rows.length) {
    // Run dummy verify to defend against user enumeration timing attacks
    verifyPassword('dummy_pass', hashPassword('dummy_pass'));
    throw new Error('Invalid username or password.');
  }

  const staff = result.rows[0];

  if (!staff.is_active) {
    throw new Error('This staff account has been deactivated. Contact management.');
  }

  const isMatch = verifyPassword(plainPassword, staff.password_hash);
  if (!isMatch) {
    throw new Error('Invalid username or password.');
  }

  // Update last login timestamp
  await query(`UPDATE staff_users SET last_login_at = NOW() WHERE id = $1;`, [staff.id]);

  const token = createSessionToken({
    userId: staff.id,
    username: staff.username,
    fullName: staff.full_name,
    role: staff.role,
  });

  return {
    token,
    user: {
      id: staff.id,
      username: staff.username,
      fullName: staff.full_name,
      role: staff.role,
    },
  };
}

/**
 * Role authorization guard.
 * 
 * @param {string} userRole 
 * @param {Array<string>} allowedRoles 
 * @returns {boolean}
 */
export function isAuthorized(userRole, allowedRoles = []) {
  if (!allowedRoles.length) return true;
  // Super Admin has universal access
  if (userRole === STAFF_ROLES.SUPER_ADMIN) return true;
  return allowedRoles.includes(userRole);
}
