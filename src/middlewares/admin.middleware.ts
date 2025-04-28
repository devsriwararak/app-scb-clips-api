
import { NextFunction, Request, RequestHandler, Response } from "express";

interface AuthenticatedRequest extends Request {
    user? : {
        userId: number
        role : string
    }
}

export const isAdmin : RequestHandler = (req, res, next)=> {
    const role = (req as AuthenticatedRequest).user?.role
    if(role !== "ADMIN"){
         res.status(403).json({message : 'สำหรับผู้ดูแลระบบเท่านั้น (Admin Only)'})
         return
    }
    next()
}

