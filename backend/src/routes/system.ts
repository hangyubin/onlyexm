import express from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';

import { getDictItems, clearDictCache } from '../utils/dictCache';

const router = express.Router();
router.use(authMiddleware);

// =============== SystemDict 字典 ===============

router.get('/dict/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const flat = req.query.flat === 'true';
    const items = await prisma.systemDict.findMany({
      where: { category, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });

    if (flat) {
      // 扁平列表：返回所有层级
      res.json(items);
    } else {
      // 默认返回树形结构（含 children）
      const itemMap = new Map<number, any>();
      const roots: any[] = [];
      for (const item of items) {
        itemMap.set(item.id, { ...item, children: [] });
      }
      for (const item of items) {
        const node = itemMap.get(item.id)!;
        if (item.parentId && itemMap.has(item.parentId)) {
          itemMap.get(item.parentId)!.children.push(node);
        } else {
          roots.push(node);
        }
      }
      res.json(roots);
    }
  } catch (err) {
    console.error('获取字典失败:', err);
    res.status(500).json({ error: '获取字典失败' });
  }
});

router.get('/dict-batch', async (req, res) => {
  try {
    const categories = String(req.query.categories || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (categories.length === 0) {
      return res.status(400).json({ error: '请传入 categories 参数' });
    }
    const items = await prisma.systemDict.findMany({
      where: { category: { in: categories }, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
    const grouped: Record<string, typeof items> = {};
    for (const it of items) {
      if (!grouped[it.category]) grouped[it.category] = [];
      grouped[it.category].push(it);
    }
    res.json(grouped);
  } catch (err) {
    console.error('批量获取字典失败:', err);
    res.status(500).json({ error: '批量获取字典失败' });
  }
});

router.get('/dict', async (req, res) => {
  try {
    const { category, keyword } = req.query;
    const where: any = {};
    if (category && String(category).trim()) where.category = String(category);
    if (keyword && String(keyword).trim()) {
      where.OR = [
        { code: { contains: String(keyword) } },
        { name: { contains: String(keyword) } },
      ];
    }
    const items = await prisma.systemDict.findMany({
      where,
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
    });
    res.json(items);
  } catch (err) {
    console.error('获取字典列表失败:', err);
    res.status(500).json({ error: '获取字典列表失败' });
  }
});

router.post('/dict', roleGuard(['ADMIN']), async (req, res) => {
  try {
    const { category, code, name, color, sortOrder, isActive, remark, parentId } = req.body;
    if (!category || !code || !name) {
      return res.status(400).json({ error: 'category/code/name 必填' });
    }
    const existing = await prisma.systemDict.findUnique({
      where: { category_code: { category: String(category), code: String(code) } },
    });
    if (existing) {
      return res.status(400).json({ error: '该分类下已存在相同 code 的字典项' });
    }
    const item = await prisma.systemDict.create({
      data: {
        category: String(category),
        code: String(code),
        name: String(name),
        color: color ? String(color) : null,
        sortOrder: Number(sortOrder) || 0,
        isActive: isActive !== false,
        remark: remark ? String(remark) : null,
        parentId: parentId != null ? Number(parentId) : null,
      },
    });
    clearDictCache(String(category));
    res.status(201).json(item);
  } catch (err) {
    console.error('创建字典项失败:', err);
    res.status(500).json({ error: '创建字典项失败' });
  }
});

router.put('/dict/:id', roleGuard(['ADMIN']), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, color, sortOrder, isActive, remark, parentId } = req.body;
    const existingItem = await prisma.systemDict.findUnique({ where: { id } });
    if (!existingItem) {
      return res.status(404).json({ error: '字典项不存在' });
    }
    const data: any = {};
    if (name !== undefined) data.name = String(name);
    if (color !== undefined) data.color = color ? String(color) : null;
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);
    if (isActive !== undefined) data.isActive = !!isActive;
    if (remark !== undefined) data.remark = remark ? String(remark) : null;
    if (parentId !== undefined) data.parentId = parentId != null ? Number(parentId) : null;

    const item = await prisma.systemDict.update({ where: { id }, data });
    clearDictCache(existingItem.category);
    if (data.category && data.category !== existingItem.category) {
      clearDictCache(data.category);
    }
    res.json(item);
  } catch (err) {
    console.error('修改字典项失败:', err);
    res.status(500).json({ error: '修改字典项失败' });
  }
});

router.delete('/dict/:id', roleGuard(['ADMIN']), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await prisma.systemDict.delete({ where: { id } });
    clearDictCache(item.category);
    res.json({ message: '删除成功' });
  } catch (err) {
    console.error('删除字典项失败:', err);
    res.status(500).json({ error: '删除字典项失败' });
  }
});

// =============== 知识点分布方案 ===============

router.get('/knowledge-distribution', async (req, res) => {
  try {
    const { schemeName, isActive } = req.query;
    const where: any = {};
    if (schemeName) where.schemeName = String(schemeName);
    if (isActive !== undefined) where.isActive = String(isActive) === 'true';

    const items = await prisma.systemKnowledgeDistribution.findMany({
      where,
      orderBy: [{ schemeName: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
    });
    const grouped: Record<string, typeof items> = {};
    for (const it of items) {
      if (!grouped[it.schemeName]) grouped[it.schemeName] = [];
      grouped[it.schemeName].push(it);
    }
    res.json({ items, grouped });
  } catch (err) {
    console.error('获取知识点分布失败:', err);
    res.status(500).json({ error: '获取知识点分布失败' });
  }
});

router.post('/knowledge-distribution', roleGuard(['ADMIN']), async (req, res) => {
  try {
    const { schemeName, description, categoryCode, categoryName, questionCount,
      scorePerQuestion, difficultyFrom, difficultyTo, sortOrder, isActive } = req.body;

    if (!schemeName || !categoryCode) {
      return res.status(400).json({ error: 'schemeName/categoryCode 必填' });
    }
    const item = await prisma.systemKnowledgeDistribution.create({
      data: {
        schemeName: String(schemeName),
        description: description ? String(description) : null,
        categoryCode: String(categoryCode),
        categoryName: categoryName ? String(categoryName) : null,
        questionCount: Number(questionCount) || 0,
        scorePerQuestion: Number(scorePerQuestion) || 0,
        difficultyFrom: Number(difficultyFrom) || 1,
        difficultyTo: Number(difficultyTo) || 3,
        sortOrder: Number(sortOrder) || 0,
        isActive: isActive !== false,
      },
    });
    res.status(201).json(item);
  } catch (err) {
    console.error('创建知识点分布失败:', err);
    res.status(500).json({ error: '创建知识点分布失败' });
  }
});

router.put('/knowledge-distribution/:id', roleGuard(['ADMIN']), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { schemeName, description, categoryCode, categoryName, questionCount,
      scorePerQuestion, difficultyFrom, difficultyTo, sortOrder, isActive } = req.body;

    const data: any = {};
    if (schemeName !== undefined) data.schemeName = String(schemeName);
    if (description !== undefined) data.description = description ? String(description) : null;
    if (categoryCode !== undefined) data.categoryCode = String(categoryCode);
    if (categoryName !== undefined) data.categoryName = categoryName ? String(categoryName) : null;
    if (questionCount !== undefined) data.questionCount = Number(questionCount);
    if (scorePerQuestion !== undefined) data.scorePerQuestion = Number(scorePerQuestion);
    if (difficultyFrom !== undefined) data.difficultyFrom = Number(difficultyFrom);
    if (difficultyTo !== undefined) data.difficultyTo = Number(difficultyTo);
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);
    if (isActive !== undefined) data.isActive = !!isActive;

    const item = await prisma.systemKnowledgeDistribution.update({ where: { id }, data });
    res.json(item);
  } catch (err) {
    console.error('修改知识点分布失败:', err);
    res.status(500).json({ error: '修改知识点分布失败' });
  }
});

router.delete('/knowledge-distribution/:id', roleGuard(['ADMIN']), async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.systemKnowledgeDistribution.delete({ where: { id } });
    res.json({ message: '删除成功' });
  } catch (err) {
    console.error('删除知识点分布失败:', err);
    res.status(500).json({ error: '删除知识点分布失败' });
  }
});

// =============== 批量初始化字典数据 ===============

const defaultDictData = [
  {
    category: 'ROLE',
    items: [
      { code: 'ADMIN', name: '管理员', color: '#f5222d', sortOrder: 1 },
      { code: 'INFECTION_OFFICER', name: '院感专员', color: '#fa541c', sortOrder: 2 },
      { code: 'DEPT_HEAD', name: '科主任', color: '#faad14', sortOrder: 3 },
      { code: 'DOCTOR', name: '医生', color: '#1890ff', sortOrder: 4 },
      { code: 'NURSE', name: '护士', color: '#52c41a', sortOrder: 5 },
    ],
  },
  {
    category: 'DEPARTMENT',
    items: [
      { code: 'INTERNAL', name: '内科', color: '#1890ff', sortOrder: 1 },
      { code: 'SURGERY', name: '外科', color: '#52c41a', sortOrder: 2 },
      { code: 'PEDIATRICS', name: '儿科', color: '#722ed1', sortOrder: 3 },
      { code: 'GYNECOLOGY', name: '妇产科', color: '#eb2f96', sortOrder: 4 },
      { code: 'ICU', name: 'ICU', color: '#fa541c', sortOrder: 5 },
      { code: 'EMERGENCY', name: '急诊科', color: '#f5222d', sortOrder: 6 },
      { code: 'LAB', name: '检验科', color: '#13c2c2', sortOrder: 7 },
      { code: 'RADIOLOGY', name: '放射科', color: '#faad14', sortOrder: 8 },
      { code: 'NURSING', name: '护理部', color: '#a0d911', sortOrder: 9 },
      { code: 'INFORMATION', name: '信息科', color: '#73d13d', sortOrder: 10 },
      { code: 'ALL', name: '全科', color: '#531dab', sortOrder: 11 },
    ],
  },
  {
    category: 'QUESTION_TYPE',
    items: [
      { code: 'SINGLE', name: '单选', color: '#1890ff', sortOrder: 1 },
      { code: 'MULTIPLE', name: '多选', color: '#52c41a', sortOrder: 2 },
      { code: 'JUDGE', name: '判断', color: '#faad14', sortOrder: 3 },
      { code: 'CASE', name: '案例', color: '#722ed1', sortOrder: 4 },
    ],
  },
  {
    category: 'QUESTION_CATEGORY',
    items: [
      { code: 'BASIC_THEORY', name: '基础理论', color: '#1890ff', sortOrder: 1 },
      { code: 'BASIC_KNOWLEDGE', name: '基础知识', color: '#52c41a', sortOrder: 2 },
      { code: 'BASIC_SKILL', name: '基本技能', color: '#faad14', sortOrder: 3 },
      { code: 'INFECTION_KNOWLEDGE', name: '院感知识', color: '#eb2f96', sortOrder: 4 },
      { code: 'PUBLIC', name: '公共卫生', color: '#13c2c2', sortOrder: 5 },
      { code: 'TRADITIONAL_CHINESE', name: '中医药学', color: '#722ed1', sortOrder: 6 },
    ],
  },
  {
    category: 'INFECTION_TAG',
    items: [
      { code: 'HAND_HYGIENE', name: '手卫生', color: '#1890ff', sortOrder: 1 },
      { code: 'MEDICAL_WASTE', name: '医疗废物', color: '#f5222d', sortOrder: 2 },
      { code: 'DISINFECTION', name: '消毒隔离', color: '#52c41a', sortOrder: 3 },
      { code: 'EXPOSURE', name: '职业暴露', color: '#faad14', sortOrder: 4 },
      { code: 'ISOLATION', name: '隔离防护', color: '#722ed1', sortOrder: 5 },
      { code: 'STERILIZATION', name: '无菌操作', color: '#eb2f96', sortOrder: 6 },
      { code: 'MDRO', name: '多重耐药菌', color: '#fa8c16', sortOrder: 7 },
      { code: 'AIR_QUALITY', name: '空气质量', color: '#13c2c2', sortOrder: 8 },
    ],
  },
  {
    category: 'HOSPITAL_LEVEL',
    items: [
      { code: 'COMMUNITY', name: '社区医院', color: '#52c41a', sortOrder: 1 },
      { code: 'TOWN', name: '乡镇卫生院', color: '#a0d911', sortOrder: 2 },
      { code: 'COUNTY', name: '县级医院', color: '#1890ff', sortOrder: 3 },
      { code: 'CITY', name: '市级医院', color: '#722ed1', sortOrder: 4 },
      { code: 'PROVINCIAL', name: '省级医院', color: '#f5222d', sortOrder: 5 },
    ],
  },
];

router.post('/dict/init', roleGuard(['ADMIN']), async (req, res) => {
  try {
    const { categories } = req.body;
    const targetCategories = categories
      ? String(categories).split(',').map((s) => s.trim()).filter(Boolean)
      : defaultDictData.map((d) => d.category);

    let created = 0;
    let skipped = 0;

    for (const dict of defaultDictData) {
      if (!targetCategories.includes(dict.category)) continue;

      for (const item of dict.items) {
        const existing = await prisma.systemDict.findUnique({
          where: { category_code: { category: dict.category, code: item.code } },
        });
        if (existing) {
          skipped++;
          continue;
        }
        await prisma.systemDict.create({
          data: {
            category: dict.category,
            code: item.code,
            name: item.name,
            color: item.color,
            sortOrder: item.sortOrder,
            isActive: true,
          },
        });
        created++;
      }
    }

    if (req.body.categories) {
        targetCategories.forEach(c => clearDictCache(c.trim()));
      } else {
        clearDictCache();
      }
    res.json({
      message: `初始化完成，新增 ${created} 条，跳过 ${skipped} 条已存在的记录`,
      created,
      skipped,
    });
  } catch (err) {
    console.error('初始化字典失败:', err);
    res.status(500).json({ error: '初始化字典失败' });
  }
});

router.post('/dict/batch', roleGuard(['ADMIN']), async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: '请传入 items 数组' });
    }

    const results = await Promise.allSettled(
      items.map(async (item: any) => {
        const { category, code, name, color, sortOrder, isActive, remark, parentId } = item;
        if (!category || !code || !name) {
          return { success: false, error: 'category/code/name 必填' };
        }
        const existing = await prisma.systemDict.findUnique({
          where: { category_code: { category: String(category), code: String(code) } },
        });
        if (existing) {
          return { success: false, error: '已存在相同记录' };
        }
        const result = await prisma.systemDict.create({
          data: {
            category: String(category),
            code: String(code),
            name: String(name),
            color: color ? String(color) : null,
            sortOrder: Number(sortOrder) || 0,
            isActive: isActive !== false,
            remark: remark ? String(remark) : null,
            parentId: parentId != null ? Number(parentId) : null,
          },
        });
        return { success: true, data: result };
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled' && (r as PromiseFulfilledResult<any>).value.success).length;
    const failedCount = results.length - successCount;

    res.json({ success: successCount > 0, successCount, failedCount, results });
  } catch (err) {
    console.error('批量创建字典失败:', err);
    res.status(500).json({ error: '批量创建字典失败' });
  }
});

// =============== Hospital ===============

router.get('/hospitals', async (req, res) => {
  try {
    const hospitals = await prisma.hospital.findMany({ orderBy: { id: 'asc' } });
    res.json(hospitals);
  } catch (err) {
    console.error('获取医院列表失败:', err);
    res.status(500).json({ error: '获取医院列表失败' });
  }
});

router.post('/hospitals', roleGuard(['ADMIN']), async (req, res) => {
  try {
    const { name, level } = req.body;
    if (!name) return res.status(400).json({ error: 'name 必填' });
    const data: any = { name: String(name), level: String(level || 'TOWNSHIP') };
    const hospital = await prisma.hospital.create({ data });
    res.status(201).json(hospital);
  } catch (err) {
    console.error('创建医院失败:', err);
    res.status(500).json({ error: '创建医院失败' });
  }
});

router.put('/hospitals/:id', roleGuard(['ADMIN']), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, level } = req.body;
    const data: any = {};
    if (name !== undefined) data.name = String(name);
    if (level !== undefined && level !== null) data.level = String(level);
    const hospital = await prisma.hospital.update({ where: { id }, data });
    res.json(hospital);
  } catch (err) {
    console.error('修改医院失败:', err);
    res.status(500).json({ error: '修改医院失败' });
  }
});

router.delete('/hospitals/:id', roleGuard(['ADMIN']), async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.hospital.delete({ where: { id } });
    res.json({ message: '删除成功' });
  } catch (err) {
    console.error('删除医院失败:', err);
    res.status(500).json({ error: '删除医院失败' });
  }
});

export default router;
