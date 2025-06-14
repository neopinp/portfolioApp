import { Response, NextFunction, RequestHandler } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { authConfig } from '../config/auth';
import { AuthenticatedRequest } from '../types/auth';

interface JwtUser extends JwtPayload {
    id: string;
    email: string;
    username: string;
}

export const verifyToken: RequestHandler = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {
    const bearerHeader = req.headers.authorization;
    
    if (!bearerHeader) {
        res.status(401).json({ error: 'No token provided' });
        return;
    }

    const token = bearerHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Invalid token format' });
        return;
    }

    try {
        const decoded = jwt.verify(token, authConfig.jwtSecret) as JwtUser;
        // Ensure the decoded token has the required fields
        if (!decoded.id || !decoded.email) {
            res.status(401).json({ error: 'Invalid token payload' });
            return;
        }
        req.user = decoded;
        next();
    } catch (err) {
        console.error('Token verification error:', err);
        res.status(401).json({ error: 'Invalid token' });
    }
};
