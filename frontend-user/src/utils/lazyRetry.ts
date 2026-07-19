import type { ComponentType } from 'react';

/**
 * 带自动重试的懒加载工厂函数
 *
 * 解决 Vite 部署新版本后，旧 chunk 文件名失效导致动态 import 失败的问题。
 *
 * 策略：
 * 1. 首次 import 失败 → 等待 200ms 重试一次（应对短暂网络抖动）
 * 2. 重试仍失败 → 清除页面缓存并硬刷新（应对新版本部署后旧 chunk 被删除）
 * 3. 刷新仍失败 → 抛出错误，由路由级 errorElement 接管展示
 *
 * 用法：
 *   const Home = lazyRetry(() => import('./pages/Home'));
 *   const DailyPractice = lazyRetry(() => import('./pages/DailyPractice').then(m => ({ default: m.DailyPractice })));
 */
export function lazyRetry<T extends ComponentType<any>>(
  importer: () => Promise<{ default: T } | { [K: string]: any }>,
  componentName = 'unknown',
): Promise<{ default: T }> {
  return new Promise((resolve, reject) => {
    const attempt = (retriesLeft: number) => {
      importer()
        .then((module) => {
          // 兼容两种导出形式：默认导出 和 命名导出
          if ('default' in module && module.default) {
            resolve(module as { default: T });
          } else {
            // 命名导出：取第一个非 default 属性作为组件
            const keys = Object.keys(module).filter(k => k !== '__esModule');
            if (keys.length > 0) {
              resolve({ default: (module as any)[keys[0]] });
            } else {
              reject(new Error(`[lazyRetry] ${componentName}: 模块无可用导出`));
            }
          }
        })
        .catch((err) => {
          console.warn(`[lazyRetry] ${componentName} 加载失败（剩余重试 ${retriesLeft}）`, err.message);

          if (retriesLeft > 0) {
            // 延迟重试，应对短暂网络抖动
            setTimeout(() => attempt(retriesLeft - 1), 200);
          } else {
            // 重试耗尽，判断是否为 chunk 加载失败
            const isChunkLoadError =
              err?.message?.includes('Failed to fetch dynamically imported module') ||
              err?.message?.includes('Importing a module script failed') ||
              err?.message?.includes('error loading dynamically imported module');

            if (isChunkLoadError) {
              console.warn(`[lazyRetry] ${componentName}: chunk 加载失败，触发页面刷新以加载新版本`);
              // 标记刷新原因，避免无限循环
              const flag = sessionStorage.getItem('chunk_reload_flag');
              const count = flag ? parseInt(flag, 10) : 0;
              if (count < 2) {
                sessionStorage.setItem('chunk_reload_flag', String(count + 1));
                window.location.reload();
                // 返回一个永不 resolve 的 Promise，避免错误边界在刷新前闪烁
                return;
              }
            }
            // 非 chunk 错误或刷新次数用尽，抛出由 errorElement 处理
            reject(err);
          }
        });
    };

    attempt(1); // 重试 1 次
  });
}
