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
    if (!data || typeof data !== 'object') return response;

    const isCodeFormat = 'code' in data && typeof data.code === 'number';
    const isSuccessFormat = 'success' in data;

    if (isCodeFormat || isSuccessFormat) {
      const isSuccess = isCodeFormat ? data.code === 0 : data.success;
      if (!isSuccess) {
        return Promise.reject(new Error(data.message || '操作失败'));
      }
      const innerData = data.data ?? data;
      if (innerData !== data && typeof innerData === 'object' && innerData !== null) {
        // 将 wrapper 上的额外字段（如 total、autoRemoved）复制到 innerData 上，避免丢失
        for (const key of Object.keys(data)) {
          if (!['code', 'success', 'message', 'data'].includes(key)) {
            (innerData as any)[key] = data[key];
          }
        }
      }
      response.data = innerData;
    }
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath === '/login' || currentPath === '/user/login';

    if (status === 401) {
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