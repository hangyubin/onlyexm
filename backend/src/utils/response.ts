import { Response } from 'express';

/**
 * 统一成功响应
 */
export function success(res: Response, data?: any, message?: string) {
  return res.json({
    code: 0,
    data: data ?? null,
    message: message || 'success',
  });
}

/**
 * 统一分页响应
 */
export function paginate(res: Response, data: any[], total: number, page?: number, pageSize?: number) {
  return res.json({
    code: 0,
    data,
    total,
    ...(page !== undefined && { page, pageSize }),
  });
}

/**
 * 统一错误响应
 */
export function error(res: Response, status: number, message: string) {
  return res.status(status).json({
    code: -1,
    message,
  });
}
