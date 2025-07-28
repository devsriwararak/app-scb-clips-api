"use strict";
// import { NextFunction, Request, Response } from "express";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        // Log error ที่ละเอียดขึ้นเพื่อดูสาเหตุที่แท้จริง
        console.error('UnauthorizedError:', err.message);
        res.status(401).json({
            message: 'Token ไม่ถูกต้องหรือหมดอายุ',
            error_code: err.code, // เช่น 'invalid_token', 'credentials_required'
            error_message: err.message // เช่น 'jwt expired', 'invalid signature'
        });
    }
    else {
        next(err);
    }
};
exports.errorHandler = errorHandler;
