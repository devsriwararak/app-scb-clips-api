import { Request, Response } from "express";
import prisma from "../config/db";

// export const getUsers = async(req:Request, res:Response)=>{
//     const users = await userService.getUsers()
//     res.json(users)
// }

export const getUsers = async(req:Request, res:Response)=>{
try {
    const result = await prisma.user.findMany()
    return res.status(200).json(result)
    
} catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error", error });
}
}