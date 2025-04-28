import { Request, RequestHandler } from "express";
import jwt from "jsonwebtoken"

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET 
if(!ACCESS_TOKEN_SECRET) {
  throw new Error("ACCESS_TOKEN_SECRET not set in environment variables")
}

interface JwtPayload {
    userId : number
    role : string
}

export interface AuthenticatedRequest extends Request {
    user? : JwtPayload
}

export const authenticateToken: RequestHandler = (req:AuthenticatedRequest, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({ message: "ไม่พบ Token" });
      return; 
    }
  
    try {
      const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as JwtPayload;
      req.user = decoded
      next();
    } catch (err) {
      res.status(401).json({ message: "Token ไม่ถูกต้อง" });
      return; 
    }
  };