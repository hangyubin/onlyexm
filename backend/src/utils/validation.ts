import { z } from 'zod';

export const questionOptionSchema = z.object({
  key: z.string().min(1, '选项key不能为空').optional(),
  optionKey: z.string().min(1, '选项key不能为空').optional(),
  content: z.string().min(1, '选项内容不能为空'),
  isCorrect: z.boolean(),
});

export const createQuestionSchema = z.object({
  content: z.string().min(1, '题目内容不能为空'),
  type: z.string(),
  category: z.string(),
  infectionTag: z.string().optional(),
  subCategory: z.string().optional(),
  difficulty: z.number().min(1).max(5).default(1),
  analysis: z.string().min(1, '答案解析不能为空'),
  standardSource: z.string().optional(),
  options: z.array(questionOptionSchema).min(2, '至少需要2个选项'),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;

export const updateQuestionSchema = z.object({
  content: z.string().min(1).optional(),
  type: z.string().optional(),
  category: z.string().optional(),
  infectionTag: z.string().optional(),
  subCategory: z.string().optional(),
  difficulty: z.number().min(1).max(5).optional(),
  analysis: z.string().optional(),
  standardSource: z.string().optional(),
  options: z.array(questionOptionSchema).min(2).optional(),
  sanjiCategory: z.string().optional(),
  infectionTags: z.array(z.string()).optional(),
  source: z.string().optional(),
});

export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;

export const queryQuestionSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  type: z.string().optional(),
  category: z.string().optional(),
  subCategory: z.string().optional(),
  sanjiCategory: z.string().optional(),
  infectionTag: z.string().optional(),
  infectionTags: z.array(z.string()).optional(),
  difficulty: z.string().optional(),
  keyword: z.string().optional(),
  content: z.string().optional(),
});

export type QueryQuestionInput = z.infer<typeof queryQuestionSchema>;
