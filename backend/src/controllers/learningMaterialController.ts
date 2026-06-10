import { Request, Response } from 'express';
import * as learningMaterialService from '../services/learningMaterialService';

export const getLearningMaterials = async (req: Request, res: Response) => {
  try {
    const { keyword, type, category, isActive } = req.query;
    
    const filters: {
      keyword?: string;
      type?: string;
      category?: string;
      isActive?: boolean;
    } = {};
    
    if (keyword) filters.keyword = keyword;
    if (type) filters.type = type;
    if (category) filters.category = category;
    if (isActive !== undefined && isActive !== '') {
      filters.isActive = isActive === 'true';
    }
    
    const materials = await learningMaterialService.getMaterials(filters);
    res.json({ success: true, data: materials });
  } catch (error) {
    console.error('Get learning materials error:', error);
    res.status(500).json({ success: false, message: '获取学习资料列表失败' });
  }
};

export const getLearningMaterialById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const material = await learningMaterialService.getMaterialById(parseInt(id));
    
    if (!material) {
      return res.status(404).json({ success: false, message: '学习资料不存在' });
    }
    
    await learningMaterialService.incrementViewCount(parseInt(id));
    
    res.json({ success: true, data: material });
  } catch (error) {
    console.error('Get learning material error:', error);
    res.status(500).json({ success: false, message: '获取学习资料失败' });
  }
};

export const createLearningMaterial = async (req: Request, res: Response) => {
  try {
    const { title, description, type, content, category, thumbnailUrl, attachmentUrl, sortOrder, isActive } = req.body;
    
    const material = await learningMaterialService.createMaterial({
      title,
      description,
      type,
      content,
      category,
      thumbnailUrl,
      attachmentUrl,
      sortOrder: sortOrder || 0,
      isActive: isActive !== false,
    });
    
    res.json({ success: true, data: material, message: '创建成功' });
  } catch (error) {
    console.error('Create learning material error:', error);
    res.status(500).json({ success: false, message: '创建学习资料失败' });
  }
};

export const updateLearningMaterial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, type, content, category, thumbnailUrl, attachmentUrl, sortOrder, isActive } = req.body;
    
    const data: Partial<learningMaterialService.LearningMaterial> = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (type !== undefined) data.type = type;
    if (content !== undefined) data.content = content;
    if (category !== undefined) data.category = category;
    if (thumbnailUrl !== undefined) data.thumbnailUrl = thumbnailUrl;
    if (attachmentUrl !== undefined) data.attachmentUrl = attachmentUrl;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;
    if (isActive !== undefined) data.isActive = isActive;
    
    const material = await learningMaterialService.updateMaterial(parseInt(id), data);
    
    if (!material) {
      return res.status(404).json({ success: false, message: '学习资料不存在' });
    }
    
    res.json({ success: true, data: material, message: '更新成功' });
  } catch (error) {
    console.error('Update learning material error:', error);
    res.status(500).json({ success: false, message: '更新学习资料失败' });
  }
};

export const deleteLearningMaterial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await learningMaterialService.deleteMaterial(parseInt(id));
    
    if (!success) {
      return res.status(404).json({ success: false, message: '学习资料不存在' });
    }
    
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('Delete learning material error:', error);
    res.status(500).json({ success: false, message: '删除学习资料失败' });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await learningMaterialService.getCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: '获取分类列表失败' });
  }
};
