
import express from 'express'
import { asyncHandler } from '../utils/asyncHandler';
import { authenticateToken } from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/admin.middleware';
import { certificateEnd, certificatePDF, certificatePDFSend, checkIdCard, createMember, deleteMember, getImageMember, getMembers, memberUpdateDateOfTraining, updateMember, updateVerify } from '../controllers/member.controller';
import multer from 'multer';
import { uploadServer } from '../middlewares/upload.middleware';
const router = express.Router();
const upload = multer({ dest: 'uploads/' });


router.get("/all", asyncHandler(getMembers));
router.post('/add', uploadServer.single('image'), asyncHandler(createMember)) 
router.put('/:id', uploadServer.single('image'), authenticateToken, asyncHandler(updateMember))
router.delete('/:id', authenticateToken, asyncHandler(deleteMember))
router.post('/checkIdCard', asyncHandler(checkIdCard))
router.post('/updateVerify', asyncHandler(updateVerify))
router.post('/image', asyncHandler(getImageMember))

//certificate
router.post('/certificate', authenticateToken ,asyncHandler(certificatePDF))
router.post('/certificate/send',asyncHandler(certificatePDFSend))
router.post('/certificate/end',asyncHandler(certificateEnd))

// Users
router.put('/user/update/:id', asyncHandler(memberUpdateDateOfTraining))




export default router;
