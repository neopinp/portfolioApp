/* 
AUTH CHECKING FOR ACCESS 
verifying that the generated token is associated with the header of the user's request 
*/
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../types/auth";

import jwt from "jsonwebtoken";

const verifyToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "No token found" });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET not set");
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded as { id: number; email: string; username: string };
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid or expired token" });
    return;
  }
};

export default verifyToken;
