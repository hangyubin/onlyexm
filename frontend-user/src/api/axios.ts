import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
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

let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (error: any) => void }[] = [];

const processQueue = (error: any, token?: string) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

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
            response.data = data.data ?? data;
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
    const originalRequest = error.config;
    const status = error.response?.status;
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath === '/login' || currentPath === '/user/login';

    if (status === 401 && !isRefreshing && !originalRequest._retry) {
      isRefreshing = true;
      originalRequest._retry = true;

      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!isLoginPage) {
          window.location.href = `${window.location.origin}/login`;
        }
        processQueue(null, '');
      } catch (refreshError) {
        processQueue(refreshError, '');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!isLoginPage) {
          window.location.href = `${window.location.origin}/login`;
        }
      } finally {
        isRefreshing = false;
      }
    } else if (status === 401 && isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      }).catch((err) => {
        return Promise.reject(err);
      });
    }

    if (status === 403) {
      console.error('Permission denied');
      if (typeof window !== 'undefined') {
        alert('没有权限执行此操作');
      }
    } else if (status >= 500) {
      console.error('Server error:', error.response?.data?.message || '服务器错误');
      if (typeof window !== 'undefined') {
        alert('服务器错误，请稍后重试');
      }
    } else if (status === 400) {
      const message = error.response?.data?.message || error.response?.data?.error || '请求参数错误';
      console.error('Bad request:', message);
      if (typeof window !== 'undefined') {
        alert(message);
      }
    }

    return Promise.reject(error);
  }
);

export default api;