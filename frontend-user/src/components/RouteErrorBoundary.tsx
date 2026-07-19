import { useEffect } from 'react';
import { useRouteError, useNavigate } from 'react-router-dom';

/**
 * 路由级错误边界
 *
 * 主要处理场景：Vite 部署新版本后，旧 chunk 文件名（带 hash）被删除，
 * 但用户浏览器缓存了旧的 index.html / 路由配置，动态 import 旧 chunk 时
 * 抛出 "Failed to fetch dynamically imported module" 错误。
 *
 * 处理策略：
 * 1. 检测到动态导入失败 → 自动清缓存并刷新页面（拉取新 index.html）
 * 2. 非导入错误 → 展示友好提示，提供手动刷新按钮
 */
export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  useEffect(() => {
    const isChunkLoadError =
      error instanceof Error &&
      (error.message.includes('Failed to fetch dynamically imported module') ||
        error.message.includes('Importing a module script failed') ||
        error.message.includes('error loading dynamically imported module'));

    if (isChunkLoadError) {
      console.warn('[RouteErrorBoundary] 检测到 chunk 加载失败，自动刷新页面...', error.message);
      // 标记本次刷新是由 chunk 失败触发，避免无限刷新循环
      const reloadFlag = sessionStorage.getItem('chunk_reload_flag');
      const reloadCount = reloadFlag ? parseInt(reloadFlag, 10) : 0;

      if (reloadCount < 2) {
        // 最多自动刷新 2 次，避免无限循环
        sessionStorage.setItem('chunk_reload_flag', String(reloadCount + 1));
        // 硬刷新，绕过缓存
        window.location.reload();
      } else {
        // 超过重试次数，清除标记，展示手动刷新提示
        sessionStorage.removeItem('chunk_reload_flag');
      }
    }
  }, [error]);

  const isChunkError =
    error instanceof Error &&
    error.message.includes('Failed to fetch dynamically imported module');

  const errorMessage = error instanceof Error ? error.message : String(error);

  const handleManualRefresh = () => {
    sessionStorage.removeItem('chunk_reload_flag');
    window.location.reload();
  };

  const handleBackHome = () => {
    sessionStorage.removeItem('chunk_reload_flag');
    navigate('/', { replace: true });
    // 延迟刷新确保路由切换后生效
    setTimeout(() => window.location.reload(), 100);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center bg-gray-50">
      <div className="max-w-sm w-full">
        {/* 图标 */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        {/* 标题 */}
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          {isChunkError ? '系统已更新，正在刷新' : '页面加载异常'}
        </h2>

        {/* 描述 */}
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          {isChunkError
            ? '检测到新版本，页面正在自动刷新以加载最新内容。如长时间无响应，请点击下方按钮手动刷新。'
            : '页面加载过程中出现问题，可能是网络不稳定或系统已更新。请尝试刷新页面。'}
        </p>

        {/* 操作按钮 */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleManualRefresh}
            className="w-full py-2.5 px-4 bg-primary-600 text-white rounded-lg font-medium text-sm hover:bg-primary-700 active:scale-95 transition-all"
          >
            刷新页面
          </button>
          <button
            onClick={handleBackHome}
            className="w-full py-2.5 px-4 bg-white text-gray-600 rounded-lg font-medium text-sm border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all"
          >
            返回首页
          </button>
        </div>

        {/* 技术细节（可折叠，便于调试） */}
        <details className="mt-6 text-left">
          <summary className="text-xs text-gray-400 cursor-pointer select-none">技术详情</summary>
          <pre className="mt-2 p-3 bg-gray-100 rounded text-xs text-gray-500 overflow-auto max-h-32">
            {errorMessage}
          </pre>
        </details>
      </div>
    </div>
  );
}
