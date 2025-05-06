
import express from 'express'
import { asyncHandler } from '../utils/asyncHandler';
import { createCompany, deleteCompany, getCompanys, updateCompany } from '../controllers/company.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/admin.middleware';
const router = express.Router();

router.get("/all", asyncHandler(getCompanys));
router.post('/add', authenticateToken, asyncHandler(createCompany))
router.put('/:id', authenticateToken, asyncHandler(updateCompany))
router.delete('/:id', authenticateToken, asyncHandler(deleteCompany))



export default router;