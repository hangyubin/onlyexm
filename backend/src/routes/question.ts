import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import multer from 'multer';
import {
  createQuestionSchema,
  updateQuestionSchema,
  queryQuestionSchema,
} from '../utils/validation';
import {
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionById,
  getQuestions,
  downloadTemplate,
  batchImportQuestions,
} from '../controllers/questionController';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.originalname.match(/\.(xlsx|xls)$/)) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传Excel文件'));
    }
  },
});

router.post(
  '/',
  authMiddleware,
  roleGuard(['ADMIN', 'INFECTION_OFFICER']),
  async (req, res) => {
    try {
      const validation = createQuestionSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          error: '验证失败',
          details: validation.error.errors.map((e) => e.message),
        });
      }

      const question = await createQuestion(validation.data);

      res.status(201).json({
        success: true,
        data: question,
      });
    } catch (error) {
      console.error('Create question error:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }
);

router.put(
  '/:id',
  authMiddleware,
  roleGuard(['ADMIN', 'INFECTION_OFFICER']),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        return res.status(400).json({ error: '无效的题目ID' });
      }

      const validation = updateQuestionSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          error: '验证失败',
          details: validation.error.errors.map((e) => e.message),
        });
      }

      const question = await updateQuestion(id, validation.data);

      if (!question) {
        return res.status(404).json({ error: '题目不存在或已被删除' });
      }

      res.json({
        success: true,
        data: question,
      });
    } catch (error) {
      console.error('Update question error:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }
);

router.delete(
  '/:id',
  authMiddleware,
  roleGuard(['ADMIN', 'INFECTION_OFFICER']),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        return res.status(400).json({ error: '无效的题目ID' });
      }

      const success = await deleteQuestion(id);

      if (!success) {
        return res.status(404).json({ error: '题目不存在或已被删除' });
      }

      res.json({
        success: true,
        message: '删除成功',
      });
    } catch (error) {
      console.error('Delete question error:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }
);

router.get(
  '/',
  authMiddleware,
  roleGuard(['ADMIN', 'INFECTION_OFFICER']),
  async (req, res) => {
    try {
      const validation = queryQuestionSchema.safeParse(req.query);

      if (!validation.success) {
        return res.status(400).json({
          error: '验证失败',
          details: validation.error.errors.map((e) => e.message),
        });
      }

      const { data, total } = await getQuestions(validation.data);

      res.json({
        success: true,
        data,
        total,
        page: validation.data.page,
        pageSize: validation.data.pageSize,
      });
    } catch (error) {
      console.error('Get questions error:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }
);

router.get(
  '/template',
  authMiddleware,
  roleGuard(['ADMIN', 'INFECTION_OFFICER']),
  async (req, res) => {
    try {
      const buffer = await downloadTemplate();
      res.setHeader('Content-Disposition', 'attachment; filename="question_template.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      console.error('Download template error:', error);
      res.status(500).json({ error: '下载模板失败' });
    }
  }
);

router.get(
  '/:id',
  authMiddleware,
  roleGuard(['ADMIN', 'INFECTION_OFFICER']),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        return res.status(400).json({ error: '无效的题目ID' });
      }

      const question = await getQuestionById(id);

      if (!question) {
        return res.status(404).json({ error: '题目不存在或已被删除' });
      }

      res.json({
        success: true,
        data: question,
      });
    } catch (error) {
      console.error('Get question error:', error);
      res.status(500).json({ error: '服务器内部错误' });
    }
  }
);

router.post(
  '/batch-import',
  authMiddleware,
  roleGuard(['ADMIN', 'INFECTION_OFFICER']),
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: '请上传文件' });
      }

      const result = await batchImportQuestions(req.file.buffer);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error('Batch import error:', error);
      res.status(500).json({ error: '批量导入失败' });
    }
  }
);

export default router;
