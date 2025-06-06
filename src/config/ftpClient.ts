import { Client } from "basic-ftp";


export const createFtpClient = async()=> {
    const client = new Client()

    await client.access({
        host: process.env.FTP_HOST!,
        user: process.env.FTP_USER!,
        password: process.env.FTP_PASSWORD!,
        secure: false, // เปลี่ยนเป็น true หากใช้ FTPS
        port: 21
    })
    return client;
}