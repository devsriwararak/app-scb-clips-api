
import express from 'express'
import { asyncHandler } from '../utils/asyncHandler';
import { authenticateToken } from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/admin.middleware';
import { createMember } from '../controllers/member.controller';
const router = express.Router();

// router.get("/all", asyncHandler(getLocations));
router.post('/add', asyncHandler(createMember))
// router.put('/:id', authenticateToken, asyncHandler(updateLocation))
// router.delete('/:id', authenticateToken, asyncHandler(deleteLocation))

export default router;