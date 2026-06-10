import prisma from '../lib/prisma';
import * as ExcelJS from 'exceljs';
import { getDictItems, clearDictCache, DictItem } from '../utils/dictCache';

type Question = Awaited<ReturnType<typeof prisma.question.findMany>>[number];

export interface QuestionWithOptions extends Question {
  options: {
    id?: number;
    optionKey: string;
    content: string;
    isCorrect: boolean;
  }[];
}

/** 统一的分类规范化方法：支持中/英文名或 code 都能落到 code 上 */
async function normalizeCategory(categoryStr: string | undefined | null): Promise<string> {
  if (!categoryStr) return '';
  const items = await getDictItems('QUESTION_CATEGORY');
  const hit = items.find((i) => i.code === categoryStr || i.name === categoryStr);
  return hit ? hit.code : String(categoryStr);
}

async function normalizeInfectionTag(tagStr: string | undefined | null): Promise<string | null> {
  if (!tagStr) return null;
  // 先从 QUESTION_CATEGORY 子分类查找，兼容旧 INFECTION_TAG
  const categoryItems = await getDictItems('QUESTION_CATEGORY');
  const hit = categoryItems.find((i) => i.code === tagStr || i.name === tagStr);
  if (hit) return hit.code;
  // 兼容旧的 INFECTION_TAG 分类
  const tagItems = await getDictItems('INFECTION_TAG');
  const tagHit = tagItems.find((i) => i.code === tagStr || i.name === tagStr);
  return tagHit ? tagHit.code : tagStr;
}

async function normalizeSubCategory(subCategoryStr: string | undefined | null): Promise<string | null> {
  if (!subCategoryStr) return null;
  // 从 QUESTION_CATEGORY 中查找子分类
  const items = await getDictItems('QUESTION_CATEGORY');
  const hit = items.find((i) => i.code === subCategoryStr || i.name === subCategoryStr);
  return hit ? hit.code : subCategoryStr;
}

async function normalizeType(typeStr: string | undefined | null): Promise<string> {
  if (!typeStr) return 'SINGLE';
  const items = await getDictItems('QUESTION_TYPE');
  const hit = items.find((i) => i.code === typeStr || i.name === typeStr);
  return hit ? hit.code : String(typeStr);
}

// ============================================================
// 导出给 routes/question.ts 使用的公共方法
// ============================================================

export async function createQuestion(
  data: {
    content?: string;
    type?: string;
    category?: string;
    infectionTag?: string;
    subCategory?: string;
    difficulty?: number;
    analysis?: string;
    standardSource?: string;
    options?: { optionKey?: string; key?: string; content?: string; isCorrect?: boolean }[];
  }
): Promise<QuestionWithOptions> {
  const normalized = {
    category: await normalizeCategory(data.category),
    type: await normalizeType(data.type),
    infectionTag: await normalizeInfectionTag(data.infectionTag),
    subCategory: await normalizeSubCategory(data.subCategory),
  };

  // 如果有 subCategory 但没有 infectionTag，自动同步
  const infectionTagValue = normalized.infectionTag || normalized.subCategory || undefined;
  const subCategoryValue = normalized.subCategory || normalized.infectionTag || undefined;

  const rawQuestion = await prisma.question.create({
    data: {
      content: String(data.content),
      type: (normalized.type || 'SINGLE') as any,
      category: (normalized.category || 'BASIC_KNOWLEDGE') as any,
      infectionTag: (infectionTagValue || undefined) as any,
      subCategory: (subCategoryValue || undefined) as any,
      difficulty: Number(data.difficulty) || 1,
      analysis: String(data.analysis ?? ''),
      standardSource: data.standardSource ? String(data.standardSource) : null,
      options: {
        create: (data.options || []).map((opt, idx) => ({
          optionKey: String(opt.optionKey || opt.key || `OPTION_${idx + 1}`),
          content: String(opt.content),
          isCorrect: !!opt.isCorrect,
        })),
      },
    },
    include: { options: true },
  });

  return rawQuestion as QuestionWithOptions;
}

export async function updateQuestion(
  id: number,
  data: {
    content?: string;
    type?: string;
    category?: string;
    infectionTag?: string;
    subCategory?: string;
    difficulty?: number;
    analysis?: string;
    standardSource?: string;
    options?: { optionKey?: string; key?: string; content?: string; isCorrect?: boolean }[];
  }
): Promise<QuestionWithOptions | null> {
  try {
    const updateData: any = {};
    if (data.content !== undefined) updateData.content = String(data.content);
    if (data.type !== undefined) updateData.type = await normalizeType(data.type);
    if (data.category !== undefined) updateData.category = await normalizeCategory(data.category);
    if (data.infectionTag !== undefined) {
      const v = await normalizeInfectionTag(data.infectionTag);
      updateData.infectionTag = v;
      // 同步 subCategory
      updateData.subCategory = v;
    }
    if (data.subCategory !== undefined) {
      const v = await normalizeSubCategory(data.subCategory);
      updateData.subCategory = v;
      // 同步 infectionTag
      updateData.infectionTag = v;
    }
    if (data.difficulty !== undefined) updateData.difficulty = Number(data.difficulty) || 1;
    if (data.analysis !== undefined) updateData.analysis = String(data.analysis ?? '');
    if (data.standardSource !== undefined) updateData.standardSource = data.standardSource;

    // 先更新题干
    const updated = await prisma.question.update({
      where: { id, deletedAt: null },
      data: updateData,
      include: { options: true },
    });

    // 若传入 options 则替换
    if (data.options && Array.isArray(data.options)) {
      await prisma.questionOption.deleteMany({ where: { questionId: id } });
      await prisma.questionOption.createMany({
        data: data.options.map((opt, idx) => ({
          questionId: id,
          optionKey: String(opt.optionKey || opt.key || `OPTION_${idx + 1}`),
          content: String(opt.content),
          isCorrect: !!opt.isCorrect,
        })),
      });
      const q = await prisma.question.findUnique({
        where: { id },
        include: { options: true },
      });
      return q as QuestionWithOptions;
    }

    return updated as QuestionWithOptions;
  } catch (error) {
    console.error('Update question error:', error);
    return null;
  }
}

export async function deleteQuestion(id: number): Promise<boolean> {
  try {
    await prisma.question.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return true;
  } catch {
    return false;
  }
}

export async function getQuestionById(id: number): Promise<QuestionWithOptions | null> {
  const q = await prisma.question.findUnique({
    where: { id, deletedAt: null },
    include: { options: true },
  });
  return q as QuestionWithOptions | null;
}

export interface QueryQuestionInput {
  page?: number;
  pageSize?: number;
  type?: string;
  category?: string;
  sanjiCategory?: string;
  infectionTag?: string;
  infectionTags?: string[];
  subCategory?: string;
  subCategories?: string[];
  difficulty?: number | string;
  keyword?: string;
  content?: string;
}

export async function getQuestions(
  query: QueryQuestionInput
): Promise<{ data: QuestionWithOptions[]; total: number }> {
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 10;

  const where: any = { deletedAt: null };

  // 题型
  if (query.type && String(query.type).trim()) {
    where.type = String(query.type).trim();
  }

  // 分类（允许前端传 sanjiCategory 或 category；支持 "THREE_BASE" 这种逻辑分组）
  const rawCategory = query.category || query.sanjiCategory;
  if (rawCategory && String(rawCategory).trim()) {
    const cat = String(rawCategory).trim();
    if (cat === 'THREE_BASE') {
      const items = await getDictItems('QUESTION_CATEGORY');
      const codes = items
        .filter((i) => /BASIC/i.test(i.code))
        .map((i) => i.code);
      if (codes.length > 0) {
        where.category = { in: codes };
      }
    } else {
      where.category = cat;
    }
  }

  // 难度
  if (query.difficulty !== undefined && query.difficulty !== null && String(query.difficulty).trim()) {
    where.difficulty = parseInt(String(query.difficulty), 10) || 1;
  }

  // 院感标签：支持单个字符串逗号分隔 或 数组
  const tags: string[] = [];
  if (query.infectionTag) {
    tags.push(...String(query.infectionTag).split(',').map((s) => s.trim()).filter(Boolean));
  }
  if (query.infectionTags && Array.isArray(query.infectionTags)) {
    tags.push(...query.infectionTags);
  }
  if (tags.length > 0) {
    where.infectionTag = { in: tags };
  }

  // 二级分类筛选（subCategory）
  const subCategories: string[] = [];
  if (query.subCategory) {
    subCategories.push(...String(query.subCategory).split(',').map((s) => s.trim()).filter(Boolean));
  }
  if (query.subCategories && Array.isArray(query.subCategories)) {
    subCategories.push(...query.subCategories);
  }
  if (subCategories.length > 0) {
    // 同时匹配 subCategory 和 infectionTag（兼容旧数据）
    where.OR = [
      { subCategory: { in: subCategories } },
      { infectionTag: { in: subCategories }, subCategory: null },
    ];
  }

  // 关键字
  if (query.keyword) {
    where.content = { contains: String(query.keyword) };
  }
  if (query.content) {
    where.content = { contains: String(query.content) };
  }

  const [rawData, total] = await Promise.all([
    prisma.question.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: { options: true },
    }),
    prisma.question.count({ where }),
  ]);

  return { data: rawData as QuestionWithOptions[], total };
}

// ============================================================
// Excel 模板 / 批量导入
// ============================================================

export async function downloadTemplate(): Promise<any> {
  const [typeItems, categoryItems] = await Promise.all([
    getDictItems('QUESTION_TYPE'),
    getDictItems('QUESTION_CATEGORY'),
  ]);

  // 获取子分类（院感知识下的子分类）
  const subCategoryItems = categoryItems; // QUESTION_CATEGORY 现在包含所有层级

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('题目模板');

  worksheet.columns = [
    { header: '题目内容', key: 'content', width: 40 },
    { header: `题型（支持: ${typeItems.map((i) => i.name).join('/')}）`, key: 'type', width: 20 },
    { header: `分类（支持: ${categoryItems.filter((i) => !['HAND_HYGIENE','MEDICAL_WASTE','DISINFECTION','EXPOSURE','ISOLATION','STERILIZATION','MDRO','AIR_QUALITY'].includes(i.code)).map((i) => i.name).join('/')}）`, key: 'category', width: 20 },
    { header: `二级分类/院感标签（支持: ${subCategoryItems.filter((i) => ['HAND_HYGIENE','MEDICAL_WASTE','DISINFECTION','EXPOSURE','ISOLATION','STERILIZATION','MDRO','AIR_QUALITY'].includes(i.code)).map((i) => i.name).join('/')}）⚠️分类为「院感知识」时必填！`, key: 'subCategory', width: 20 },
    { header: '难度（1-5数字）', key: 'difficulty', width: 10 },
    { header: '解析', key: 'analysis', width: 40 },
    { header: '选项A', key: 'optionA', width: 30 },
    { header: '选项B', key: 'optionB', width: 30 },
    { header: '选项C', key: 'optionC', width: 30 },
    { header: '选项D', key: 'optionD', width: 30 },
    { header: '选项E', key: 'optionE', width: 30 },
    { header: '正确答案(多个用逗号分隔，如 A,B)', key: 'correctAnswer', width: 30 },
  ];

  // 示例行
  const example: Record<string, string> = {
    content: '七步洗手法的时间要求是？',
    type: typeItems[0]?.name || '单选题',
    category: '院感知识',
    subCategory: '手卫生',
    difficulty: '1',
    analysis: '七步洗手法要求每个步骤至少揉搓10-15秒',
    optionA: '10-15秒',
    optionB: '5-10秒',
    optionC: '20-30秒',
    optionD: '1-2分钟',
    optionE: '',
    correctAnswer: 'A',
  };
  worksheet.addRow(example);

  worksheet.getRow(1).font = { bold: true };

  // 添加填写说明 sheet
  const noteSheet = workbook.addWorksheet('填写说明');
  noteSheet.columns = [
    { header: '字段', key: 'field', width: 25 },
    { header: '说明', key: 'desc', width: 60 },
  ];
  noteSheet.getRow(1).font = { bold: true };

  // ⚠️ 重要提醒行（红色加粗）
  const warnRow = noteSheet.addRow({ field: '⚠️ 重要提醒', desc: '分类为「院感知识」的题目，必须在「二级分类/院感标签」列填写院感标签，否则导入失败！' });
  warnRow.font = { color: { argb: 'FFFF0000' }, bold: true };
  warnRow.height = 25;

  noteSheet.addRow({ field: '', desc: '' }); // 空行分隔
  noteSheet.addRow({ field: '题目内容', desc: '必填，题目正文' });
  noteSheet.addRow({ field: '题型', desc: '必填，支持：单选题、多选题、判断题' });
  noteSheet.addRow({ field: '分类', desc: '必填，支持：基础理论、基础知识、基本技能、院感知识、公共卫生、中医药学' });
  noteSheet.addRow({ field: '二级分类/院感标签', desc: '【院感知识必填】八种院感标签：手卫生、医疗废物、消毒隔离、职业暴露、隔离防护、无菌操作、多重耐药菌、空气质量。其他分类可留空。' });
  noteSheet.addRow({ field: '难度', desc: '1-5 数字，1最简单' });
  noteSheet.addRow({ field: '解析', desc: '必填，答案解析' });
  noteSheet.addRow({ field: '选项A-E', desc: '至少填写A、B两个选项' });
  noteSheet.addRow({ field: '正确答案', desc: '必填，多个正确答案用逗号分隔，如 A,B' });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

export async function batchImportQuestions(buffer: any): Promise<{
  success: number;
  failed: number;
  failedDetails: string[];
}> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) {
    return { success: 0, failed: 1, failedDetails: ['Excel 文件为空'] };
  }

  const rows = worksheet.getRows(2, Math.max(worksheet.rowCount - 1, 1)) || [];
  const typeItems = await getDictItems('QUESTION_TYPE');
  const categoryItems = await getDictItems('QUESTION_CATEGORY');

  // 一级分类 code 列表（排除子分类）
  const topLevelCodes = categoryItems
    .filter((i) => !['HAND_HYGIENE','MEDICAL_WASTE','DISINFECTION','EXPOSURE','ISOLATION','STERILIZATION','MDRO','AIR_QUALITY'].includes(i.code))
    .map((i) => i.code);
  // 子分类 code 列表
  const subCategoryCodes = categoryItems
    .filter((i) => ['HAND_HYGIENE','MEDICAL_WASTE','DISINFECTION','EXPOSURE','ISOLATION','STERILIZATION','MDRO','AIR_QUALITY'].includes(i.code))
    .map((i) => i.code);

  const lookup = (items: DictItem[], value: any): string | null => {
    if (value === undefined || value === null || value === '') return null;
    const v = String(value).trim();
    const hit = items.find((i) => i.code === v || i.name === v);
    return hit ? hit.code : null;
  };

  const questionsToCreate: any[] = [];
  let success = 0;
  let failed = 0;
  const failedDetails: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2;
    try {
      const content = row.getCell(1).value ? String(row.getCell(1).value) : '';
      const typeStr = row.getCell(2).value ? String(row.getCell(2).value) : '';
      const categoryStr = row.getCell(3).value ? String(row.getCell(3).value) : '';
      const subCategoryStr = row.getCell(4).value ? String(row.getCell(4).value) : '';
      const difficulty = parseInt(String(row.getCell(5).value || '1'), 10) || 1;
      const analysis = row.getCell(6).value ? String(row.getCell(6).value) : '';

      if (!content || !typeStr) {
        failedDetails.push(`第${rowNumber}行：题目内容或题型为空`);
        failed++;
        continue;
      }

      const type = lookup(typeItems, typeStr);
      if (!type) {
        failedDetails.push(`第${rowNumber}行：无效的题型 "${typeStr}"`);
        failed++;
        continue;
      }

      const category = lookup(categoryItems, categoryStr) || categoryItems[0]?.code || 'BASIC_KNOWLEDGE';
      const subCategory = lookup(categoryItems, subCategoryStr);

      // 校验：院感知识分类必须填写院感标签
      const infectionKnowledgeCode = 'INFECTION_KNOWLEDGE';
      if (category === infectionKnowledgeCode && !subCategory) {
        failedDetails.push(`第${rowNumber}行：分类为「院感知识」，必须填写「二级分类/院感标签」！可选：手卫生、医疗废物、消毒隔离、职业暴露、隔离防护、无菌操作、多重耐药菌、空气质量`);
        failed++;
        continue;
      }

      const options: { optionKey: string; content: string; isCorrect: boolean }[] = [];
      const letters = ['A', 'B', 'C', 'D', 'E'];
      for (let j = 0; j < 5; j++) {
        const cell = row.getCell(7 + j).value;
        const optionContent = cell ? String(cell) : '';
        if (optionContent && optionContent.trim()) {
          options.push({
            optionKey: letters[j],
            content: optionContent.trim(),
            isCorrect: false,
          });
        }
      }

      // 判断/单选缺选项时兜底
      if (type === 'JUDGE' && options.length === 0) {
        options.push({ optionKey: 'A', content: '正确', isCorrect: false });
        options.push({ optionKey: 'B', content: '错误', isCorrect: false });
      }

      const correctAnswerStr = row.getCell(12).value ? String(row.getCell(12).value) : '';
      if (correctAnswerStr) {
        const correctAnswers = correctAnswerStr
          .split(',')
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean);
        options.forEach((opt) => {
          if (correctAnswers.includes(opt.optionKey.toUpperCase())) {
            opt.isCorrect = true;
          }
        });
      }

      const data: any = {
        content,
        type,
        category,
        difficulty,
        analysis,
        options: {
          create: options,
        },
      };
      if (subCategory) {
        data.infectionTag = subCategory;
        data.subCategory = subCategory;
      }

      questionsToCreate.push({ data });
    } catch (error) {
      failedDetails.push(`第${rowNumber}行：${(error as Error).message}`);
      failed++;
    }
  }

  // 批量创建题目（使用事务确保一致性）
  if (questionsToCreate.length > 0) {
    await prisma.$transaction(
      questionsToCreate.map((q) => prisma.question.create(q))
    );
    success = questionsToCreate.length;
  }

  return { success, failed, failedDetails };
}
