import crypto from "crypto";
import prisma from "../config/db";


export const sanitizeFilename = (filename: string) => {
    return filename.replace(/[^a-zA-Z0-9_.-]/g, "_"); 
}


export const expiresAt = ()=>{
    const limit = Math.floor(Date.now() / 1000) + 60 
    return limit

}
export const generateToken = (idCard: string, filePath : string, expiresAt: number )=> {
     const secret = process.env.STREAM_SECRET || "mysecret"
     const raw = `${idCard}|${filePath}|${expiresAt}|${secret}`
     return crypto.createHash("sha256").update(raw).digest("hex")
}

export const generateSecureToken =  async(idCard : string , filePath: string)=> {
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