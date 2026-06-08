import { Request, Response, NextFunction } from 'express';

// ===================== 角色定义 =====================
// 可进入管理后台的角色
export const ADMIN_ROLES = [
  'ADMIN',           // 系统管理员 - 全部权限
  'INFECTION_OFFICER', // 院感专员 - 院感相关全部权限
  'MEDICAL_AFFAIRS',   // 医务科 - 考试/报表权限
  'VICE_DEAN',         // 业务院长 - 全部查看权限
  'DEPT_HEAD',         // 科室主任 - 本科室数据权限
];

// 权限等级
export type PermissionLevel = 'all' | 'infection' | 'exam' | 'report' | 'department' | 'none';

// 权限配置：不同角色对应不同权限等级
export const ROLE_PERMISSIONS: Record<string, PermissionLevel> = {
  'ADMIN': 'all',
  'INFECTION_OFFICER': 'infection',
  'MEDICAL_AFFAIRS': 'exam',
  'VICE_DEAN': 'all',
  'DEPT_HEAD': 'department',
  'DOCTOR': 'none',
  'NURSE': 'none',
};

// ===================== 权限检查函数 =====================

/**
 * 检查用户是否可进入管理后台
 */
export function canAccessAdmin(role: string): boolean {
  return ADMIN_ROLES.includes(role);
}

/**
 * 检查用户是否有全部权限
 */
export function hasAllPermission(role: string): boolean {
  return role === 'ADMIN' || role === 'VICE_DEAN';
}

/**
 * 检查用户是否有院感相关权限
 */
export function hasInfectionPermission(role: string): boolean {
  return role === 'ADMIN' || role === 'INFECTION_OFFICER' || role === 'VICE_DEAN';
}

/**
 * 检查用户是否有考试相关权限
 */
export function hasExamPermission(role: string): boolean {
  return role === 'ADMIN' || role === 'MEDICAL_AFFAIRS' || role === 'DEPT_HEAD' || role === 'VICE_DEAN';
}

/**
 * 检查用户是否有报表权限
 */
export function hasReportPermission(role: string): boolean {
  return role === 'ADMIN' || role === 'MEDICAL_AFFAIRS' || role === 'VICE_DEAN' || role === 'INFECTION_OFFICER';
}

/**
 * 检查用户是否有科室数据权限
 */
export function hasDepartmentPermission(role: string): boolean {
  return role === 'ADMIN' || role === 'DEPT_HEAD' || role === 'MEDICAL_AFFAIRS' || role === 'VICE_DEAN';
}

// ===================== 中间件 =====================

/**
 * 基础角色守卫 - 检查是否可进入管理后台
 */
export function roleGuard(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({ error: '未授权，请先登录' });
    }

    // 先检查是否可进入管理后台
    if (!canAccessAdmin(userRole)) {
      return res.status(403).json({ error: '无管理后台访问权限' });
    }

    // 再检查特定功能权限
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: '权限不足，无法访问此功能' });
    }

    next();
  };
}

/**
 * 院感功能守卫
 */
export function infectionGuard(req: Request, res: Response, next: NextFunction) {
  const userRole = req.user?.role;

  if (!userRole) {
    return res.status(401).json({ error: '未授权，请先登录' });
  }

  if (!hasInfectionPermission(userRole)) {
    return res.status(403).json({ error: '无院感功能访问权限' });
  }

  next();
}

/**
 * 考试功能守卫
 */
export function examGuard(req: Request, res: Response, next: NextFunction) {
  const userRole = req.user?.role;

  if (!userRole) {
    return res.status(401).json({ error: '未授权，请先登录' });
  }

  if (!hasExamPermission(userRole)) {
    return res.status(403).json({ error: '无考试功能访问权限' });
  }

  next();
}

/**
 * 报表功能守卫
 */
export function reportGuard(req: Request, res: Response, next: NextFunction) {
  const userRole = req.user?.role;

  if (!userRole) {
    return res.status(401).json({ error: '未授权，请先登录' });
  }

  if (!hasReportPermission(userRole)) {
    return res.status(403).json({ error: '无报表功能访问权限' });
  }

  next();
}

/**
 * 全部功能守卫 - 仅 ADMIN 和 VICE_DEAN
 */
export function allPermissionGuard(req: Request, res: Response, next: NextFunction) {
  const userRole = req.user?.role;

  if (!userRole) {
    return res.status(401).json({ error: '未授权，请先登录' });
  }

  if (!hasAllPermission(userRole)) {
    return res.status(403).json({ error: '无系统管理权限' });
  }

  next();
}
