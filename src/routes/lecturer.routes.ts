
import express from 'express'
import { asyncHandler } from '../utils/asyncHandler';
import { authenticateToken } from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/admin.middleware';
import { createLecturer, deleteLecturer, getLecturers, updateLecturer } from '../controllers/lecturer.controller';
const router = express.Router();

router.get("/all", authenticateToken, asyncHandler(getLecturers));
router.post('/add', authenticateToken, asyncHandler(createLecturer))
router.put('/:id', authenticateToken, asyncHandler(updateLecturer))
router.delete('/:id', authenticateToken, asyncHandler(deleteLecturer))

export default router;