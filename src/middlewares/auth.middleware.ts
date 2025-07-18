// import { Request, RequestHandler } from "express";
// import jwt from "jsonwebtoken"

// const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET 
// if(!ACCESS_TOKEN_SECRET) {
//   throw new Error("ACCESS_TOKEN_SECRET not set in environment variables")
// }

// interface JwtPayload {
//     userId : number
//     role : string
// }

// export interface AuthenticatedRequest extends Request {
//     user? : JwtPayload
// }

// export const authenticateToken: RequestHandler = (req:AuthenticatedRequest, res, next) => {
//     const authHeader = req.headers.authorization;
//     const token = authHeader && authHeader.split(" ")[1];

//     if (!token) {
//       res.status(401).json({ message: "ไม่พบ Token" });
//       return; 
//     }
  
//     try {
//       const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as JwtPayload;
//       req.user = decoded
//       next();
//     } catch (err) {
//       res.status(401).json({ message: "Token ไม่ถูกต้อง" });
//       return; 
//     }
//   };


// file: src/middlewares/auth.middleware.ts
import { expressjwt as jwt } from 'express-jwt';
import jwksRsa from 'jwks-rsa';

// ตรวจสอบว่ามี Environment Variables ครบถ้วนหรือไม่
if (!process.env.AZURE_AD_TENANT_ID || !process.env.AZURE_AD_CLIENT_ID) {
  throw new Error("Missing Azure AD environment variables. Please check your .env file.");
}

// --- การตั้งค่า Audience ---
// ดึง Application ID URI จาก environment variable เพื่อความยืดหยุ่น
// ค่านี้คือค่าที่คุณตั้งใน "Expose an API" ของ Azure AD เช่น api://<your-client-id>
const apiAudience = process.env.AZURE_API_AUDIENCE!;

// --- FIX: การตั้งค่า Issuer ---
// สร้าง Array ของ Issuer ที่ยอมรับได้ เพื่อรองรับทั้ง Token v1.0 และ v2.0
// ซึ่งเป็นสาเหตุของข้อผิดพลาด "jwt issuer invalid"
const validIssuers = [
  `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`, // v2.0 issuer
  `https://sts.windows.net/${process.env.AZURE_AD_TENANT_ID}/` // v1.0 issuer
];


export const authenticateToken = jwt({
  // ดึง Public Key จาก Microsoft เพื่อถอดรหัสและตรวจสอบลายเซ็น (Signature) ของ JWT
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    // ใช้ jwksUri สำหรับ v2.0 endpoint และระบุ tenant id ให้ถูกต้อง
    jwksUri: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/discovery/v2.0/keys`
  }),

  // ระบุ Audience ที่คาดหวัง (Token นี้ต้องออกให้สำหรับ API ของเรา)
  // ใช้ค่าจาก App ID URI ที่เราตั้งค่าไว้ และเพิ่ม Client ID เป็นอีกหนึ่งตัวเลือก
  audience: [apiAudience, process.env.AZURE_AD_CLIENT_ID!],
  
  // ระบุ Issuer ที่คาดหวัง (Token นี้ต้องออกโดย Azure AD tenant ของเรา)
  // FIX: เปลี่ยนไปใช้ Array ของ Issuer ที่ถูกต้อง
  issuer: validIssuers,
  
  // ระบุ Algorithm ที่ใช้
  algorithms: ['RS256']
});