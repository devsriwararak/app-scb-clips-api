// import { NextFunction } from "express";
// import { decode } from "jsonwebtoken";

// export const logTokenPayload : RequestHandler = (req: Request, res: Response, next: NextFunction) => {
//   // FIX: เปลี่ยนวิธีการเข้าถึง header เพื่อให้เข้ากันได้กับ TypeScript
// // const authHeader = req.get('authorization');
// const authHeader = req.headers.authorization;
//   const token = authHeader && authHeader.split(" ")[1];

//   if (token) {
//     try {
//       const decodedPayload = decode(token);
//       console.log('--- DECODED TOKEN PAYLOAD (FOR DEBUGGING) ---');
//       console.log(decodedPayload);
//       console.log('--------------------------------------------');
//     } catch (error) {
//       console.error('Could not decode token for debugging:', error);
//     }
//   } else {
//     console.log('No token found in Authorization header.');
//   }
//   next(); // ส่งต่อไปให้ checkJwt ทำงาน
// };
