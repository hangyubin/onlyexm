import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#3b82f6',
          colorInfo: '#3b82f6',
          colorSuccess: '#16a34a',
          colorWarning: '#f59e0b',
          colorError: '#dc2626',
          borderRadius: 6,
          colorBgLayout: '#f8fafc',
          colorBgContainer: '#ffffff',
          colorBorderSecondary: '#e2e8f0',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif",
          fontSize: 14,
          controlHeight: 36,
        },
      }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>
);
