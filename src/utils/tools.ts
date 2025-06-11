import crypto from "crypto";
import prisma from "../config/db";
import fs from 'fs/promises'
import path from 'path'
import puppeteer from "puppeteer";
import ejs from 'ejs';
import moment from 'moment';
import 'moment/locale/th';
moment.locale('th'); // ตั้งให้ใช้ภาษาไทย
const NODE_ENV = process.env.NODE_ENV


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


const certificateDetail_1 = [
    { id: 1, text: "ต้องใช้อุปกรณ์ป้องกันการตกจากที่สูงเมื่ออยู่ในพื้นที่ที่ไม่มีการ ป้องกันขณะทำงานที่มีความสูงตั้งแต่ 1.8 เมตรขึ้นไป" },
    { id: 2, text: "ต้องตัดแยกระบบไฟฟ้าและพลังงานโดยการใช้ระบบ ล็อคกญแจและแขวนป้าย" },
    { id: 3, text: "ต้องได้รับอนุญาตก่อนถอดหรือปลดอุปกรณ์ ปลอดภัยออก" },
    { id: 4, text: "ต้องได้รับอนุญาตก่อนเข้าทำงานในสถานที่อับอากาศ" },
    { id: 5, text: "ต้องมีใบอนุญาตทำงานที่ได้รับอนุมัติ (Work Permit) ตามลักษณะงานที่กำหนด" },
    { id: 6, text: "ต้องไม่ดื่มเครื่องดื่มที่มีแอลกอฮอล์ หรือ เสพสารเสพติด เมื่อต้องทำงาน ขับขี่รถยนต์ หรือ รถจักรยานยนต์" },
    { id: 7, text: "ต้องคาดเข็มขัดนิรภัยขณะขับขี่ หรือเดินทางโดยรถยนต์" },
    { id: 8, text: "ต้องสวมหมวกนิรภัยในขณะขับขี่ หรือนั่งซ้อนท้ายรถจักรยานยนต์" },
    { id: 9, text: "ต้องไม่ใช้โทรศัพท์มือถือขณะขับขี่รถยนต์ หรือรถจักรยานยนต์โดยไม่ใช้อุปกรณ์เสริมช่วย" },
    { id: 10, text: "ต้องไม่สูบบุหรี่ในบริเวณโรงงาน รวมทั้งไม่พกพาบุหรี่ ไม้ชีดไฟหรือไฟแช็คเข้ามาในเขตโรงงาน" },
    { id: 11, text: "ต้องดับเครื่องยนต์ ถอดกุญแจ ดึงเบรกมือ และหนุนหมอนรองล้อเมื่อจอดรถบรรทุกทุกครั้ง" },
]

const certificateDetail_2 = [
    { id: 1, text: "ต้องรายงานผู้บังคับบัญชา หรือพนักงานผู้ควบคุมงาน ในกรณีเกิด อุบัติเหตุ หรือมีเหตุการณ์เกือบเกิดอุบัติเหตุ ที่ทำให้เกิดหรืออาจเกิดการบาดเจ็บ / ทรัพย์สินเสียหาย หรืออัคคีภัย" },
    { id: 2, text: "ต้องสวมใส่อุปกรณ์ป้องกันอันตรายส่วนบุคคลที่กำหนดตามแต่ละประเภทงานทุกครั้" },
    { id: 3, text: "ห้ามใส่กางเกงขาสั้น หรือสวมใส่รองเท้าแตะในเขตโรงงาน และต้องเข้าเขตปฏิบัติงานที่มีเครื่องจักร" },
    { id: 4, text: "ห้ามเข้าไปในพื้นที่ควบคุม (Restricted Area) เช่น ห้องไฟฟ้า ห้องหม้อแปลง โดยไม่ได้รับอนุญาต" },
    { id: 5, text: "ห้ามทำงานกับเครื่องจักร โดยไม่มีหน้าที่เกี่ยวข้อง" },
    { id: 6, text: "ห้ามโหน เกาะ หรืออาศัยไปกับรถงานทุกชนิด เช่น Forklift, Clamp lift, Hand lif, Transfer car, รถตัก เป็นต้" },
    { id: 7, text: "ห้ามใช้โทรศัพท์ หรือสวมใส่หูฟังขณะปฏิบัติงานกับเครื่องจักร" },
    { id: 8, text: "ห้ามใช้โทรศัพท์ขณะขับขี่รถจักรยานในเขตโรงงาน" },
    { id: 9, text: "ห้ามนำรถยนต์ รถจักรยานยนต์ และรถจักรยาน เข้าในเขตอาคารเครื่องจักรโดยไม่ได้รับอนุญาต" },
    { id: 10, text: "ห้ามขับขี่ยานพาหนะ เกินความเร็วตามที่กำหนดแต่ละพื้นที่กำหนด" },
    { id: 11, text: "ห้ามนำภาชนะบรรจุอาหาร หรือเครื่องดื่มมาใช้ในการบรรจุสารเคมี" },
]

export async function generatePdf(member: any) {
    try {
        // โหลดไฟล์เทมเพลต .ejs
        const templatePath = path.join(process.cwd(), 'src/utils', 'pdf.ejs');
        const templateStr = await fs.readFile(templatePath, 'utf8');

        const logoPath = path.join(process.cwd(), 'src', 'assets', 'logo.png');
        const logoBuffer = await fs.readFile(logoPath);
        const logoBase64 = logoBuffer.toString('base64');

        const formattedDateCertificate = moment(member.dateOfTraining).format(' D MMMM ') + (moment(member.dateOfTraining).year() + 543);
        const formattedDateCertificateDMY = moment(member.dateOfTraining).format('DD/MM') + '/' + (moment(member.dateOfTraining).year() + 543);
        const formattedDateCertificateEndDMY = moment(member.dateEndCertificate).format('DD/MM') + '/' + (moment(member.dateEndCertificate).year() + 543);


        // สร้าง HTML จาก template + ข้อมูล member
        const html = ejs.render(templateStr, {
            member: {
                ...member,
                logoBase64,
                certificateDetail_1,
                certificateDetail_2,
                formattedDateCertificate,
                formattedDateCertificateDMY,
                formattedDateCertificateEndDMY
            }
        });

        // สั่ง Puppeteer เปิดหน้า HTML นี้


        let browser = null
        if (NODE_ENV === 'development') {
            browser = await puppeteer.launch();
        } 
        else if (NODE_ENV === "production") {
            browser = await puppeteer.launch({
                executablePath: '/usr/bin/chromium-browser',  // หรือ path ที่ติดตั้งจริง ๆ
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                headless: true,
            });
        }

        if (!browser) {
            throw new Error("Puppeteer browser is not initialized. Check NODE_ENV value.");
        }

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
    } catch (error) {
        console.error('❌ PDF generation error:', error);
        throw error; // ให้ Express จัดการส่ง 500 กลับไป
    }
}