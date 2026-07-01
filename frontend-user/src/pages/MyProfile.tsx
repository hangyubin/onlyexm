import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Settings, Type, Lock, Edit3 } from 'lucide-react';
import api from '../api/axios';
import { useDicts, DICT_CATEGORY } from '../hooks/useDict';

const FONT_SCALES = [
  { label: '小', value: '0.85' },
  { label: '标准', value: '1' },
  { label: '大', value: '1.15' },
  { label: '特大', value: '1.3' },
];

interface UserInfo {
  realName: string;
  department: string;
  role: string;
  hospitalName: string;
  phone?: string;
  email?: string;
}

export default function MyProfile() {
  const navigate = useNavigate();
  const { getName, getItems } = useDicts([DICT_CATEGORY.ROLE, DICT_CATEGORY.DEPARTMENT]);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    realName: '',
    department: '',
    role: '',
    hospitalName: '',
    phone: '',
    email: '',
  });
  const [loading, setLoading] = useState(true);
  const [currentFontScale, setCurrentFontScale] = useState(() => localStorage.getItem('fontScale') || '1');

  // 初始化字体缩放
  useEffect(() => {
    document.documentElement.setAttribute('data-font-scale', currentFontScale);
  }, [currentFontScale]);

  // 修改密码
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // 修改个人资料
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ realName: '', department: '', phone: '', email: '' });
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    setLoading(true);
    try {
      const res = await api.get('/user/profile/stats');
      const data = res.data;
      if (data.user) {
        setUserInfo({
          realName: data.user.realName || '',
          department: data.user.department || '',
          role: data.user.role || '',
          hospitalName: data.user.hospitalName || '',
          phone: data.user.phone || '',
          email: data.user.email || '',
        });
      }
    } catch (error) {
      console.error('Fetch user info error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFontScaleChange = (value: string) => {
    setCurrentFontScale(value);
    localStorage.setItem('fontScale', value);
    document.documentElement.setAttribute('data-font-scale', value);
  };

  const handleChangePassword = async () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      alert('请填写完整');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      alert('新密码长度不能少于6位');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('两次输入的新密码不一致');
      return;
    }
    setPasswordLoading(true);
    try {
      await api.post('/auth/change-password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      alert('密码修改成功');
      setShowPasswordModal(false);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.message || err?.response?.data?.error || '密码修改失败';
      alert(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  const openProfileModal = () => {
    setProfileForm({
      realName: userInfo.realName,
      department: userInfo.department,
      phone: userInfo.phone || '',
      email: userInfo.email || '',
    });
    setShowProfileModal(true);
  };

  const handleUpdateProfile = async () => {
    if (!profileForm.realName.trim()) {
      alert('请输入真实姓名');
      return;
    }
    setProfileLoading(true);
    try {
      await api.put('/user/profile/update', profileForm);
      alert('个人资料修改成功');
      setShowProfileModal(false);
      // 同步更新 localStorage 中的用户信息
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userObj = JSON.parse(storedUser);
          Object.assign(userObj, profileForm);
          localStorage.setItem('user', JSON.stringify(userObj));
        }
      } catch { /* ignore parse errors */ }
      // Refresh user info
      fetchUserInfo();
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.message || '修改失败';
      alert(msg);
    } finally {
      setProfileLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-safe-20 max-w-md mx-auto">
      {/* 用户信息头部 */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white px-4 pt-8 pb-6 rounded-b-3xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{userInfo.realName}</h1>
            <p className="text-blue-100 text-sm">
              {getName(DICT_CATEGORY.DEPARTMENT, userInfo.department)} · {getName(DICT_CATEGORY.ROLE, userInfo.role)}
            </p>
            <p className="text-blue-200 text-xs mt-1">{userInfo.hospitalName}</p>
          </div>
        </div>
      </div>

      {/* 修改个人资料 */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-blue-500" />
            个人资料
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">姓名</span>
              <span className="text-sm text-gray-800">{userInfo.realName || '-'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">科室</span>
              <span className="text-sm text-gray-800">{getName(DICT_CATEGORY.DEPARTMENT, userInfo.department) || '-'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">角色</span>
              <span className="text-sm text-gray-800">
                {getName(DICT_CATEGORY.ROLE, userInfo.role)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">手机号</span>
              <span className="text-sm text-gray-800">{userInfo.phone || '-'}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-500">邮箱</span>
              <span className="text-sm text-gray-800">{userInfo.email || '-'}</span>
            </div>
          </div>
          <button
            onClick={openProfileModal}
            className="w-full mt-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            修改个人资料
          </button>
        </div>
      </div>

      {/* 设置 */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-500" />
            设置
          </h2>

          {/* 字体大小 */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Type className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">字体大小</span>
            </div>
            <div className="flex gap-2">
              {FONT_SCALES.map((item) => (
                <button
                  key={item.value}
                  onClick={() => handleFontScaleChange(item.value)}
                  className={`font-scale-btn flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                    currentFontScale === item.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 修改密码 */}
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full py-3 bg-gray-50 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
          >
            <Lock className="w-4 h-4" />
            修改密码
          </button>
        </div>
      </div>

      {/* 修改密码弹窗 */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 max-h-[85vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">修改密码</h3>
            <div className="space-y-3">
              <input
                type="password"
                placeholder="旧密码"
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-xl"
              />
              <input
                type="password"
                placeholder="新密码（至少6位）"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-xl"
              />
              <input
                type="password"
                placeholder="确认新密码"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-xl"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowPasswordModal(false); setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' }); }}
                className="flex-1 py-3 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={handleChangePassword}
                disabled={passwordLoading}
                className="flex-1 py-3 rounded-xl font-medium bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {passwordLoading ? '提交中...' : '确认修改'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 修改个人资料弹窗 */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 max-h-[85vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">修改个人资料</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-500 mb-1">姓名</label>
                <input
                  type="text"
                  placeholder="真实姓名"
                  value={profileForm.realName}
                  onChange={(e) => setProfileForm({ ...profileForm, realName: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">科室</label>
                <select
                  value={profileForm.department}
                  onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl bg-white"
                >
                  <option value="">请选择科室</option>
                  {getItems(DICT_CATEGORY.DEPARTMENT).map((item) => (
                    <option key={item.code} value={item.code}>{item.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">手机号</label>
                <input
                  type="text"
                  placeholder="手机号"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">邮箱</label>
                <input
                  type="email"
                  placeholder="邮箱"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowProfileModal(false)}
                className="flex-1 py-3 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={handleUpdateProfile}
                disabled={profileLoading}
                className="flex-1 py-3 rounded-xl font-medium bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {profileLoading ? '提交中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 退出登录按钮 */}
      <div className="px-4 mt-6 mb-4">
        <button
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userId');
            navigate('/login');
          }}
          className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          退出登录
        </button>
      </div>

      {/* 版本信息 */}
      <div className="px-4 mb-8">
        <p className="text-center text-xs text-gray-400">
          v{__APP_VERSION__}{__GIT_COMMIT__ ? ` (${__GIT_COMMIT__})` : ''}
          &nbsp;|&nbsp;{__BUILD_TIME__ ? new Date(__BUILD_TIME__).toLocaleDateString('zh-CN') : ''}
        </p>
      </div>
    </div>
  );
}