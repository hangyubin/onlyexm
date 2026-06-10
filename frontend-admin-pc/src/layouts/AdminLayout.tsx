import { useState } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown } from 'antd';
import {
  DashboardOutlined,
  BookOutlined,
  FileTextOutlined,
  MonitorOutlined,
  BarChartOutlined,
  UserOutlined,
  FileExcelOutlined,
  SettingOutlined,
  FilePdfOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/dashboard', label: '仪表盘', icon: DashboardOutlined },
  { key: '/question-manage', label: '题库管理', icon: BookOutlined },
  { key: '/paper-manage', label: '试卷管理', icon: FileTextOutlined },
  { key: '/exam-monitor', label: '考试监控', icon: MonitorOutlined },
  { key: '/infection-dashboard', label: '院感看板', icon: BarChartOutlined },
  { key: '/learning-material', label: '学习资料', icon: FilePdfOutlined },
  { key: '/user-manage', label: '用户管理', icon: UserOutlined },
  { key: '/reports', label: '报表导出', icon: FileExcelOutlined },
  { key: '/system-config', label: '系统配置', icon: SettingOutlined },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const goToUserFrontend = () => {
    window.location.href = `${window.location.origin}/`;
  };

  const userMenu = [
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout } as const,
  ];

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentKey = location.pathname;

  const navItems = menuItems.map((item) => {
    const isSelected = currentKey === item.key;
    return {
      key: item.key,
      icon: <item.icon 
        style={{ 
          color: isSelected ? '#3b82f6' : '#94a3b8',
          fontSize: 16,
        }} 
      />,
      label: <span 
        style={{ 
          color: isSelected ? '#ffffff' : '#94a3b8',
          fontWeight: isSelected ? 600 : 400,
          fontSize: 14,
        }}
      >{item.label}</span>,
      style: {
        marginLeft: 8,
        marginRight: 8,
        marginBottom: 4,
        borderRadius: 6,
        backgroundColor: isSelected ? '#3b82f620' : 'transparent',
        borderLeft: isSelected ? '3px solid #3b82f6' : '3px solid transparent',
        transition: 'all 0.2s ease',
      },
      onClick: () => navigate(item.key),
    };
  });

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={200}
        collapsedWidth={64}
        style={{
          background: '#1e293b',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          overflow: 'auto',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          height: 64,
          padding: collapsed ? '0 16px' : '0 16px',
          borderBottom: '1px solid #334155',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32,
              height: 32,
              background: '#3b82f6',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <BarChartOutlined style={{ color: 'white', fontSize: 18 }} />
            </div>
            {!collapsed && (
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                院感培训系统
              </span>
            )}
          </div>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[currentKey]}
          items={navItems}
          style={{
            background: 'transparent',
            borderRight: 'none',
            height: 'calc(100vh - 64px)',
            overflowY: 'auto',
          }}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 64 : 200, transition: 'margin-left 0.2s' }}>
        <Header style={{
          background: 'white',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 24px',
          height: 64,
          lineHeight: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ marginRight: 16 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              icon={<HomeOutlined />}
              onClick={goToUserFrontend}
              style={{ color: '#3b82f6' }}
            >
              用户端
            </Button>
            <Dropdown
              menu={{ items: userMenu }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: 8,
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#3b82f6' }} />
                <div style={{ textAlign: 'left' }}>
                  <p style={{ margin: 0, fontWeight: 500, color: '#1e293b', lineHeight: '20px' }}>
                    {currentUser.realName || '管理员'}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: '16px' }}>
                    {currentUser.role === 'ADMIN' ? '管理员' : 
                     currentUser.role === 'INFECTION_OFFICER' ? '院感专员' :
                     currentUser.role === 'DEPT_HEAD' ? '科室主任' :
                     currentUser.role === 'DOCTOR' ? '医生' : '用户'}
                  </p>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ background: '#f8fafc', padding: 24, minHeight: 'calc(100vh - 64px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
