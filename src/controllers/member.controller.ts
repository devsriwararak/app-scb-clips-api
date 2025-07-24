
import { Request, Response } from "express";
import prisma from "../config/db";
import { Prisma } from "@prisma/client"
import { createMemberChangeCompany } from "./report.controller";
import { checkExpiredCertificates, decrypt, encrypt, generatePdf, sanitizeFilename } from "../utils/tools";
import nodemailer from 'nodemailer'
import { addYears } from 'date-fns'
import moment from "moment";
import jwt from "jsonwebtoken"

// mail Microsoft Graph
import { ConfidentialClientApplication } from '@azure/msal-node'
import { Client } from '@microsoft/microsoft-graph-client'
import { createFtpClient } from "../config/ftpClient";
import { Readable } from "stream";
require('isomorphic-fetch');



export const getMembers = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 8
        const search = (req.query.search as string) || ""
        const companyId = (req.query.companyId as string) || ""
        const terms = search?.split(/\s+/).filter(Boolean) || []


        const where: Prisma.MemberWhereInput = {
            ...(terms.length > 0 && {
                AND: terms.map(item => ({
                    OR: [
                        { titleName: { contains: item } },
                        { fname: { contains: item } },
                        { lname: { contains: item } },
                        { idCard: { contains: item } },
                    ]
                }))

            }),
            ...(companyId && {
                companyId: parseInt(companyId)
            })
        }

        const [data, totalItems] = await Promise.all([
            prisma.member.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    company: { select: { name: true } },
                    location: { select: { name: true } },
                    lecturer: { select: { name: true } }
                }
            }),
            prisma.member.count({ where })
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



// Create
export const createMember = async (req: Request, res: Response) => {
    try {

        const { titleName, fname, lname, idCard, phone, companyId, locationId, lecturerId, dateOfTraining, email } = req.body
        const imageFile = req.file;


        if (!imageFile) {
            return res.status(400).json({ message: 'Image is required.' });
        }
        const imageUrl = imageFile.path;

        console.log(req.body);
        console.log({ imageFile });
        console.log({ imageUrl });



        if (!titleName || !fname || !lname || !idCard || !phone || !companyId || !locationId || !lecturerId) {
            return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" })
        }

        // Check ซ้ำ
        const resultCheck = await prisma.member.findFirst({
            where: { idCard }
        })

        if (resultCheck) return res.status(400).json({ message: "มีข้อมูลนี้แล้วในระบบ กรุณาเพิ่มชื่อใหม่" })

        // upload รูป
        const filePath = imageFile.path;
        const originalName = imageFile.originalname;
        const safeName = sanitizeFilename(originalName)
        const remotePath = `/images/${Date.now()}_${safeName}`;

        const client = await createFtpClient();
        await client.uploadFrom(filePath, remotePath);
        await client.close();

        console.log({ remotePath });


        // fs.unlinkSync(filePath);

        const result = await prisma.member.create({
            data: {
                titleName,
                fname,
                lname,
                idCard,
                phone,
                email,
                image : remotePath,
                companyId: Number(companyId),
                locationId: Number(locationId),
                lecturerId: Number(lecturerId),
                dateOfTraining
            }
        })
        const idCardEncrypt = await encrypt(idCard)
        res.status(201).json({ result, message: "ทำรายการสำเร็จ", idCard: idCardEncrypt })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
}

// Update
export const updateMember = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id)
        const { titleName, fname, lname, idCard, idCardType, phone, companyId, locationId, lecturerId, dateOfTraining, email } = req.body
        console.log(req.body);


        if (!id || !idCard) return res.status(400).json({ message: "ส่งข้อมูลไม่ครบ" })

        // Check รหัสบัตรประชาชนซ้ำ
        const existing = await prisma.member.findFirst({
            where: {
                idCard: {
                    equals: idCard,
                    // mode: "insensitive"
                },
                NOT: {
                    id: id
                }
            }
        })
        if (existing) return res.status(400).json({ message: "มีข้อมูลนี้แล้ว" })

        // ถ้ามีการแก้ไขบริษัท ถึงจะทำงาน
        const oldMember = await prisma.member.findUnique({ where: { id } })
        if (!oldMember) return res.status(404).json({ message: "ไม่พบข้อมูลสมาชิก" })


        if (companyId !== oldMember.companyId) {
            // หา company name
            const companyName = await prisma.company.findUnique({ where: { id: Number(companyId) } })
            await createMemberChangeCompany({ id, oldCompanyId: oldMember.companyId, newCompany: companyName?.name })
        }

        const data = {
            titleName,
            fname,
            lname,
            idCard,
            idCardType,
            phone,
            email,
            companyId: Number(companyId),
            locationId: Number(locationId),
            lecturerId: Number(lecturerId),
            dateOfTraining: dateOfTraining || null
        }

        const result = await prisma.member.update({
            where: { id },
            data
        })

        return res.status(201).json({ result, message: "ทำรายการสำเร็จ" })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
}


// Delete
export const deleteMember = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id)
        if (!id) return res.status(400).json({ message: "ส่งข้อมูลไม่ครบ" })

        await prisma.member.delete({ where: { id } })
        return res.status(200).json({ message: "ทำรายการสำเร็จ" })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
}

// Check Id Card

export const checkIdCard = async (req: Request, res: Response) => {
    try {
        const { idCard } = req.body
        let statusEncrypt = false
        const idCardLength = idCard.length
        let useIdCard = idCard

        console.log('idCardLength :', idCardLength);

        if (!idCard) return res.status(400).json({ message: "ส่งข้อมูลไม่ครบ" })

        if (idCardLength > 13) statusEncrypt = true
        if (statusEncrypt === true) {
            const decipher = await decrypt(idCard)
            useIdCard = decipher
        }

        const result = await prisma.member.findFirst({
            where: {
                idCard: useIdCard,
                verify: 1
            },
            include: {
                location: { select: { name: true } }
            }
        })

        if (!result?.idCard) return res.status(400).json({ message: "ไม่พบข้อมูล กรุณาลงทะเบียน" })

        if (statusEncrypt == false) {
            const encrypted = await encrypt(result.idCard);
            useIdCard = encrypted
        }

        const data = {
            idCard: useIdCard,
            dateOfTraining: result.dateOfTraining,
            location: result.location.name
        }

        return res.status(200).json(data)

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
}

export const updateVerify = async (req: Request, res: Response) => {
    try {
        const { id, checked } = req.body
        console.log(req.body);

        if (!id) return res.status(400).json({ message: "ส่งข้อมูลไม่ครบ" })

        // Check 
        const resultCheck = await prisma.member.findFirst({
            where: { id }
        })
        if (!resultCheck) return res.status(400).json({ message: "ไม่พบข้อมูล" })

        // Update
        await prisma.member.update({
            where: { id },
            data: { verify: checked || 0 }
        })
        return res.status(201).json({ message: "ทำรายการสำเร็จ" })


    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
}

// member Change Company Report

// Certificate PDF
export const certificatePDF = async (req: Request, res: Response) => {
    try {
        const { idCard } = req.body

        if (!idCard) return res.status(404).json({ message: "ส่งข้อมูลไม่ครบ !" })
        const idCardLength = idCard.length
        let useIdCard = idCard

        if (idCardLength > 13) {
            const decipher = await decrypt(idCard)
            useIdCard = decipher
        }


        const member = await prisma.member.findUnique({
            where: { idCard: useIdCard },
            include: {
                company: { select: { name: true } },
                location: { select: { name: true } },
                lecturer: { select: { name: true } }
            }
        })

        if (!member) return res.status(404).json({ message: "ไม่พบสามาชิกท่านนี้ !" })
        if (member && member.statusQuestionEnd !== 1) return res.status(404).json({ message: 'คุณยังไม่ทำข้อสอบ' })

        //  สร้าง PDF
        const pdfBytes = await generatePdf(member)
        res.setHeader('Content-Type', 'application/pdf')
        // res.send(Buffer.from(pdfBytes))
        res.send(pdfBytes);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
}

export const certificatePDFSend = async (req: Request, res: Response) => {
    try {
        const { idCard } = req.body
        console.log({ idCard2: idCard });
        if (!idCard) return res.status(404).json({ message: "ส่งข้อมูลไม่ครบ !" })

        const idCardLength = idCard.length
        let useIdCard = idCard

        if (idCardLength > 13) {
            const decipher = await decrypt(idCard)
            useIdCard = decipher
        }


        const member = await prisma.member.findUnique({
            where: { idCard: useIdCard },
            include: {
                company: { select: { name: true } },
                location: { select: { name: true } },
                lecturer: { select: { name: true } }
            }
        })
        if (!member) return res.status(404).json({ message: 'Member not found' })
        if (member && member.statusQuestionEnd !== 1) return res.status(404).json({ message: 'คุณยังไม่ทำข้อสอบ' })

        // ส่ง mail
        // const transporter = nodemailer.createTransport({
        //     service: 'gmail',
        //     auth: {
        //         user: process.env.EMAIL_USER,
        //         pass: process.env.EMAIL_PASS,
        //     },
        // })

        // const pdfBytes = await generatePdf(member) as Buffer
        // const namePDF = `certificate_${idCard}.pdf`

        // const formattedDateCertificateDMY = moment(member.dateOfTraining).format('DD/MM') + '/' + (moment(member.dateOfTraining).year() + 543);
        // const formattedDateCertificateEndDMY = moment(member.dateEndCertificate).format('DD/MM') + '/' + (moment(member.dateEndCertificate).year() + 543);

        // const text = ` ถึง ${member.titleName}${" "} ${member.fname} ${" "} ${member.lname} 
        // รหัสบัตรประชาชน : ${member.idCard}
        // วันที่ได้ใบเซอร์ : ${formattedDateCertificateDMY}
        // ใบเซอร์ หมดอายุ : ${formattedDateCertificateEndDMY} 
        // โปรดดูใบรับรองของคุณที่แนบมา`

        // await transporter.sendMail({
        //     from: `"Thai Business Mate" <${process.env.EMAIL_USER}>`,
        //     to: member.email ?? "",
        //     subject: 'ยินดีด้วย ! คุณสอบผ่านและได้ใบเซอร์แล้ว',
        //     text: text,
        //     attachments: [
        //         {
        //             filename: namePDF,
        //             content: pdfBytes,
        //             contentType: 'application/pdf',
        //         },
        //     ],
        // })

        // ส่ง Emaill  microsoft graph
        const pdfBytes = await generatePdf(member) as Buffer;
        const namePDF = `certificate_${idCard}.pdf`;

        const formattedDateCertificateDMY = moment(member.dateOfTraining).format('DD/MM') + '/' + (moment(member.dateOfTraining).year() + 543);
        const formattedDateCertificateEndDMY = moment(member.dateEndCertificate).format('DD/MM') + '/' + (moment(member.dateEndCertificate).year() + 543);

        const text = ` ถึง ${member.titleName}${" "} ${member.fname} ${" "} ${member.lname} 
            รหัสบัตรประชาชน : ${member.idCard}
            วันที่ได้ใบเซอร์ : ${formattedDateCertificateDMY}
            ใบเซอร์ หมดอายุ : ${formattedDateCertificateEndDMY} 
            โปรดดูใบรับรองของคุณที่แนบมา`;

        const msalConfig = {
            auth: {
                clientId: process.env.AZURE_AD_CLIENT_ID!,
                authority: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID!}`,
                clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
            },
        };
        const cca = new ConfidentialClientApplication(msalConfig);
        const authResponse = await cca.acquireTokenByClientCredential({
            scopes: ['https://graph.microsoft.com/.default'],
        });
        if (!authResponse || !authResponse.accessToken) {
            throw new Error('Could not acquire token for Graph API');
        }

        const graphClient = Client.init({
            authProvider: (done) => {
                done(null, authResponse.accessToken);
            },
        });

        const base64Attachment = pdfBytes.toString('base64');

        const mailPayload = {
            message: {
                subject: 'ยินดีด้วย ! คุณสอบผ่านและได้ใบเซอร์แล้ว',
                body: {
                    contentType: 'Text', // หาก 'text' ของคุณเป็น HTML ให้เปลี่ยนเป็น 'HTML'
                    content: text,
                },
                toRecipients: [
                    {
                        emailAddress: {
                            address: member.email ?? "",
                        },
                    },
                ],
                attachments: [
                    {
                        '@odata.type': '#microsoft.graph.fileAttachment',
                        name: namePDF, // ใช้ชื่อไฟล์จากตัวแปรของคุณ
                        contentType: 'application/pdf',
                        contentBytes: base64Attachment, // ส่งไฟล์ในรูปแบบ Base64
                    },
                ],
            },
            saveToSentItems: 'true', // เก็บอีเมลที่ส่งแล้วใน Sent Items
        };

        const senderEmail = process.env.GRAPH_SENDER_EMAIL; // อีเมลผู้ส่งที่ตั้งค่าใน .env
        await graphClient.api(`/users/${senderEmail}/sendMail`).post(mailPayload);

        console.log(`Email successfully sent to ${member.email} via Microsoft Graph.`)


        // บันทึก DB
        await prisma.member.update({
            where: { idCard: useIdCard },
            data: {
                dateEndCertificate: addYears(new Date(), 2)
            }
        })

        res.status(200).json({ message: 'ส่ง Email สำเร็จ !!' })


    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
}


export const certificateEnd = async (req: Request, res: Response) => {
    try {
        const { id } = req.body
        if (!id) return res.status(400).json({ message: 'ส่งข้อมูลไม่ครบ !' })
        const dateNow = moment().startOf('day').toDate()
        const dateYesterday = moment().subtract(1, 'days').startOf('day').toDate()

        await prisma.member.update({
            where: { id },
            data: {
                dateEndCertificate: dateNow,
                dateOfTraining: dateYesterday,
            }

        })
        await checkExpiredCertificates()

        res.status(200).json({ message: 'ส่ง Email สำเร็จ !!' })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
}

export const getImageMember = async (req: Request, res: Response) => {
    const { fileName } = req.body;
    if (!fileName) {
        return res.status(400).send('File name is required.');
    }
    const client = await createFtpClient();

    try {
        // const remotePath = `/images/${fileName}`;

        // คาดเดา Content-Type จากนามสกุลไฟล์
        const extension = fileName.split('.').pop()?.toLowerCase();
        let contentType = 'application/octet-stream'; // default
        if (extension === 'jpg' || extension === 'jpeg') contentType = 'image/jpeg';
        if (extension === 'png') contentType = 'image/png';
        if (extension === 'gif') contentType = 'image/gif';

        res.setHeader('Content-Type', contentType);
        await client.downloadTo(res, fileName);

    } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error) {
            const ftpError = error as { code: number };
            if (ftpError.code === 550) {
                // หาไฟล์ไม่เจอในขั้นตอน .size()
                return res.status(404).json({ message: `File not found: ${fileName}` });
            }
        }
        // จัดการ error อื่นๆ ที่อาจเกิดขึ้น
        return res.status(500).json({ message: "An unexpected server error occurred." });
    } finally {
        if (!client.closed) {
            await client.close();
        }
    }
}


// Users

export const memberUpdateDateOfTraining = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const { dateOfTraining } = req.body

        if (!id && !dateOfTraining) return res.status(400).json({ message: 'ส่งข้อมูลไม่ครบ' })

        await prisma.member.update({ where: { idCard: id }, data: { dateOfTraining } })

        res.status(200).json({ message: 'บันทึกสำเร็จ', idCard: id })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
}
