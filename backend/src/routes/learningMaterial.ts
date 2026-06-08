import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import {
  getLearningMaterials,
  getLearningMaterialById,
  createLearningMaterial,
  updateLearningMaterial,
  deleteLearningMaterial,
  getCategories,
} from '../controllers/learningMaterialController';

const router = express.Router();

router.get('/', authMiddleware, getLearningMaterials);
router.get('/categories/list', authMiddleware, getCategories);
router.get('/:id', authMiddleware, getLearningMaterialById);
router.post('/', authMiddleware, roleGuard(['ADMIN', 'INFECTION_OFFICER']), createLearningMaterial);
router.put('/:id', authMiddleware, roleGuard(['ADMIN', 'INFECTION_OFFICER']), updateLearningMaterial);
router.delete('/:id', authMiddleware, roleGuard(['ADMIN', 'INFECTION_OFFICER']), deleteLearningMaterial);

export default router;