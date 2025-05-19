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
exports.checkExpiredCertificates = exports.generateSecureToken = exports.generateToken = exports.expiresAt = exports.sanitizeFilename = void 0;
exports.generatePdf = generatePdf;
const crypto_1 = __importDefault(require("crypto"));
const db_1 = __importDefault(require("../config/db"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const ejs_1 = __importDefault(require("ejs"));
const sanitizeFilename = (filename) => {
    return filename.replace(/[^a-zA-Z0-9_.-]/g, "_");
};
exports.sanitizeFilename = sanitizeFilename;
const expiresAt = () => {
    const limit = Math.floor(Date.now() / 1000) + 60;
    return limit;
};
exports.expiresAt = expiresAt;
const generateToken = (idCard, filePath, expiresAt) => {
    const secret = process.env.STREAM_SECRET || "mysecret";
    const raw = `${idCard}|${filePath}|${expiresAt}|${secret}`;
    return crypto_1.default.createHash("sha256").update(raw).digest("hex");
};
exports.generateToken = generateToken;
const generateSecureToken = (idCard, filePath) => __awaiter(void 0, void 0, void 0, function* () {
    const token = crypto_1.default.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 นาที
    yield db_1.default.videoToken.create({
        data: {
            token,
            filePath,
            idCard,
            expiresAt
        }
    });
    return token;
});
exports.generateSecureToken = generateSecureToken;
// PDF
//check Citificate
const checkExpiredCertificates = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const today = new Date();
        console.log(today);
        const expiredMembers = yield db_1.default.member.findMany({
            where: {
                dateEndCertificate: {
                    lt: today
                }
            },
            select: {
                id: true
            }
        });
        const expiredIds = expiredMembers.map((m) => m.id);
        if (expiredMembers.length > 0) {
            yield db_1.default.member.updateMany({
                where: {
                    id: {
                        in: expiredIds
                    }
                },
                data: {
                    statusVideoEnd: 0,
                    statusQuestionEnd: 0,
                    dateEndCertificate: null,
                    dateOfTraining: null
                }
            });
        }
        return expiredIds.length;
    }
    catch (error) {
        console.error('เกิดข้อผิดพลาด', error);
    }
});
exports.checkExpiredCertificates = checkExpiredCertificates;
// export const generatePdf = async (member: {
//     fname: string
//     lname: string
//     createdAt: Date
// }) => {
//     const pdfDoc = await PDFDocument.create()
//     const page = pdfDoc.addPage([600, 500])
//     // ✅ โหลดฟอนต์ภาษาไทย
//     const fontBytes = fs.readFileSync(path.join(__dirname, 'fonts', 'THSarabunNew.ttf'))
//     const thaiFont = await pdfDoc.embedFont(fontBytes)
//     const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
//     const { width, height } = page.getSize()
//     // 🔹 โหลดโลโก้
//     const logoPath = path.join(__dirname, '../assets/logo.png')
//     const logoBytes = fs.readFileSync(logoPath)
//     const logoImage = await pdfDoc.embedPng(logoBytes)
//     const pageWidth = page.getWidth()
//     const mainBoxX = 20
//     const mainBoxWidth = pageWidth - 40
//     const mainBoxY = 70
//     const mainBoxHeight = height - 120
//     const titleBoxHeight = 30
//     // 🔹 วาดโลโก้มุมซ้ายบน
//     page.drawImage(logoImage, {
//         x: 20,
//         y: height - 40,
//         width: 60,
//         height: 16,
//     })
//     // 🔹 กรอบหลัก (border)
//     page.drawRectangle({
//         x: mainBoxX,
//         y: mainBoxY,
//         width: mainBoxWidth,
//         height: mainBoxHeight,
//         borderColor: rgb(0, 0, 0),
//         borderWidth: 1,
//     })
//     // 🔹 วาดกรอบหัวข้อ พร้อมพื้นหลังเทาอ่อน
//     page.drawRectangle({
//         x: mainBoxX,
//         y: mainBoxY + mainBoxHeight - titleBoxHeight,
//         width: mainBoxWidth,
//         height: titleBoxHeight,
//         color: rgb(0.9, 0.9, 0.9), // พื้นหลังเทาอ่อน
//         // borderColor: rgb(0.6, 0.6, 0.6),
//         borderWidth: 1,
//     })
//     // 🔹 ข้อความหัวข้อใบเซอร์
//     const titleText = 'บริษัทฟินิคซ พัลพ แอนด์ เพเพอร์ จำกัด (มหาชน)'
//     const fontSize = 18
//     const textWidth = thaiFont.widthOfTextAtSize(titleText, fontSize)
//     page.drawText(titleText, {
//         x: mainBoxX + (mainBoxWidth - textWidth) / 2,
//         y: mainBoxY + mainBoxHeight - titleBoxHeight + 12,
//         size: 18,
//         font,
//         color: rgb(0.2, 0.2, 0.2),
//     })
//     // 🔹 ข้อมูลผู้รับ
//     page.drawText(`This certifies that: ${member.fname} ${member.lname}`, {
//         x: 60,
//         y: height - 140,
//         size: 16,
//         font,
//     })
//     page.drawText(`Completed on: ${new Date(member.createdAt).toLocaleDateString()}`, {
//         x: 60,
//         y: height - 160,
//         size: 14,
//         font,
//     })
//     // 🔹 กรอบย่อยซ้าย
//     page.drawRectangle({
//         x: 60,
//         y: height - 280,
//         width: 200,
//         height: 100,
//         borderColor: rgb(0, 0, 0),
//         borderWidth: 1,
//     })
//     page.drawText('Training Details:', {
//         x: 70,
//         y: height - 190,
//         size: 12,
//         font,
//         color: rgb(0.2, 0.2, 0.6),
//     })
//     page.drawText('- Course: Advanced Skills\n- Duration: 3 Days', {
//         x: 70,
//         y: height - 210,
//         size: 11,
//         font,
//         lineHeight: 14,
//     })
//     // 🔹 กรอบย่อยขวา
//     page.drawRectangle({
//         x: width - 260,
//         y: height - 280,
//         width: 200,
//         height: 100,
//         borderColor: rgb(0, 0, 0),
//         borderWidth: 1,
//     })
//     page.drawText('Instructor Notes:', {
//         x: width - 250,
//         y: height - 190,
//         size: 12,
//         font,
//         color: rgb(0.2, 0.2, 0.6),
//     })
//     page.drawText('Great participation\nand excellent scores!', {
//         x: width - 250,
//         y: height - 210,
//         size: 11,
//         font,
//         lineHeight: 14,
//     })
//     return await pdfDoc.save()
// }
// export const generatePdf = (member : any) => {
//   return new Promise((resolve, reject) => {
//     try {
//       const doc = new PDFDocument();
//       const buffers = [] as any;
//       doc.on('data', buffers.push.bind(buffers));
//       doc.on('end', () => {
//         const pdfData = Buffer.concat(buffers);
//         resolve(pdfData);
//       });
//       // โหลดฟอนต์ภาษาไทย
//       const fontPath = path.join(__dirname, 'fonts', 'THSarabunNew.ttf');
//       doc.registerFont('THSarabunNew', fontPath);
//       doc.font('THSarabunNew').fontSize(20).text(`สวัสดีครับคุณ ${member.fname}`);
//       doc.end();
//     } catch (error) {
//       reject(error);
//     }
//   });
// };
const html = `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <title>ใบรับรอง</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="p-10">
  <div class="border-4 border-blue-500 rounded-lg p-8 max-w-xl mx-auto">
    <h1 class="text-3xl font-bold text-center mb-4">ใบรับรอง</h1>
    <p class="text-lg text-center mb-6">สวัสดีครับคุณ <span class="font-semibold text-blue-700">สมชาย</span></p>
    <p class="text-center text-gray-700">ขอแสดงความยินดีที่คุณสอบผ่านและได้รับใบรับรองนี้</p>
  </div>
</body>
</html>
`;
// export const generatePdf = async () => {
//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();
//   // โหลด HTML เข้าหน้าเพจ
//   await page.setContent(html, { waitUntil: 'networkidle0' });
//   // สร้าง PDF
//   const pdfBuffer = await page.pdf({
//     format: 'A4',
//     printBackground: true, // แสดง background สี และ CSS
//   });
//   await browser.close();
//   return pdfBuffer;
// };
// export async function generatePdf(member: any) {
//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();
//   const filePath = path.join(process.cwd(), 'src/utils', 'pdf.html');
//   const fileUrl = `file://${filePath}?name=${encodeURIComponent(member.lname)}`;
//   await page.goto(fileUrl, { waitUntil: 'networkidle0' });
//   const pdfBuffer = await page.pdf({
//     format: 'A4',
//     printBackground: true,
//   });
//   await browser.close();
//   return pdfBuffer;
// }
function generatePdf(member) {
    return __awaiter(this, void 0, void 0, function* () {
        // โหลดไฟล์เทมเพลต .ejs
        const templatePath = path_1.default.join(process.cwd(), 'src/utils', 'pdf.ejs');
        const templateStr = yield promises_1.default.readFile(templatePath, 'utf8');
        // สร้าง HTML จาก template + ข้อมูล member
        const html = ejs_1.default.render(templateStr, { member });
        // สั่ง Puppeteer เปิดหน้า HTML นี้
        const browser = yield puppeteer_1.default.launch();
        const page = yield browser.newPage();
        // แทนที่จะโหลดไฟล์ผ่าน URL ให้ใช้ setContent() ใส่ HTML ลงไปเลย
        yield page.setContent(html, { waitUntil: 'networkidle0' });
        // สร้าง PDF
        const pdfBuffer = yield page.pdf({
            format: 'A4',
            printBackground: true,
        });
        yield browser.close();
        return pdfBuffer;
    });
}
