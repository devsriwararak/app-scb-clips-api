import { Request, Response } from "express";
import prisma from "../config/db";
import bcrypt from 'bcryptjs'
import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler";
import { checkExpiredCertificates } from "../utils/tools";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;

const generateAccessToken = (userId: number, role: string) => {
    return jwt.sign({ userId, role }, ACCESS_TOKEN_SECRET, { expiresIn: "2m" })
}

const generateRefreshToken = (userId: number, role: string) => {
    return jwt.sign({ userId, role }, REFRESH_TOKEN_SECRET, { expiresIn: "7d" })
}

export const registerTest = async (req: Request, res: Response) => {
    try {
        const { name, username, password, role } = req.body
        const checkUser = await prisma.user.findUnique({ where: { username } })
        if (checkUser) return res.status(400).json({ message: 'มี Username นี้แล้ว !' })

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: {
                name,
                username,
                password: hashedPassword,
                role: role || "USER"
            }
        })

        res.status(201).json({ message: "สร้างสำเร็จ", user })

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error", error });

    }
}



export const login = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body

        const user = await prisma.user.findUnique({ where: { username } })
        if (!user) return res.status(400).json({ message: "ไม่พบผู้ใช้งาน" })

        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) return res.status(400).json({ message: "รหัสผ่านไม่ถูกต้อง" })

        const accessToken = generateAccessToken(user.id, user.role)
        const refreshToken = generateRefreshToken(user.id, user.role)

        // บันทึก refresh token
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 วัน
            }
        })

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' && req.hostname !== 'localhost' ? true : false,
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        await checkExpiredCertificates()
        
        return res.json({
            id: user.id,
            username: user.username,
            role: user.role,
            accessToken
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
}



export const refreshTokene = async (req: Request, res: Response) => {
    const token = req.cookies.refreshToken

    if (!token) return res.status(401).json({ message: "ไม่พบ refresh token" });

    const storedToken = await prisma.refreshToken.findUnique({ where: { token } })
    if (!storedToken) return res.status(403).json({ message: "refresh token ไม่ถูกต้อง" });

    try {
        //ลบ token เก่า
        const payload = jwt.verify(token, REFRESH_TOKEN_SECRET) as { userId: number, role: string }
        await prisma.refreshToken.delete({ where: { token } })

        //สร้าง refresh token ใหม่
        const newRefreshToken = generateRefreshToken(payload.userId, payload.role)

        await prisma.refreshToken.create({
            data: {
                token: newRefreshToken,
                userId: payload.userId,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            }
        })

        const accessToken = generateAccessToken(payload.userId, payload.role)

        // set cookie ใหม่
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' && req.hostname !== 'localhost' ? true : false,
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })

        return res.json({ accessToken });

    } catch (error) {
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' && req.hostname !== 'localhost' ? true : false,
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        });
        return res.status(403).json({ message: "Refresh token หมดอายุ หรือไม่ถูกต้อง" });
    }
}


export const logout = async (req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies.refreshToken

        if (!refreshToken) return res.status(400).json({ message: "ไม่พบ refresh token" });

        // ลบ refresh token ออกจาก database
        await prisma.refreshToken.deleteMany({
            where: { token: refreshToken }
        })

        // clear cookie
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' && req.hostname !== 'localhost' ? true : false,
            sameSite: 'strict',
        })
        return res.status(200).json({ message: "Logout success" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export const varidateMember = async(req: Request, res: Response)=> {
    const {email} = req.body
    try {
        if(!email) return res.status(400).json({message : "ส่งข้อมูลไม่ครบ"})

        const checkUser = await prisma.user.findFirst({where: {email}})
        if (!checkUser) return res.status(400).json({ message: 'ไม่พบ Email นี้ในระบบ' })
            
        return res.status(200).json({message : "success"})

        
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
    
}