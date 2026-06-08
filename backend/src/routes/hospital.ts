import express from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const hospitals = await prisma.hospital.findMany({
      orderBy: { id: 'desc' },
    });

    res.json(hospitals);
  } catch (error) {
    console.error('获取医院列表失败:', error);
    res.status(500).json({ error: '获取医院列表失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const hospital = await prisma.hospital.findUnique({
      where: { id },
    });

    if (!hospital) {
      return res.status(404).json({ error: '医院不存在' });
    }

    res.json(hospital);
  } catch (error) {
    console.error('获取医院详情失败:', error);
    res.status(500).json({ error: '获取医院详情失败' });
  }
});

router.post('/', roleGuard(['ADMIN']), async (req, res) => {
  try {
    const { id, name, level } = req.body;

    const hospital = await prisma.hospital.create({
      data: {
        id: parseInt(id),
        name,
        level,
      },
    });

    res.status(201).json(hospital);
  } catch (error) {
    console.error('创建医院失败:', error);
    res.status(500).json({ error: '创建医院失败' });
  }
});

router.put('/:id', roleGuard(['ADMIN']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, level } = req.body;

    const existingHospital = await prisma.hospital.findUnique({
      where: { id },
    });

    if (!existingHospital) {
      return res.status(404).json({ error: '医院不存在' });
    }

    const hospital = await prisma.hospital.update({
      where: { id },
      data: {
        name,
        level,
      },
    });

    res.json(hospital);
  } catch (error) {
    console.error('更新医院失败:', error);
    res.status(500).json({ error: '更新医院失败' });
  }
});

router.delete('/:id', roleGuard(['ADMIN']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const existingHospital = await prisma.hospital.findUnique({
      where: { id },
    });

    if (!existingHospital) {
      return res.status(404).json({ error: '医院不存在' });
    }

    await prisma.hospital.delete({
      where: { id },
    });

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除医院失败:', error);
    res.status(500).json({ error: '删除医院失败' });
  }
});

export default router;
