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
  const totalCount = await prisma.learningMaterial.count();

  // 仅当数据库完全没有学习资料时，初始化样例数据
  if (totalCount === 0) {
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
        title: '医疗废物分类与处置',
        description: '医疗废物的正确分类和处置流程',
        type: 'PDF',
        content: '医疗废物的分类管理是院感防控的重要环节，正确的分类和处置可以有效防止交叉感染。本资料详细介绍了医疗废物的分类标准、包装要求、暂存和转运流程。',
        category: '应急',
        viewCount: 67,
        sortOrder: 3,
        isActive: true,
      },
      {
        title: '多重耐药菌防控知识',
        description: '多重耐药菌的识别与防控措施',
        type: 'ARTICLE',
        content: '多重耐药菌（MDRO）是医院感染防控的重点，包括MRSA、VRE、CRE、CRAB等。本资料介绍了多重耐药菌的流行病学特征、识别方法、隔离措施和治疗原则。',
        category: '培训',
        viewCount: 95,
        sortOrder: 4,
        isActive: true,
      },
      {
        title: '职业暴露应急处理',
        description: '医护人员职业暴露后的应急处理流程',
        type: 'DOC',
        content: '职业暴露是医护人员面临的重要职业风险，包括锐器伤、黏膜暴露等。本资料详细介绍了职业暴露的定义、风险评估、局部处理、报告流程和预防用药建议。',
        category: '指南',
        viewCount: 76,
        sortOrder: 5,
        isActive: true,
      },
    ];

    await prisma.learningMaterial.createMany({
      data: sampleData,
    });
    console.log(`已初始化 ${sampleData.length} 条学习资料样例数据`);
  }
};
