// TYPES
import { Request, Response, NextFunction } from 'express';

export function TimeoutMiddleware (timeout: number) {
    return (req: Request, res: Response, next: NextFunction) => {
      res.setTimeout(timeout, () => {
        res.status(408).send('Request Timeout');
      });
      
      next();
    };
};