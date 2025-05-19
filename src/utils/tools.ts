import crypto from "crypto";
import prisma from "../config/db";
import fs from 'fs/promises'
import path from 'path'
import puppeteer from "puppeteer";
import ejs from 'ejs';



export const sanitizeFilename = (filename: string) => {
    return filename.replace(/[^a-zA-Z0-9_.-]/g, "_");
}


export const expiresAt = () => {
    const limit = Math.floor(Date.now() / 1000) + 60
    return limit

}
export const generateToken = (idCard: string, filePath: string, expiresAt: number) => {
    const secret = process.env.STREAM_SECRET || "mysecret"
    const raw = `${idCard}|${filePath}|${expiresAt}|${secret}`
    return crypto.createHash("sha256").update(raw).digest("hex")
}

export const generateSecureToken = async (idCard: string, filePath: string) => {
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 นาที

    await prisma.videoToken.create({
        data: {
            token,
            filePath,
            idCard,
            expiresAt
        }
    })
    return token
}


// PDF


//check Citificate
export const checkExpiredCertificates = async () => {
    try {
        const today = new Date()
        console.log(today);

        const expiredMembers = await prisma.member.findMany({
            where: {
                dateEndCertificate: {
                    lt: today
                }
            },
            select: {
                id: true
            }
        })

        const expiredIds = expiredMembers.map((m) => m.id);

        if (expiredMembers.length > 0) {
            await prisma.member.updateMany({
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
            })
        }

        return expiredIds.length;



    } catch (error) {
        console.error('เกิดข้อผิดพลาด', error)
    }
}




export async function generatePdf(member: any) {
  // โหลดไฟล์เทมเพลต .ejs
  const templatePath = path.join(process.cwd(), 'src/utils', 'pdf.ejs');
  const templateStr = await fs.readFile(templatePath, 'utf8');

  // สร้าง HTML จาก template + ข้อมูล member
  const html = ejs.render(templateStr, { member });

  // สั่ง Puppeteer เปิดหน้า HTML นี้
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // แทนที่จะโหลดไฟล์ผ่าน URL ให้ใช้ setContent() ใส่ HTML ลงไปเลย
  await page.setContent(html, { waitUntil: 'networkidle0' });

  // สร้าง PDF
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
  });

  await browser.close();

  return pdfBuffer;
}