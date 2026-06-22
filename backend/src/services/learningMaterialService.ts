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
}, pagination?: {
  page?: number;
  pageSize?: number;
}): Promise<{ data: LearningMaterial[]; total: number }> => {
  const where: any = {};
  
  if (filters) {
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      where.OR = [
        { title: { contains: kw } },
        { description: { contains: kw } },
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

  const page = Math.max(1, pagination?.page || 1);
  const pageSize = Math.min(100, Math.max(1, pagination?.pageSize || 20));
  
  const [materials, total] = await Promise.all([
    prisma.learningMaterial.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.learningMaterial.count({ where }),
  ]);
  
  return {
    data: materials.map(m => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    })),
    total,
  };
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
  try {
    const material = await prisma.learningMaterial.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return {
      ...material,
      createdAt: material.createdAt.toISOString(),
      updatedAt: material.updatedAt.toISOString(),
    };
  } catch (error: any) {
    if (error?.code === 'P2025') return null;
    throw error;
  }
};

export const deleteMaterial = async (id: number): Promise<boolean> => {
  try {
    await prisma.learningMaterial.delete({
      where: { id },
    });
    return true;
  } catch (error: any) {
    if (error?.code === 'P2025') return false;
    throw error;
  }
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
