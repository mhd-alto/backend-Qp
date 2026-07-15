export type AccessTokenPayload = {
  sub: string;
  role: string;
  status: string;
  type: 'access';
  iat: number;
  exp: number;
};

export type RefreshTokenPayload = {
  sub: string;
  sid: string;
  type: 'refresh';
  iat: number;
  exp: number;
};

export type IssuedAccessToken = {
  token: string;
  expiresInSeconds: number;
};

export type IssuedRefreshToken = {
  token: string;
  expiresAt: Date;
};

export interface TokenService {
  issueAccessToken(input: {
    userId: string;
    platformRole: string;
    status: string;
  }): IssuedAccessToken;
  issueRefreshToken(input: { userId: string; sessionId: string }): IssuedRefreshToken;
  verifyRefreshToken(token: string): RefreshTokenPayload;
  verifyAccessToken(token: string): AccessTokenPayload;
}

export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');
