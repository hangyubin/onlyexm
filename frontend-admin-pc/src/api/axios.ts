import axios from 'axios';
import { message } from 'antd';

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 600000, // 10 分钟，支持大文件上传
});

// 请求拦截器 - 自动添加token
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

// 响应拦截器 - 统一处理响应数据
api.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (data && typeof data === 'object') {
      // 统一处理 { code, data, message } 和 { success, data, message } 格式
      if ('code' in data) {
        if (data.code === 0) {
          // 如果包含total字段，说明是分页数据，保留原始格式
          if ('total' in data) {
            response.data = data;
          } else {
            response.data = data.data ?? data;
          }
        } else {
          const errMsg = data.message || '操作失败';
          message.error(errMsg);
          return Promise.reject(new Error(errMsg));
        }
      } else if ('success' in data) {
        if (data.success) {
          // 如果包含total字段，说明是分页数据，保留原始格式
          if ('total' in data) {
            response.data = data;
          } else {
            response.data = data.data ?? data;
          }
        } else {
          const errMsg = data.message || '操作失败';
          message.error(errMsg);
          return Promise.reject(new Error(errMsg));
        }
      }
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // 清除本地存储的token和用户信息
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      // 如果不是在登录页面，跳转到登录页
      if (!window.location.pathname.startsWith('/admin/login')) {
        window.location.href = `${window.location.origin}/admin/login`;
      }
    } else if (error.response?.status === 403) {
      message.error('没有权限执行此操作');
    } else if (error.response?.status >= 500) {
      message.error('服务器错误，请稍后重试');
    }
    return Promise.reject(error);
  }
);

export default api;
