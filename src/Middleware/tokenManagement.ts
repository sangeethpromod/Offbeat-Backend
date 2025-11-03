import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import RefreshToken from '../Model/refreshTokenModel';
import AuthUser from '../Model/authModel';

type JwtPayloadBase = {
  userId: string;
  email: string;
  role: string;
};

type AccessTokenPayload = JwtPayloadBase & { tokenType: 'access' };
type RefreshTokenPayload = JwtPayloadBase & {
  tokenType: 'refresh';
  jti: string;
};

const ACCESS_TTL = (process.env.JWT_ACCESS_EXPIRES_IN as any) || '15m';
const REFRESH_TTL = (process.env.JWT_REFRESH_EXPIRES_IN as any) || '30d';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;

export function signAccessToken(payload: JwtPayloadBase): string {
  const tokenPayload: AccessTokenPayload = { ...payload, tokenType: 'access' };
  const options: SignOptions = { expiresIn: ACCESS_TTL };
  return jwt.sign(tokenPayload as any, JWT_SECRET as jwt.Secret, options);
}

export async function signAndStoreRefreshToken(
  payload: JwtPayloadBase
): Promise<{ token: string; tokenId: string; expiresAt: Date }> {
  const jti = uuidv4();
  const tokenPayload: RefreshTokenPayload = {
    ...payload,
    tokenType: 'refresh',
    jti,
  };
  const options: SignOptions = { expiresIn: REFRESH_TTL };
  const token = jwt.sign(
    tokenPayload as any,
    JWT_REFRESH_SECRET as jwt.Secret,
    options
  );

  // decode exp to compute expiresAt
  const decoded = jwt.decode(token) as { exp?: number } | null;
  const expSeconds = decoded?.exp
    ? decoded.exp
    : Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;
  const expiresAt = new Date(expSeconds * 1000);

  const tokenHash = await bcrypt.hash(token, 10);
  await RefreshToken.create({
    tokenId: jti,
    userId: payload.userId,
    tokenHash,
    expiresAt,
    revoked: false,
  });

  return { token, tokenId: jti, expiresAt };
}

export async function generateTokens(user: {
  userId: string;
  email: string;
  role: string;
}) {
  const accessToken = signAccessToken(user);
  const { token: refreshToken } = await signAndStoreRefreshToken(user);
  return { accessToken, refreshToken };
}

export function verifyAccessToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring('Bearer '.length)
      : undefined;
    if (!token) {
      res
        .status(401)
        .json({ success: false, message: 'Missing Authorization header' });
      return;
    }
    const decoded = jwt.verify(token, JWT_SECRET) as AccessTokenPayload;
    if (decoded.tokenType !== 'access') {
      res.status(401).json({ success: false, message: 'Invalid token type' });
      return;
    }
    (req as any).jwtUser = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (err: any) {
    res
      .status(401)
      .json({ success: false, message: 'Invalid or expired token' });
  }
}

export async function refreshTokenHandler(req: Request, res: Response) {
  try {
    const provided =
      (req.body?.refreshToken as string) ||
      (req.headers['x-refresh-token'] as string) ||
      '';
    if (!provided) {
      res
        .status(400)
        .json({ success: false, message: 'refreshToken is required' });
      return;
    }

    let decoded: RefreshTokenPayload;
    try {
      decoded = jwt.verify(provided, JWT_REFRESH_SECRET) as RefreshTokenPayload;
      if (decoded.tokenType !== 'refresh')
        throw new Error('Invalid token type');
    } catch (e) {
      res
        .status(401)
        .json({ success: false, message: 'Invalid or expired refresh token' });
      return;
    }

    const { userId, jti } = decoded;
    const stored = await RefreshToken.findOne({ tokenId: jti, userId }).lean();
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      res
        .status(401)
        .json({ success: false, message: 'Refresh token is not valid' });
      return;
    }

    // Verify the provided token matches stored hash
    const match = await bcrypt.compare(provided, stored.tokenHash);
    if (!match) {
      res
        .status(401)
        .json({ success: false, message: 'Refresh token mismatch' });
      return;
    }

    // Rotate: revoke old, issue new
    await RefreshToken.updateOne({ tokenId: jti }, { $set: { revoked: true } });

    const user = await AuthUser.findOne({ userId, isActive: true }).lean();
    if (!user) {
      res
        .status(401)
        .json({ success: false, message: 'User not found or inactive' });
      return;
    }

    const tokens = await generateTokens({
      userId: user.userId,
      email: user.email,
      role: user.role,
    });
    res
      .status(200)
      .json({ success: true, message: 'Token refreshed', data: tokens });
  } catch (error: any) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
