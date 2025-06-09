import { Request, Response } from "express";
import prisma from "../config/db";
import { Prisma } from "@prisma/client"
import fs from "fs";
import { createFtpClient } from "../config/ftpClient";
import { generateSecureToken, generateToken, sanitizeFilename } from "../utils/tools";
import path from "path";
import { promises as fsPromises } from 'fs'
import { tmpdir } from "os";
import { v4 as uuidv4 } from "uuid";
import { promisify } from "util";
import tmp from "tmp-promise"
import crypto from "crypto"






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
                    timeAdvert: Number(timeAdvert) || 0
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
                filePath: newFilePath,
                timeAdvert: Number(timeAdvert) || 0
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

// Check Id card
export const getSecureVideos = async (req: Request, res: Response) => {
    try {
        const idCard = req.body.idCard as string;
        if (!idCard || (idCard.length !== 13 && idCard.length !== 8)) {
            return res.status(400).json({ message: "กรุณาระบุเลขบัตรประชาชน" })
        }
        // Check idCard
        const checkIdCard = await prisma.member.findFirst({ where: { idCard } })
        if (!checkIdCard) return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึงวิดีโอ !!" })

        // load video
        const videos = await prisma.video.findMany({
            orderBy: { createdAt: "desc" }
        })

        const result = await Promise.all(
            videos.map(async (video) => {
                const token = await generateSecureToken(idCard, video.filePath)
                return {
                    name: video.name,
                    filePath: `/api/vdo/stream?file=${encodeURIComponent(video.filePath)}&token=${token}&idCard=${idCard}`,
                    detail: video.detail,
                    timeAdvert: video.timeAdvert
                }
            })
        )

        return res.status(200).json({ data: result })

    } catch (error) {
        console.log(error);
        return res.status(500).json(error);
    }
}

// Stream video

// export const streamVideo = async (req: Request, res: Response) => {
//   const client = await createFtpClient()

//   try {
//     const { file, token, idCard } = req.query as Record<string, string>
//     // ตรวจสอบเหมือนเดิม...

//     // สร้าง temp file
//     const tmpFile = await tmp.file()
//     await client.downloadTo(tmpFile.path, file)
//     client.close()

//     const stat = await promisify(fs.stat)(tmpFile.path)
//     const range = req.headers.range

//     const total = stat.size

//     if (range) {
//       const parts = range.replace(/bytes=/, "").split("-")
//       const start = parseInt(parts[0], 10)
//       const end = parts[1] ? parseInt(parts[1], 10) : total - 1

//       const chunksize = end - start + 1
//       const fileStream = fs.createReadStream(tmpFile.path, { start, end })

//       res.writeHead(206, {
//         "Content-Range": `bytes ${start}-${end}/${total}`,
//         "Accept-Ranges": "bytes",
//         "Content-Length": chunksize,
//         "Content-Type": "video/mp4",
//       })

//       fileStream.pipe(res)
//     } else {
//       res.writeHead(200, {
//         "Content-Length": total,
//         "Content-Type": "video/mp4",
//       })
//       fs.createReadStream(tmpFile.path).pipe(res)
//     }

//     // ทำ token used ทีหลังเมื่อ stream เสร็จ
//     res.on("close", async () => {
//       await prisma.videoToken.update({
//         where: { token },
//         data: { used: true },
//       })
//     })
//   } catch (err) {
//     console.error("Video stream error", err)
//     res.status(500).send("เกิดข้อผิดพลาดในการโหลดวิดีโอ")
//     client.close()
//   }
// }

const tempDir = path.resolve(__dirname, "../tmp_videos_cache") // โฟลเดอร์เก็บ cache

// สร้างโฟลเดอร์ถ้ายังไม่มี
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true })
}

// ฟังก์ชันสร้างชื่อไฟล์ temp cache จากชื่อไฟล์ FTP (หรือ file path)
function getCacheFilePath(fileName: string) {
  // ใช้ hash ของชื่อไฟล์เพื่อไม่ให้ชื่อซ้ำ/ผิด
  const hash = crypto.createHash("md5").update(fileName).digest("hex")
  return path.join(tempDir, `${hash}.mp4`)
}


export const streamVideo = async (req: Request, res: Response) => {
  const client = await createFtpClient()

  try {
    const { file, token, idCard } = req.query as Record<string, string>

    // ตรวจสอบ token, idCard ตามที่คุณมี (ไม่แสดงตรงนี้)

    // กำหนด path ไฟล์ temp cache
    const cachedFilePath = getCacheFilePath(file)

    // เช็คว่าไฟล์ temp นี้มีอยู่หรือยัง
    const fileExists = fs.existsSync(cachedFilePath)

    if (!fileExists) {
      // ถ้ายังไม่มีใน cache ดาวน์โหลดไฟล์จาก FTP
      await client.downloadTo(cachedFilePath, file)
    }
    client.close()

    const stat = await promisify(fs.stat)(cachedFilePath)
    const total = stat.size
    const range = req.headers.range

    if (range) {
      // รองรับ HTTP Range
      const parts = range.replace(/bytes=/, "").split("-")
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : total - 1
      const chunksize = end - start + 1

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${total}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": "video/mp4",
      })

      const fileStream = fs.createReadStream(cachedFilePath, { start, end })
      fileStream.pipe(res)
    } else {
      // ส่งไฟล์ทั้งหมด
      res.writeHead(200, {
        "Content-Length": total,
        "Content-Type": "video/mp4",
      })

      const fileStream = fs.createReadStream(cachedFilePath)
      fileStream.pipe(res)
    }

    // ทำ token used ทีหลังเมื่อ stream เสร็จ
    res.on("close", async () => {
      await prisma.videoToken.update({
        where: { token },
        data: { used: true },
      })
    })
  } catch (err) {
    console.error("Video stream error", err)
    res.status(500).send("เกิดข้อผิดพลาดในการโหลดวิดีโอ")
    client.close()
  }
}

// export const streamVideo = async (req: Request, res: Response) => {
//     const client = await createFtpClient();
//     const { file, token, idCard } = req.query as Record<string, string>;

//     if (!file || !token || !idCard) {
//         return res.status(400).send("ข้อมูลไม่ครบ");
//     }

//     try {
//         const tokenRecord = await prisma.videoToken.findUnique({ where: { token } });

//         if (!tokenRecord) return res.status(403).send("ไม่พบ token");
//         // if (tokenRecord.used) return res.status(403).send("token นี้ถูกใช้งานไปแล้ว");
//         if (tokenRecord.idCard !== idCard) return res.status(403).send("idCard ไม่ตรง");
//         if (new Date() > tokenRecord.expiresAt) return res.status(403).send("token หมดอายุ");

//         // สร้าง temp path สำหรับเก็บวิดีโอ
//         const tempFile = path.join(tmpdir(), `${uuidv4()}.mp4`);
//         await client.downloadTo(tempFile, file);
//         client.close();

//         const stat = fs.statSync(tempFile);
//         const total = stat.size;
//         const range = req.headers.range;

//         if (!range) {
//             res.writeHead(200, {
//                 "Content-Length": total,
//                 "Content-Type": "video/mp4",
//                 "Accept-Ranges": "bytes",
//                 "Cache-Control": "no-cache",
//             });
//             fs.createReadStream(tempFile)
//                 .pipe(res)
//                 .on("close", async () => {
//                     await prisma.videoToken.update({ where: { token }, data: { used: true } });
//                     fs.unlink(tempFile, () => {});
//                 });
//         } else {
//             const parts = range.replace(/bytes=/, "").split("-");
//             const start = parseInt(parts[0], 10);
//             const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
//             const chunkSize = end - start + 1;

//             const fileStream = fs.createReadStream(tempFile, { start, end });

//             res.writeHead(206, {
//                 "Content-Range": `bytes ${start}-${end}/${total}`,
//                 "Accept-Ranges": "bytes",
//                 "Content-Length": chunkSize,
//                 "Content-Type": "video/mp4",
//                 "Cache-Control": "no-cache",
//             });

//             fileStream
//                 .pipe(res)
//                 .on("close", async () => {
//                     await prisma.videoToken.update({ where: { token }, data: { used: true } });
//                     fs.unlink(tempFile, () => {});
//                 });
//         }
//     } catch (error) {
//         console.error("streamVideo error:", error);
//         if (!res.headersSent) {
//             res.status(500).send("เกิดข้อผิดพลาดระหว่างโหลดวิดีโอ");
//         }
//         client.close();
//     }
// };

export const EndStreamVideo = async (req: Request, res: Response) => {
    try {
        const { idCard } = req.body
        console.log({ idCard });
        await prisma.member.update({ data: { statusVideoEnd: 1 }, where: { idCard } })

        return res.status(200).json({ message: 'success' })

    } catch (error) {
        console.log(error);
        return res.status(500).json(error);
    }
}

