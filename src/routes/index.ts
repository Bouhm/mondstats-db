import express from 'express';

import { getPlayerCharacters } from '../controllers/playerController';

const router = express.Router();
router.get('/', getPlayerCharacters);

export default router;
