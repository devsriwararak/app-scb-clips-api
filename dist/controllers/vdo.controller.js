"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndStreamVideo = exports.streamVideo = exports.getSecureVideos = exports.deleteVideo = exports.updateVideo = exports.uploadVideo = exports.getAllVideos = void 0;
const db_1 = __importDefault(require("../config/db"));
const fs_1 = __importDefault(require("fs"));
const ftpClient_1 = require("../config/ftpClient");
const tools_1 = require("../utils/tools");
const getAllVideos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const search = req.query.search || "";
        const where = search
            ? {
                name: {
                    contains: search,
                    mode: 'insensitive',
                },
            }
            : {};
        const [data, totalItems] = yield Promise.all([
            db_1.default.video.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            db_1.default.video.count({ where })
        ]);
        const result = {
            data,
            pagination: {
                page,
                totalPage: Math.ceil(totalItems / limit),
                totalItems
            }
        };
        return res.status(200).json(result);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
});
exports.getAllVideos = getAllVideos;
const uploadVideo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const file = req.file;
        const { detail, name, timeAdvert } = req.body;
        console.log(req.body);
        // ทำไมเข้าเงื่อนไขนี้ แต่รูปยังถูกส่งไป FTP อยู่เลย
        if (!file || !(name === null || name === void 0 ? void 0 : name.trim())) {
            if (file)
                fs_1.default.unlinkSync(file.path);
            return res.status(400).json({ error: "No file uploaded or name missing" });
        }
        //Check ซ้ำ
        const checkSql = yield db_1.default.video.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: "insensitive"
                }
            }
        });
        if (checkSql)
            return res.status(400).json({ message: "มีข้อมูลนี้แล้วในระบบ กรุณาเพิ่มชื่อใหม่" });
        const filePath = file.path;
        const originalName = file.originalname;
        const safeName = (0, tools_1.sanitizeFilename)(originalName);
        const remotePath = `/videos/${Date.now()}_${safeName}`;
        const client = yield (0, ftpClient_1.createFtpClient)();
        yield client.uploadFrom(filePath, remotePath);
        yield client.close();
        fs_1.default.unlinkSync(filePath);
        try {
            const video = yield db_1.default.video.create({
                data: {
                    name: name,
                    filePath: remotePath,
                    detail: detail || "",
                    timeAdvert: Number(timeAdvert) || 0
                },
            });
            return res.json({ success: true, video });
        }
        catch (dbError) {
            const rollbackClient = yield (0, ftpClient_1.createFtpClient)();
            yield rollbackClient.remove(remotePath);
            yield rollbackClient.close();
            return res.status(409).json({ error: "Video name already exists or DB error." });
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Upload failed" });
    }
});
exports.uploadVideo = uploadVideo;
const updateVideo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, detail, timeAdvert } = req.body;
        const file = req.file;
        const existing = yield db_1.default.video.findUnique({ where: { id: Number(id) } });
        if (!existing)
            return res.status(404).json({ error: "Video not found" });
        let newFilePath = existing.filePath;
        if (file) {
            const filePath = file.path;
            const originalName = file.originalname;
            newFilePath = `/videos/${Date.now()}_${originalName}`;
            const client = yield (0, ftpClient_1.createFtpClient)();
            // ลบไฟล์เก่าออกจาก FTP
            yield client.remove(existing.filePath);
            // อัปโหลดไฟล์ใหม่
            yield client.uploadFrom(filePath, newFilePath);
            yield client.close();
            fs_1.default.unlinkSync(filePath); // ลบ tmp
        }
        const updated = yield db_1.default.video.update({
            where: { id: Number(id) },
            data: {
                name: name === null || name === void 0 ? void 0 : name.trim(),
                detail: detail || "",
                filePath: newFilePath,
                timeAdvert: Number(timeAdvert) || 0
            },
        });
        return res.status(200).json({ success: true, video: updated });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to update video" });
    }
});
exports.updateVideo = updateVideo;
const deleteVideo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const video = yield db_1.default.video.findUnique({ where: { id: Number(id) } });
        if (!video)
            return res.status(404).json({ error: "ไม่พบวีดีโอ ไม่สามารถลบได้" });
        // ลบไฟล์จาก FTP
        try {
            const client = yield (0, ftpClient_1.createFtpClient)();
            yield client.remove(video.filePath);
            yield client.close();
        }
        catch (ftpError) {
            console.warn(" ไม่สามารถลบไฟล์ FTP (อาจไม่มีอยู่):", ftpError);
        }
        // ลบข้อมูลจาก DB
        yield db_1.default.video.delete({ where: { id: Number(id) } });
        return res.status(200).json({ success: true, message: "Video deleted" });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Failed to update video" });
    }
});
exports.deleteVideo = deleteVideo;
// Check Id card
const getSecureVideos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const idCard = req.body.idCard;
        if (!idCard || idCard.length !== 13) {
            return res.status(400).json({ message: "กรุณาระบุเลขบัตรประชาชน" });
        }
        // Check idCard
        const checkIdCard = yield db_1.default.member.findFirst({ where: { idCard } });
        if (!checkIdCard)
            return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึงวิดีโอ !!" });
        // load video
        const videos = yield db_1.default.video.findMany({
            orderBy: { createdAt: "desc" }
        });
        const result = yield Promise.all(videos.map((video) => __awaiter(void 0, void 0, void 0, function* () {
            const token = yield (0, tools_1.generateSecureToken)(idCard, video.filePath);
            return {
                name: video.name,
                filePath: `/api/vdo/stream?file=${encodeURIComponent(video.filePath)}&token=${token}&idCard=${idCard}`,
                detail: video.detail,
                timeAdvert: video.timeAdvert
            };
        })));
        return res.status(200).json({ data: result });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json(error);
    }
});
exports.getSecureVideos = getSecureVideos;
// Stream video
const streamVideo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield (0, ftpClient_1.createFtpClient)();
    try {
        const { file, token, idCard } = req.query;
        if (!file || !token || !idCard) {
            return res.status(400).send('ข้อมูลไม่ครบ');
        }
        const tokenRecord = yield db_1.default.videoToken.findUnique({ where: { token } });
        if (!tokenRecord)
            return res.status(403).send("ไม่พบ token");
        if (tokenRecord.used)
            return res.status(403).send("token นี้ถูกใช้งานไปแล้ว");
        if (tokenRecord.idCard !== idCard)
            return res.status(403).send("idCard ไม่ตรง");
        if (new Date() > tokenRecord.expiresAt)
            return res.status(403).send("token หมดอายุ");
        // res.setHeader("Content-Type", "video/mp4")
        // await client.downloadTo(res, file)
        // console.log("Range request:", req.headers.range)
        // // อัปเดต token ว่าใช้แล้ว
        // await prisma.videoToken.update({
        //     where: { token },
        //     data: { used: true },
        // })
        res.setHeader("Content-Type", "video/mp4");
        res.setHeader("Accept-Ranges", "bytes"); // helps with Safari
        res.setHeader("Cache-Control", "no-cache");
        client.downloadTo(res, file)
            .then(() => __awaiter(void 0, void 0, void 0, function* () {
            yield db_1.default.videoToken.update({
                where: { token },
                data: { used: true },
            });
            client.close();
        }))
            .catch((err) => {
            console.error("Download error:", err);
            if (!res.headersSent) {
                res.status(500).send("เกิดข้อผิดพลาดระหว่างโหลดวิดีโอ");
            }
            client.close();
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json(error);
        client.close();
    }
});
exports.streamVideo = streamVideo;
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
const EndStreamVideo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { idCard } = req.body;
        console.log({ idCard });
        yield db_1.default.member.update({ data: { statusVideoEnd: 1 }, where: { idCard } });
        return res.status(200).json({ message: 'success' });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json(error);
    }
});
exports.EndStreamVideo = EndStreamVideo;
