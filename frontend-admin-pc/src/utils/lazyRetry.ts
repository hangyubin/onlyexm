import type { ComponentType } from 'react';

/**
 * 带自动重试的懒加载工厂函数
 *
 * 解决 Vite 部署新版本后，旧 chunk 文件名失效导致动态 import 失败的问题。
 * 策略：首次失败延迟重试一次 → 仍失败则刷新页面加载新版本。
 */
export function lazyRetry<T extends ComponentType<any>>(
  importer: () => Promise<{ default: T } | { [K: string]: any }>,
  componentName = 'unknown',
): Promise<{ default: T }> {
  return new Promise((resolve, reject) => {
    const attempt = (retriesLeft: number) => {
      importer()
        .then((module) => {
          if ('default' in module && module.default) {
            resolve(module as { default: T });
          } else {
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
            setTimeout(() => attempt(retriesLeft - 1), 200);
          } else {
            const isChunkLoadError =
              err?.message?.includes('Failed to fetch dynamically imported module') ||
              err?.message?.includes('Importing a module script failed') ||
              err?.message?.includes('error loading dynamically imported module');

            if (isChunkLoadError) {
              console.warn(`[lazyRetry] ${componentName}: chunk 加载失败，触发页面刷新以加载新版本`);
              const flag = sessionStorage.getItem('chunk_reload_flag');
              const count = flag ? parseInt(flag, 10) : 0;
              if (count < 2) {
                sessionStorage.setItem('chunk_reload_flag', String(count + 1));
                window.location.reload();
                return;
              }
            }
            reject(err);
          }
        });
    };

    attempt(1);
  });
}
