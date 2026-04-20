import { Router, Request, Response } from 'express';
import { prisma } from '../config/db';

const router = Router();

// Test database connection
router.get('/test-db', async (req: Request, res: Response) => {
  try {
    // Test basic connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Test if we can access the users table
    const userCount = await prisma.users.count();
    
    res.json({ 
      success: true, 
      message: "Database connected successfully",
      details: {
        connection: "OK",
        usersTable: "OK",
        userCount: userCount
      }
    });
  } catch (err: unknown) {
    console.error('Database test failed:', err);
    if (err instanceof Error) {
      res.status(500).json({ 
        success: false, 
        error: err.message,
        details: "Database connection failed"
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: "Unknown error",
        details: "Database connection failed"
      });
    }
  }
});

export default router; 