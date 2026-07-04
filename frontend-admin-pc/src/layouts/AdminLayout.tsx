import { useState, useEffect } from 'react';
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

// 所有菜单项
const allMenuItems = [
  { key: '/dashboard', label: '仪表盘', icon: DashboardOutlined, roles: ['ADMIN', 'INFECTION_OFFICER'] },
  { key: '/question-manage', label: '题库管理', icon: BookOutlined, roles: ['ADMIN'] },
  { key: '/paper-manage', label: '试卷管理', icon: FileTextOutlined, roles: ['ADMIN'] },
  { key: '/exam-monitor', label: '考试监控', icon: MonitorOutlined, roles: ['ADMIN', 'INFECTION_OFFICER'] },
  { key: '/infection-dashboard', label: '院感看板', icon: BarChartOutlined, roles: ['ADMIN', 'INFECTION_OFFICER'] },
  { key: '/learning-material', label: '学习资料', icon: FilePdfOutlined, roles: ['ADMIN', 'INFECTION_OFFICER'] },
  { key: '/user-manage', label: '用户管理', icon: UserOutlined, roles: ['ADMIN'] },
  { key: '/reports', label: '报表导出', icon: FileExcelOutlined, roles: ['ADMIN', 'INFECTION_OFFICER'] },
  { key: '/system-config', label: '系统配置', icon: SettingOutlined, roles: ['ADMIN'] },
];

// 主题色常量
const THEME = {
  sidebarBg: 'var(--color-sidebar-bg, #1e293b)',
  sidebarBorder: 'var(--color-sidebar-border, #334155)',
  sidebarText: 'var(--color-sidebar-text, #94a3b8)',
  sidebarTextMuted: 'var(--color-sidebar-text-muted, #64748b)',
  primary: 'var(--color-primary, #3b82f6)',
  primaryLight: 'var(--color-primary-light, #eff6ff)',
  headerBorder: 'var(--color-header-border, #e2e8f0)',
  contentBg: 'var(--color-content-bg, #f8fafc)',
  textPrimary: 'var(--color-text-primary, #1e293b)',
  textSecondary: 'var(--color-text-secondary, #64748b)',
  textMuted: 'var(--color-text-muted, #94a3b8)',
};

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // 响应式：小屏自动折叠侧边栏
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
      setCollapsed(e.matches);
    };
    handler(mql);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

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

  let currentUser: any = {};
  try {
    currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    currentUser = {};
  }
  const userRole = currentUser.role || localStorage.getItem('userRole') || '';

  const menuItems = allMenuItems.filter(item => item.roles.includes(userRole));
  const currentKey = location.pathname;

  const navItems = menuItems.map((item) => {
    const isSelected = currentKey === item.key;
    return {
      key: item.key,
      icon: <item.icon
        style={{
          color: isSelected ? THEME.primary : THEME.sidebarText,
          fontSize: 16,
        }}
      />,
      label: <span
        style={{
          color: isSelected ? '#ffffff' : THEME.sidebarText,
          fontWeight: isSelected ? 600 : 400,
          fontSize: 14,
        }}
      >{item.label}</span>,
      style: {
        marginLeft: 8,
        marginRight: 8,
        marginBottom: 4,
        borderRadius: 6,
        backgroundColor: isSelected ? `${THEME.primary}20` : 'transparent',
        borderLeft: isSelected ? `3px solid ${THEME.primary}` : '3px solid transparent',
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
          background: THEME.sidebarBg,
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
          padding: '0 16px',
          borderBottom: `1px solid ${THEME.sidebarBorder}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32,
              background: THEME.primary,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <BarChartOutlined style={{ color: 'white', fontSize: 18 }} />
            </div>
            {!collapsed && (
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                院感培训管理系统
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
            height: 'calc(100vh - 64px - 40px)',
            overflowY: 'auto',
          }}
        />
        {!collapsed && (
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderTop: `1px solid ${THEME.sidebarBorder}`,
            padding: '0 12px',
          }}>
            <span style={{ color: THEME.sidebarTextMuted, fontSize: 11, whiteSpace: 'nowrap' }}>
              v{__APP_VERSION__} {__GIT_COMMIT__ && `(${__GIT_COMMIT__})`}
            </span>
          </div>
        )}
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 64 : 200, transition: 'margin-left 0.2s' }}>
        <Header style={{
          background: 'white',
          borderBottom: `1px solid ${THEME.headerBorder}`,
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
              style={{ color: THEME.primary }}
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
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = THEME.contentBg}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: THEME.primary }} />
                <div style={{ textAlign: 'left' }}>
                  <p style={{ margin: 0, fontWeight: 500, color: THEME.textPrimary, lineHeight: '20px' }}>
                    {currentUser.realName || '管理员'}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: THEME.textSecondary, lineHeight: '16px' }}>
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
        <Content style={{ background: THEME.contentBg, padding: isMobile ? 12 : 24, minHeight: 'calc(100vh - 64px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
