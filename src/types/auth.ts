// src/types/auth.ts
import { Request } from "express";
// extend to accept user 

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    username: string;
  };
}
