import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

export interface UserCredentials {
  email: string;
  password: string;
  username: string;
}

export interface LoginCredentials {
  emailorUsername: string;
  password: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
}

export interface JwtUser extends JwtPayload {
  id: string;
  email: string;
  username: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtUser;
}
