import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../utils/asyncHandler";
import { authenticateToken } from "../middlewares/auth.middleware";
import { deleteVideo, EndStreamVideo, getAllVideos, getSecureVideos, streamVideo, updateVideo, uploadVideo } from "../controllers/vdo.controller";
import { uploadServer } from "../middlewares/upload.middleware";

const router = Router()
const upload = multer({ dest: "tmp/" });


router.get('/all', asyncHandler(getAllVideos))
//router.post("/upload",authenticateToken, upload.single("video"), asyncHandler(uploadVideo));
router.post("/upload",authenticateToken, uploadServer.single('video'), asyncHandler(uploadVideo));
router.put("/upload/:id",authenticateToken, uploadServer.single("video"), asyncHandler(updateVideo));
router.delete("/:id", authenticateToken, asyncHandler(deleteVideo));

// User
router.post('/secure/checkIdCard', asyncHandler(getSecureVideos))
router.get('/stream', asyncHandler(streamVideo) )
router.post('/end', asyncHandler(EndStreamVideo))


export default router