import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET must be set');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) throw new Error('ENCRYPTION_KEY must be set');

export const generateAccessToken = (payload: { userId: number; organizationId: number; role: string }) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET) as { userId: number; organizationId: number; role: string };
};

export const generateRefreshToken = () => {
  return crypto.randomBytes(32).toString('base64url');
};

export const hashPassword = async (password: string) => {
  return bcrypt.hash(password, 12);
};

export const verifyPassword = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};

export const hashToken = async (token: string) => {
  return bcrypt.hash(token, 12);
};
