import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if user has admin or host role
 */
export const requireAdminOrHost = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const user = (req as any).jwtUser;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const { role } = user;

    if (role !== 'admin' && role !== 'host') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin or Host role required.',
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Authorization check failed',
    });
  }
};

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const user = (req as any).jwtUser;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const { role } = user;

    if (role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Authorization check failed',
    });
  }
};
