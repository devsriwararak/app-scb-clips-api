
import express from 'express'
import { asyncHandler } from '../utils/asyncHandler';
import { authenticateToken } from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/admin.middleware';
import { certificateEnd, certificatePDF, certificatePDFSend, checkIdCard, createMember, deleteMember, getMembers, memberUpdateDateOfTraining, updateMember } from '../controllers/member.controller';
const router = express.Router();

router.get("/all", asyncHandler(getMembers));
router.post('/add', asyncHandler(createMember)) 
router.put('/:id', authenticateToken, asyncHandler(updateMember))
router.delete('/:id', authenticateToken, asyncHandler(deleteMember))
router.post('/checkIdCard', asyncHandler(checkIdCard))

//certificate
router.post('/certificate', authenticateToken ,asyncHandler(certificatePDF))
router.post('/certificate/send',asyncHandler(certificatePDFSend))
router.post('/certificate/end',asyncHandler(certificateEnd))

// Users
router.put('/user/update/:id', asyncHandler(memberUpdateDateOfTraining))


export default router;
