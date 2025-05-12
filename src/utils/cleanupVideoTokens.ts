import corn from 'node-cron'
import prisma from "../config/db";

// 3.00 AM
corn.schedule("0 3 * * *", async()=> {
    try {
        const result = await prisma.videoToken.deleteMany({
            where: {
                OR: [
                    {used: true},
                    {expiresAt : {lt: new Date()}}
                ]
            }
        })
    console.log(`🧹 ลบ Token เรียบร้อย จำนวน: ${result.count}`);
    } catch (error) {
        console.error(" เกิดข้อผิดพลาดในการลบ Token:", error);
    }
})
