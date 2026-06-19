import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (data && typeof data === 'object') {
      // 处理 { code, data, message } 格式
      if ('code' in data) {
        if (data.code === 0) {
          if ('total' in data) {
            response.data = data;
          } else {
            response.data = data.data ?? data;
          }
        } else {
          console.error('API Error:', data.message);
          return Promise.reject(new Error(data.message || '操作失败'));
        }
      }
      // 处理 { success, data, message } 格式
      else if ('success' in data) {
        if (data.success) {
          if ('total' in data) {
            response.data = data;
          } else {
            const unwrapped = data.data ?? data;
            // 保留被展开时丢失的顶层元数据字段（仅当 unwrapped 是对象时）
            if (unwrapped && typeof unwrapped === 'object' && !Array.isArray(unwrapped)) {
              if (data.success !== undefined) unwrapped.success = data.success;
              if (data.autoRemoved !== undefined) unwrapped.autoRemoved = data.autoRemoved;
              if (data.message !== undefined) unwrapped.message = data.message;
            }
            response.data = unwrapped;
          }
        } else {
          console.error('API Error:', data.message);
          return Promise.reject(new Error(data.message || '操作失败'));
        }
      }
    }
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath === '/login' || currentPath === '/user/login';

    if (status === 401) {
      // token 过期或无效，清除并跳转登录页
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userId');
      if (!isLoginPage) {
        window.location.href = `${window.location.origin}/login`;
      }
      return Promise.reject(new Error('登录已过期，请重新登录'));
    }

    if (status === 403) {
      console.error('Permission denied');
    } else if (status >= 500) {
      console.error('Server error:', error.response?.data?.message || '服务器错误');
    } else if (status === 400) {
      const message = error.response?.data?.message || error.response?.data?.error || '请求参数错误';
      console.error('Bad request:', message);
    }

    return Promise.reject(error);
  }
);

export default api;