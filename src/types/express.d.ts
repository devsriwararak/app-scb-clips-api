// types/express.d.ts

import { JwtPayload } from 'express-jwt';

// บอกให้ TypeScript รู้ว่าในโปรเจกต์นี้
// ออบเจ็กต์ Request ของ Express จะมี property 'auth' เพิ่มเข้ามาได้
declare global {
  namespace Express {
    export interface Request {
      auth?: JwtPayload;
    }
  }
}