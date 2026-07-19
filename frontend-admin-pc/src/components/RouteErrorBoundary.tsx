import { useEffect } from 'react';
import { useRouteError, useNavigate } from 'react-router-dom';
import { Result, Button, Space } from 'antd';
import { ReloadOutlined, HomeOutlined } from '@ant-design/icons';

/**
 * 管理端路由级错误边界
 *
 * 主要处理 Vite 部署新版本后旧 chunk 失效导致的动态导入失败。
 * 检测到 chunk 加载失败时自动刷新页面，非导入错误展示友好提示。
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
      const reloadFlag = sessionStorage.getItem('chunk_reload_flag');
      const reloadCount = reloadFlag ? parseInt(reloadFlag, 10) : 0;

      if (reloadCount < 2) {
        sessionStorage.setItem('chunk_reload_flag', String(reloadCount + 1));
        window.location.reload();
      } else {
        sessionStorage.removeItem('chunk_reload_flag');
      }
    }
  }, [error]);

  const isChunkError =
    error instanceof Error &&
    error.message.includes('Failed to fetch dynamically imported module');

  const handleManualRefresh = () => {
    sessionStorage.removeItem('chunk_reload_flag');
    window.location.reload();
  };

  const handleBackHome = () => {
    sessionStorage.removeItem('chunk_reload_flag');
    navigate('/dashboard', { replace: true });
    setTimeout(() => window.location.reload(), 100);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f5f6f8' }}>
      <Result
        status="warning"
        title={isChunkError ? '系统已更新，正在刷新' : '页面加载异常'}
        subTitle={
          isChunkError
            ? '检测到新版本，页面正在自动刷新以加载最新内容。如长时间无响应，请点击下方按钮手动刷新。'
            : '页面加载过程中出现问题，可能是网络不稳定或系统已更新。请尝试刷新页面。'
        }
        extra={
          <Space>
            <Button type="primary" icon={<ReloadOutlined />} onClick={handleManualRefresh}>
              刷新页面
            </Button>
            <Button icon={<HomeOutlined />} onClick={handleBackHome}>
              返回首页
            </Button>
          </Space>
        }
      />
    </div>
  );
}
