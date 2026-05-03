import { Router } from 'express';
import { createFamily, getFamily, getMyFamily, updateFamily } from '../controllers/family.controller';
import { verifyToken, allowUser } from '../middleware/auth.middleware';

const router = Router();

// All family routes require authentication (USER or ADMIN)
router.use(verifyToken, allowUser);

router.get('/my', getMyFamily);       // Phase 3 — user dashboard (MUST be before /:id)
router.post('/create', createFamily);
router.put('/update', updateFamily);
router.get('/:id', getFamily);

export default router;
