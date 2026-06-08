import fs from 'fs';
import path from 'path';

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

const DATA_FILE = path.join(__dirname, '../../data/learningMaterials.json');

const ensureDataFile = () => {
  if (!fs.existsSync(path.dirname(DATA_FILE))) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
  }
};

export const getMaterials = (filters?: {
  keyword?: string;
  type?: string;
  category?: string;
  isActive?: boolean;
}): LearningMaterial[] => {
  ensureDataFile();
  let materials: LearningMaterial[] = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  
  if (filters) {
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      materials = materials.filter(m => 
        m.title.toLowerCase().includes(kw) || 
        m.description?.toLowerCase().includes(kw)
      );
    }
    if (filters.type) {
      materials = materials.filter(m => m.type === filters.type);
    }
    if (filters.category) {
      materials = materials.filter(m => m.category === filters.category);
    }
    if (filters.isActive !== undefined) {
      materials = materials.filter(m => m.isActive === filters.isActive);
    }
  }
  
  return materials.sort((a, b) => a.sortOrder - b.sortOrder);
};

export const getMaterialById = (id: number): LearningMaterial | null => {
  ensureDataFile();
  const materials: LearningMaterial[] = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  return materials.find(m => m.id === id) || null;
};

export const createMaterial = (data: Omit<LearningMaterial, 'id' | 'viewCount' | 'createdAt' | 'updatedAt'>): LearningMaterial => {
  ensureDataFile();
  const materials: LearningMaterial[] = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  
  const newMaterial: LearningMaterial = {
    ...data,
    id: materials.length > 0 ? Math.max(...materials.map(m => m.id)) + 1 : 1,
    viewCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  materials.push(newMaterial);
  fs.writeFileSync(DATA_FILE, JSON.stringify(materials, null, 2));
  
  return newMaterial;
};

export const updateMaterial = (id: number, data: Partial<LearningMaterial>): LearningMaterial | null => {
  ensureDataFile();
  const materials: LearningMaterial[] = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  const index = materials.findIndex(m => m.id === id);
  
  if (index === -1) return null;
  
  materials[index] = {
    ...materials[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  
  fs.writeFileSync(DATA_FILE, JSON.stringify(materials, null, 2));
  
  return materials[index];
};

export const deleteMaterial = (id: number): boolean => {
  ensureDataFile();
  const materials: LearningMaterial[] = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  const filtered = materials.filter(m => m.id !== id);
  
  if (filtered.length === materials.length) return false;
  
  fs.writeFileSync(DATA_FILE, JSON.stringify(filtered, null, 2));
  return true;
};

export const incrementViewCount = (id: number): boolean => {
  ensureDataFile();
  const materials: LearningMaterial[] = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  const index = materials.findIndex(m => m.id === id);
  
  if (index === -1) return false;
  
  materials[index].viewCount++;
  materials[index].updatedAt = new Date().toISOString();
  
  fs.writeFileSync(DATA_FILE, JSON.stringify(materials, null, 2));
  return true;
};

export const getCategories = (): string[] => {
  ensureDataFile();
  const materials: LearningMaterial[] = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  const categories = new Set(materials.map(m => m.category).filter(Boolean));
  return Array.from(categories);
};

export const initSampleData = () => {
  ensureDataFile();
  const materials: LearningMaterial[] = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  
  if (materials.length > 0) return;
  
  const sampleData: LearningMaterial[] = [
    {
      id: 1,
      title: '院感防护基础培训',
      description: '医院感染防护的基础知识和操作规范',
      type: 'ARTICLE',
      content: '# 院感防护基础培训\n\n## 一、概述\n\n医院感染（简称院感）是指住院患者在医院内获得的感染，包括在住院期间发生的感染和在医院内获得出院后发生的感染。\n\n## 二、核心内容\n\n### 1. 手卫生规范\n- 洗手时机：接触患者前、进行无菌操作前、接触患者后、接触患者周围环境后\n- 六步洗手法：掌心相对、手心对手背、手指交叉、弯曲手指、拇指在掌心、指尖搓手心\n\n### 2. 个人防护用品（PPE）使用\n- 医用防护口罩：在接触空气传播疾病患者时使用\n- 护目镜/防护面屏：在可能接触患者血液、体液、分泌物时使用\n- 隔离衣：在接触传播疾病患者时使用\n- 手套：在接触患者血液、体液、分泌物时使用\n\n## 三、总结\n\n良好的院感防控意识和规范的操作流程是保护患者和医护人员安全的关键。',
      category: '培训',
      viewCount: 128,
      sortOrder: 0,
      isActive: true,
      createdAt: new Date('2024-01-15').toISOString(),
      updatedAt: new Date('2024-01-15').toISOString(),
    },
    {
      id: 2,
      title: '手卫生规范操作',
      description: '六步洗手法的详细操作指南',
      type: 'VIDEO',
      content: '这是一个关于手卫生规范操作的视频，详细演示了六步洗手法的每个步骤，包括准备工作、每个步骤的正确操作方法、洗手时间等内容。建议所有医护人员认真学习并掌握。',
      category: '操作',
      viewCount: 256,
      sortOrder: 1,
      isActive: true,
      createdAt: new Date('2024-01-16').toISOString(),
      updatedAt: new Date('2024-01-16').toISOString(),
    },
    {
      id: 3,
      title: '抗生素使用指南',
      description: '抗生素合理使用的指导文档',
      type: 'DOC',
      content: '抗生素是治疗细菌感染的重要药物，但不合理使用会导致细菌耐药性增加。本文档详细介绍了抗生素的使用原则、分级管理、常见耐药菌的治疗策略等内容。',
      category: '指南',
      viewCount: 89,
      sortOrder: 2,
      isActive: true,
      createdAt: new Date('2024-01-17').toISOString(),
      updatedAt: new Date('2024-01-17').toISOString(),
    },
    {
      id: 4,
      title: '院感应急演练方案',
      description: '医院感染暴发应急演练的完整方案',
      type: 'PDF',
      content: '本方案包含医院感染暴发应急演练的目的、组织、流程、评估等内容，是医院进行院感应急演练的重要参考文档。',
      category: '应急',
      viewCount: 45,
      sortOrder: 3,
      isActive: false,
      createdAt: new Date('2024-01-18').toISOString(),
      updatedAt: new Date('2024-01-18').toISOString(),
    },
    {
      id: 5,
      title: '院感知识考核题库',
      description: '院感知识考核的题目汇总',
      type: 'EXCEL',
      content: '包含各类院感知识考核题目，可用于日常练习和考核使用。',
      category: '题库',
      viewCount: 67,
      sortOrder: 4,
      isActive: true,
      createdAt: new Date('2024-01-19').toISOString(),
      updatedAt: new Date('2024-01-19').toISOString(),
    },
    {
      id: 6,
      title: '院感培训课件',
      description: '院感培训的PPT课件',
      type: 'PPT',
      content: '院感培训的完整PPT课件，包含理论讲解和实际操作演示。',
      category: '课件',
      viewCount: 34,
      sortOrder: 5,
      isActive: true,
      createdAt: new Date('2024-01-20').toISOString(),
      updatedAt: new Date('2024-01-20').toISOString(),
    },
  ];
  
  fs.writeFileSync(DATA_FILE, JSON.stringify(sampleData, null, 2));
};