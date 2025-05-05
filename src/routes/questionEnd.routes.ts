
import express from 'express'
import { asyncHandler } from '../utils/asyncHandler';
import { authenticateToken } from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/admin.middleware';
import { createQuestionEnd, deleteQuestionEnd, getQuestionsEnd, updateQuestionEnd } from '../controllers/questionEnd.controller';
const router = express.Router();

router.get("/all", authenticateToken, asyncHandler(getQuestionsEnd));
router.post('/add', authenticateToken, asyncHandler(createQuestionEnd))
router.put('/:id', authenticateToken, asyncHandler(updateQuestionEnd))
router.delete('/:id', authenticateToken, asyncHandler(deleteQuestionEnd))

export default router;