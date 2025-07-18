// import { NextFunction, Request, Response } from "express";


// export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
//     console.error(err.stack);
//     res.status(500).json({message : err.message || "Internal Server Error"})
// }

// /src/middlewares/error.middleware.ts


// file: src/middlewares/error.middleware.ts
import { NextFunction, Request, Response } from "express";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.name === 'UnauthorizedError') {
    // Log error ที่ละเอียดขึ้นเพื่อดูสาเหตุที่แท้จริง
    console.error('UnauthorizedError:', err.message); 
    res.status(401).json({ 
        message: 'Token ไม่ถูกต้องหรือหมดอายุ',
        error_code: err.code, // เช่น 'invalid_token', 'credentials_required'
        error_message: err.message // เช่น 'jwt expired', 'invalid signature'
    });
  } else {
    next(err);
  }
}