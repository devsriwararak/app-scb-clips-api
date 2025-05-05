import { Request, Response } from "express";
import prisma from "../config/db";
import { Prisma } from "@prisma/client"

// GET ALL
export const getQuestionsEnd = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 5
        const search = (req.query.search as string) || ""

        const where: Prisma.QuestionEndWhereInput = search
            ? {
                name: {
                    contains: search,
                    mode: 'insensitive',
                },
            }
            : {}

        const [data, totalItems] = await Promise.all([
            prisma.questionEnd.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    createdAT: 'desc'
                },
                include: {
                    questionEndList: {
                        orderBy: {
                            id : "asc"
                        }
                    }
                }
            }),
            prisma.questionEnd.count({ where })
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
export const createQuestionEnd = async (req: Request, res: Response) => {
    try {
        const { name, questions } = req.body

        if (!name || !questions || !Array.isArray(questions)) {
            return res.status(400).json({ message: 'ข้อมูลไม่ครบถ้วน' })
        }

        // Check ซ้ำ
        const resultCheck = await prisma.questionEnd.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: "insensitive"
                }
            }
        })

        if (resultCheck) return res.status(400).json({ message: "มีข้อมูลนี้แล้วในระบบ กรุณาเพิ่มชื่อใหม่" })

        const result = await prisma.questionEnd.create({
            data: {
                name,
                questionEndList: {
                    createMany: {
                        data: questions.map((q: any) => ({
                            question: q.question,
                            status: q.status ?? 0
                        }))
                    }
                }
            },
            include: {
                questionEndList: true
            }
        })

        res.status(201).json({ result, message: "ทำรายการสำเร็จ" })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
}

// Update
export const updateQuestionEnd = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id)
        const { name } = req.body

        if (!id || !name) return res.status(400).json({ message: "ส่งข้อมูลไม่ครบ" })

        // Check
        const existing = await prisma.questionEnd.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: "insensitive"
                },
                NOT: {
                    id: id
                }
            }
        })

        if (existing) return res.status(400).json({ message: "มีข้อมูลนี้แล้ว" })

        const result = await prisma.question.update({
            where: { id },
            data: { name }
        })
        return res.status(201).json({ result, message: "ทำรายการสำเร็จ" })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
}

// Delete
export const deleteQuestionEnd = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id)
        if (!id) return res.status(400).json({ message: "ส่งข้อมูลไม่ครบ" })

        await prisma.questionEndList.deleteMany({ 
            where: { questionEndId: id }
         })

         await prisma.questionEnd.delete({
            where: {id}
         })
         
        return res.status(200).json({ message: "ทำรายการสำเร็จ" })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
}