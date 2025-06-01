// src/types/auth.ts
import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    username: string;
  };
}
