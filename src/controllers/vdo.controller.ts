import { Request, Response } from "express";
import prisma from "../config/db";
import { Prisma } from "@prisma/client"
import fs from "fs";
import path from "path";
import { createFtpClient } from "../config/ftpClient";
import { sanitizeFilename } from "../utils/tools";


export const getAllVideos = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 5
        const search = (req.query.search as string) || ""

        const where: Prisma.VideoWhereInput = search
            ? {
                name: {
                    contains: search,
                    mode: 'insensitive',
                },
            }
            : {}

        const [data, totalItems] = await Promise.all([
            prisma.video.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            prisma.video.count({ where })
        ])

        const result = {
            data,
            pagination: {
                page,
                totalPage: Math.ceil(totalItems / limit),
                totalItems
            }
        }
        return res.status(200).json(result)

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
}

export const uploadVideo = async (req: Request, res: Response) => {
    try {
        const file = req.file;
        const { detail, name, timeAdvert } = req.body

        console.log(req.body);
        

        // ทำไมเข้าเงื่อนไขนี้ แต่รูปยังถูกส่งไป FTP อยู่เลย
        if (!file || !name?.trim()) {
            if (file) fs.unlinkSync(file.path);
            return res.status(400).json({ error: "No file uploaded or name missing" });
        }

        //Check ซ้ำ
        const checkSql = await prisma.video.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: "insensitive"
                }
            }
        })

        if (checkSql) return res.status(400).json({ message: "มีข้อมูลนี้แล้วในระบบ กรุณาเพิ่มชื่อใหม่" })


        const filePath = file.path;
        const originalName = file.originalname;
        const safeName = sanitizeFilename(originalName)
        const remotePath = `/videos/${Date.now()}_${safeName}`;

        const client = await createFtpClient();
        await client.uploadFrom(filePath, remotePath);
        await client.close();

        fs.unlinkSync(filePath);

        try {
            const video = await prisma.video.create({
                data: {
                    name: name,
                    filePath: remotePath,
                    detail: detail || "",
                    timeAdvert : Number(timeAdvert) || 0
                },
            });
            return res.json({ success: true, video });
        } catch (dbError) {
            const rollbackClient = await createFtpClient();
            await rollbackClient.remove(remotePath);
            await rollbackClient.close();

            return res.status(409).json({ error: "Video name already exists or DB error." });
        }

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Upload failed" });
    }
}


export const updateVideo = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, detail, timeAdvert } = req.body;
        const file = req.file;

        const existing = await prisma.video.findUnique({ where: { id: Number(id) } });
        if (!existing) return res.status(404).json({ error: "Video not found" });

        let newFilePath = existing.filePath;

        if (file) {
            const filePath = file.path;
            const originalName = file.originalname;
            newFilePath = `/videos/${Date.now()}_${originalName}`;

            const client = await createFtpClient();
            // ลบไฟล์เก่าออกจาก FTP
            await client.remove(existing.filePath);
            // อัปโหลดไฟล์ใหม่
            await client.uploadFrom(filePath, newFilePath);
            await client.close();

            fs.unlinkSync(filePath); // ลบ tmp
        }

        const updated = await prisma.video.update({
            where: { id: Number(id) },
            data: {
                name: name?.trim(),
                detail: detail || "",
                filePath: newFilePath , 
                timeAdvert : Number(timeAdvert) || 0
            },
        });

        return res.status(200).json({ success: true, video: updated });


    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to update video" });
    }
}

export const deleteVideo = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {

        const video = await prisma.video.findUnique({ where: { id: Number(id) } });
        if (!video) return res.status(404).json({ error: "ไม่พบวีดีโอ ไม่สามารถลบได้" });

        // ลบไฟล์จาก FTP
        try {
            const client = await createFtpClient();
            await client.remove(video.filePath);
            await client.close();
        } catch (ftpError) {
            console.warn(" ไม่สามารถลบไฟล์ FTP (อาจไม่มีอยู่):", ftpError);
        }

        // ลบข้อมูลจาก DB
        await prisma.video.delete({ where: { id: Number(id) } });

        return res.status(200).json({ success: true, message: "Video deleted" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to update video" });
    }
}