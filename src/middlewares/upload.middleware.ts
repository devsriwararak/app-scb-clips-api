import fs from 'fs'
import multer from 'multer';
import path from 'path';
const uploadDir = 'D:\\Uploads';


if(!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, {recursive: true})
}

const storage = multer.diskStorage({
    destination: (req, file, cb)=> {
        cb(null, uploadDir)
    },
    filename : (req, file, cb)=> {
        const newFileName = Date.now() + path.extname(file.originalname)
        cb(null, newFileName)
    }
})

export const uploadServer = multer({storage: storage})