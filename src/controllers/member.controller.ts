
import { Request, Response } from "express";
import prisma from "../config/db";
import { Prisma } from "@prisma/client"
import { createMemberChangeCompany } from "./report.controller";

export const getMembers = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 5
        const search = (req.query.search as string) || ""
        const companyId = (req.query.companyId as string) || ""

        const where: Prisma.MemberWhereInput = {
            ...(search && {
                OR: [
                    { fname: { contains: search, mode: 'insensitive' } },
                    { lname: { contains: search, mode: 'insensitive' } },
                    { idCard: { contains: search, mode: 'insensitive' } },
                ]
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

        const { titleName, fname, lname, idCard, phone, companyId, locationId, lecturerId, dateOfTraining } = req.body

        console.log(req.body);


        if (!titleName || !fname || !lname || !idCard || !phone || !companyId || !locationId || !lecturerId) {
            return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" })
        }

        // Check ซ้ำ
        const resultCheck = await prisma.member.findFirst({
            where: { idCard }
        })

        if (resultCheck) return res.status(400).json({ message: "มีข้อมูลนี้แล้วในระบบ กรุณาเพิ่มชื่อใหม่" })

        const result = await prisma.member.create({
            data: {
                titleName,
                fname,
                lname,
                idCard,
                phone,
                companyId: Number(companyId),
                locationId: Number(locationId),
                lecturerId: Number(lecturerId),
                dateOfTraining
            }
        })
        res.status(201).json({ result, message: "ทำรายการสำเร็จ" })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
}

// Update
export const updateMember = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id)
        const { titleName, fname, lname, idCard, phone, companyId, locationId, lecturerId, dateOfTraining } = req.body

        if (!id || !idCard) return res.status(400).json({ message: "ส่งข้อมูลไม่ครบ" })

        // Check รหัสบัตรประชาชนซ้ำ
        const existing = await prisma.member.findFirst({
            where: {
                idCard: {
                    equals: idCard,
                    mode: "insensitive"
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
            await createMemberChangeCompany({ id, oldCompanyId: oldMember.companyId, newCompany : companyName?.name })
        }

        const data = {
            titleName,
            fname,
            lname,
            idCard,
            phone,
            companyId: Number(companyId),
            locationId: Number(locationId),
            lecturerId: Number(lecturerId),
            dateOfTraining
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
        
        if (!idCard) return res.status(400).json({ message: "ส่งข้อมูลไม่ครบ" })

        const result = await prisma.member.findFirst({
            where: { idCard }
        })

    
        if (!result?.idCard) return res.status(400).json({ message: "ไม่พบข้อมูล กรุณาลงทะเบียน" })

        return res.status(200).json(result)

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
}

// member Change Company Report
