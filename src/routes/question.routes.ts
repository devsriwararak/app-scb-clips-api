
import express from 'express'
import { asyncHandler } from '../utils/asyncHandler';
import { authenticateToken } from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/admin.middleware';
import { createQuestion, deleteQuestion, getQuestions, updateQuestion } from '../controllers/question.controller';
const router = express.Router();

router.get("/all", asyncHandler(getQuestions));
router.post('/add', authenticateToken, asyncHandler(createQuestion))
router.put('/:id', authenticateToken, asyncHandler(updateQuestion))
router.delete('/:id', authenticateToken, asyncHandler(deleteQuestion))

export default router;