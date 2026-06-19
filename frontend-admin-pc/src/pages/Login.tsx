import { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined, BuildOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', values);

      if (response.data.token) {
        const user = response.data.user;
        // 校验角色：仅管理员和院感专员可登录管理端
        const allowedRoles = ['ADMIN', 'INFECTION_OFFICER'];
        if (!user?.role || !allowedRoles.includes(user.role)) {
          message.error('该账户无管理端访问权限，请使用用户端登录');
          return;
        }
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify({
          id: user?.id,
          realName: user?.realName,
          role: user?.role,
        }));
        if (user?.role) {
          localStorage.setItem('userRole', user.role);
        }
        if (user?.id) {
          localStorage.setItem('userId', String(user.id));
        }
        message.success('登录成功');
        navigate('/dashboard');
      } else {
        message.error(response.data.error || '登录失败');
      }
    } catch {
      // axios 拦截器已显示错误消息，此处不再重复提示
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <BuildOutlined className="text-white text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">院感培训管理系统</h1>
          <p className="text-slate-500 mt-2">医院感染控制培训平台</p>
        </div>

        <Form
          name="login"
          onFinish={handleSubmit}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined className="text-slate-400" />}
              placeholder="请输入用户名"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-slate-400" />}
              placeholder="请输入密码"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              className="w-full h-12 text-base"
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <p className="text-center text-slate-400 text-sm mt-4">
          忘记密码？请联系管理员
        </p>
      </Card>
    </div>
  );
}