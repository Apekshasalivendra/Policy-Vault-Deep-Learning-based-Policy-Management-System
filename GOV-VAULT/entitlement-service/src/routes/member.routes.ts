import { Router } from 'express';
import { registerMembersHandler, markDeceasedHandler } from '../controllers/member.controller';

const router = Router();

// POST /members/register  — bulk register members on family approval
router.post('/register', registerMembersHandler);

// POST /members/:memberId/deceased  — mark a member as deceased
router.post('/:memberId/deceased', markDeceasedHandler);

export default router;
