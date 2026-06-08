import prisma from '../lib/prisma';

export interface LearningMaterial {
  id: number;
  title: string;
  description?: string;
  type: string;
  content: string;
  category?: string;
  thumbnailUrl?: string;
  attachmentUrl?: string;
  viewCount: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const getMaterials = async (filters?: {
  keyword?: string;
  type?: string;
  category?: string;
  isActive?: boolean;
}): Promise<LearningMaterial[]> => {
  const where: any = {};
  
  if (filters) {
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      where.OR = [
        { title: { contains: kw, mode: 'insensitive' } },
        { description: { contains: kw, mode: 'insensitive' } },
      ];
    }
    if (filters.type) {
      where.type = filters.type;
    }
    if (filters.category) {
      where.category = filters.category;
    }
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
  }
  
  const materials = await prisma.learningMaterial.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
  });
  
  return materials.map(m => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  }));
};

export const getMaterialById = async (id: number): Promise<LearningMaterial | null> => {
  const material = await prisma.learningMaterial.findUnique({
    where: { id },
  });
  
  if (!material) return null;
  
  return {
    ...material,
    createdAt: material.createdAt.toISOString(),
    updatedAt: material.updatedAt.toISOString(),
  };
};

export const createMaterial = async (data: Omit<LearningMaterial, 'id' | 'viewCount' | 'createdAt' | 'updatedAt'>): Promise<LearningMaterial> => {
  const material = await prisma.learningMaterial.create({
    data: {
      ...data,
      viewCount: 0,
    },
  });
  
  return {
    ...material,
    createdAt: material.createdAt.toISOString(),
    updatedAt: material.updatedAt.toISOString(),
  };
};

export const updateMaterial = async (id: number, data: Partial<LearningMaterial>): Promise<LearningMaterial | null> => {
  const material = await prisma.learningMaterial.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });
  
  if (!material) return null;
  
  return {
    ...material,
    createdAt: material.createdAt.toISOString(),
    updatedAt: material.updatedAt.toISOString(),
  };
};

export const deleteMaterial = async (id: number): Promise<boolean> => {
  const result = await prisma.learningMaterial.delete({
    where: { id },
  });
  
  return !!result;
};

export const incrementViewCount = async (id: number): Promise<boolean> => {
  const result = await prisma.learningMaterial.update({
    where: { id },
    data: {
      viewCount: { increment: 1 },
      updatedAt: new Date(),
    },
  });
  
  return !!result;
};

export const getCategories = async (): Promise<string[]> => {
  const materials = await prisma.learningMaterial.findMany({
    select: { category: true },
    where: { category: { not: null } },
  });
  
  const categories = new Set(materials.map(m => m.category!).filter(Boolean));
  return Array.from(categories);
};

export const initSampleData = async () => {
  const count = await prisma.learningMaterial.count();
  if (count > 0) return;
  
  const sampleData = [
    {
      title: '院感防护基础培训',
      description: '医院感染防护的基础知识和操作规范',
      type: 'ARTICLE',
      content: '# 院感防护基础培训\n\n## 一、概述\n\n医院感染（简称院感）是指住院患者在医院内获得的感染，包括在住院期间发生的感染和在医院内获得出院后发生的感染。\n\n## 二、核心内容\n\n### 1. 手卫生规范\n- 洗手时机：接触患者前、进行无菌操作前、接触患者后、接触患者周围环境后\n- 六步洗手法：掌心相对、手心对手背、手指交叉、弯曲手指、拇指在掌心、指尖搓手心\n\n### 2. 个人防护用品（PPE）使用\n- 医用防护口罩：在接触空气传播疾病患者时使用\n- 护目镜/防护面屏：在可能接触患者血液、体液、分泌物时使用\n- 隔离衣：在接触传播疾病患者时使用\n- 手套：在接触患者血液、体液、分泌物时使用\n\n## 三、总结\n\n良好的院感防控意识和规范的操作流程是保护患者和医护人员安全的关键。',
      category: '培训',
      viewCount: 128,
      sortOrder: 0,
      isActive: true,
    },
    {
      title: '手卫生规范操作',
      description: '六步洗手法的详细操作指南',
      type: 'VIDEO',
      content: '这是一个关于手卫生规范操作的视频，详细演示了六步洗手法的每个步骤，包括准备工作、每个步骤的正确操作方法、洗手时间等内容。建议所有医护人员认真学习并掌握。',
      category: '操作',
      viewCount: 256,
      sortOrder: 1,
      isActive: true,
    },
    {
      title: '抗生素使用指南',
      description: '抗生素合理使用的指导文档',
      type: 'DOC',
      content: '抗生素是治疗细菌感染的重要药物，但不合理使用会导致细菌耐药性增加。本文档详细介绍了抗生素的使用原则、分级管理、常见耐药菌的治疗策略等内容。',
      category: '指南',
      viewCount: 89,
      sortOrder: 2,
      isActive: true,
    },
    {
      title: '院感应急演练方案',
      description: '医院感染暴发应急演练的完整方案',
      type: 'PDF',
      content: '本方案包含医院感染暴发应急演练的目的、组织、流程、评估等内容，是医院进行院感应急演练的重要参考文档。',
      category: '应急',
      viewCount: 45,
      sortOrder: 3,
      isActive: false,
    },
    {
      title: '院感知识考核题库',
      description: '院感知识考核的题目汇总',
      type: 'EXCEL',
      content: '包含各类院感知识考核题目，可用于日常练习和考核使用。',
      category: '题库',
      viewCount: 67,
      sortOrder: 4,
      isActive: true,
    },
    {
      title: '院感培训课件',
      description: '院感培训的PPT课件',
      type: 'PPT',
      content: '院感培训的完整PPT课件，包含理论讲解和实际操作演示。',
      category: '课件',
      viewCount: 34,
      sortOrder: 5,
      isActive: true,
    },
  ];
  
  await prisma.learningMaterial.createMany({
    data: sampleData,
  });
};
