import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../utils/asyncHandler";
import { authenticateToken } from "../middlewares/auth.middleware";
import { deleteVideo, getAllVideos, updateVideo, uploadVideo } from "../controllers/vdo.controller";

const router = Router()
const upload = multer({ dest: "tmp/" });


router.get('/all', authenticateToken, asyncHandler(getAllVideos))
router.post("/upload",authenticateToken, upload.single("video"), asyncHandler(uploadVideo));
router.put("/upload/:id",authenticateToken, upload.single("video"), asyncHandler(updateVideo));
router.delete("/:id", authenticateToken, asyncHandler(deleteVideo));


export default router