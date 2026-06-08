/**
 * 获取当前月份字符串，格式 YYYY-MM
 */
export function getCurrentMonth(): string {
  return formatMonth(new Date());
}

/**
 * 格式化日期为月份字符串，格式 YYYY-MM
 */
export function formatMonth(date: Date): string {
  return date.toISOString().slice(0, 7);
}

/**
 * 获取指定月份的下一个月字符串
 */
export function getNextMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
}
