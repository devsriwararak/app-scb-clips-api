
import { Request, Response } from "express";
import prisma from "../config/db";
import { Prisma } from "@prisma/client"

interface MemberType {
    id: number;
    oldCompanyId: number
    newCompany? : string
}

// Create
export const createMemberChangeCompany = async (data: MemberType) => {
    try {
        if (!data.id || data.oldCompanyId === undefined || data.oldCompanyId === null) throw new Error('ส่งข้อมูลไม่ครบ')
        await prisma.memberChangeCompany.create({
            data: {
                memberId: data.id,
                oldCompanyId: Number(data.oldCompanyId),
                createdAt: new Date(),
                newCompany: data.newCompany || ""
            }
        })
        return true
    } catch (error) {
        console.error(error)
        return false
    }
}


export const getMemberChageCompany = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 8
        const search = (req.query.search as string) || ""
        const companyId = (req.query.companyId as string) || ""

        const where: Prisma.MemberChangeCompanyWhereInput = {
            ...(search && {
                OR: [
                    {
                        member: {
                            OR: [
                                { fname: { contains: search, mode: 'insensitive' } },
                                { lname: { contains: search, mode: 'insensitive' } }
                            ]
                        }
                    }
                ]
            }),
            ...(companyId && {
                oldCompanyId : parseInt(companyId)
            })
        }

        

        const [data, totalItems] = await Promise.all([
            prisma.memberChangeCompany.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    member: {
                        include: {
                            company: { select: { name: true } },
                            location: { select: { name: true } },
                            lecturer: { select: { name: true } }
                        }
                    },
                    company: { select: { name: true } },
                }
            }),
            prisma.memberChangeCompany.count({ where })
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

export const deleteChangeCompany = async(req:Request , res:Response)=> {
    try {
             const id = parseInt(req.params.id)
        if (!id) return res.status(400).json({ message: "ส่งข้อมูลไม่ครบ" })

        await prisma.memberChangeCompany.delete({ where: { id } })
        return res.status(200).json({ message: "ทำรายการสำเร็จ" })
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
}