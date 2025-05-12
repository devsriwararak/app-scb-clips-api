import { Request, Response } from "express";
import prisma from "../config/db";
import { Prisma } from "@prisma/client"

// GET ALL
export const getQuestions = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 5
        const search = (req.query.search as string) || ""

        const where: Prisma.QuestionWhereInput = search
            ? {
                name: {
                    contains: search,
                    mode: 'insensitive',
                },
            }
            : {}

        const [data, totalItems] = await Promise.all([
            prisma.question.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    createdAT : 'desc'
                }
            }),
            prisma.question.count({ where })
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
export const createQuestion = async(req:Request, res:Response)=> {
    try {
        const {name, answer} =  req.body
        
        // Check ซ้ำ
        const resultCheck = await prisma.question.findFirst({
            where: {name : {
                equals: name ,
                mode: "insensitive"
            }}
        })

        if(resultCheck) return res.status(400).json({message : "มีข้อมูลนี้แล้วในระบบ กรุณาเพิ่มชื่อใหม่"})
     
        const result = await prisma.question.create({data: {name, answer}})
        res.status(201).json({result, message : "ทำรายการสำเร็จ"})

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error }); 
    }
}

// Update
export const updateQuestion = async(req: Request, res:Response) => {
    try {
        const id = parseInt(req.params.id)
        const {name, answer} = req.body

        if(!id || !name) return res.status(400).json({message : "ส่งข้อมูลไม่ครบ"})

            // Check
            const existing = await prisma.question.findFirst({
                where: {
                    name : {
                        equals: name,
                        mode: "insensitive"
                    },
                    NOT : {
                        id : id
                    }
                }
            })

            if(existing) return res.status(400).json({message : "มีข้อมูลนี้แล้ว"})

            const result = await prisma.question.update({
                where: {id},
                data : {name, answer}
            })
            return res.status(201).json({result, message : "ทำรายการสำเร็จ"})
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error }); 
    }
}

// Delete
export const deleteQuestion = async(req:Request, res : Response)=> {
    try {
        const id = parseInt(req.params.id)
        if(!id ) return res.status(400).json({message : "ส่งข้อมูลไม่ครบ"})

            await prisma.question.delete({where: {id}})
            return res.status(200).json({message : "ทำรายการสำเร็จ"})
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error }); 
    }
}