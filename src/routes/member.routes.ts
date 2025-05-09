
import express from 'express'
import { asyncHandler } from '../utils/asyncHandler';
import { authenticateToken } from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/admin.middleware';
import { checkIdCard, createMember, deleteMember, getMembers, updateMember } from '../controllers/member.controller';
const router = express.Router();

router.get("/all", asyncHandler(getMembers));
router.post('/add', asyncHandler(createMember)) 
router.put('/:id', authenticateToken, asyncHandler(updateMember))
router.delete('/:id', authenticateToken, asyncHandler(deleteMember))
router.post('/checkIdCard', asyncHandler(checkIdCard))

export default router;
