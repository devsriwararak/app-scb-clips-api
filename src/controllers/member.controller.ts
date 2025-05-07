
import { Request, Response } from "express";
import prisma from "../config/db";
import { Prisma } from "@prisma/client"


// Create
export const createMember = async (req: Request, res: Response) => {
    try {

        const { titleName, fname, lname, idCard, phone, companyId, locationId, lecturerId } = req.body

        console.log(req.body);
        

        if (!titleName || !fname || !lname || !idCard || !phone || !companyId || !locationId || !lecturerId) {
            return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" })
        }

        // Check ซ้ำ
        const resultCheck = await prisma.member.findFirst({
            where: {idCard }
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
                  dateOfTraining: new Date(), 
                  dateEndCertificate: new Date(), 
                }
              })
        res.status(201).json({ result, message: "ทำรายการสำเร็จ" })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
}