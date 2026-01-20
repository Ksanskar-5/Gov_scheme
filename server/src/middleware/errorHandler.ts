import { Request, Response, NextFunction } from 'express';

// ============================================
// Error Handler Middleware
// ============================================

export interface ApiError extends Error {
    statusCode?: number;
    code?: string;
}

export function errorHandler(
    err: ApiError,
    _req: Request,
    res: Response,
    _next: NextFunction
) {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        error: message,
        code: err.code,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
}

// ============================================
// Not Found Handler
// ============================================

export function notFoundHandler(req: Request, res: Response) {
    res.status(404).json({
        success: false,
        error: `Not Found - ${req.originalUrl}`,
    });
}

// ============================================
// Request Logger
// ============================================

export function requestLogger(
    req: Request,
    _res: Response,
    next: NextFunction
) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
}

// ============================================
// Async Handler Wrapper
// ============================================

export function asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
