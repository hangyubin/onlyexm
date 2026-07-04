import { useState, useEffect } from 'react';
import {
  Card, Button, Table, Tag, Modal, Form, Input, Select, Popconfirm, message,
  Upload, Row, Col, Progress, Space, Empty
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, UserOutlined,
  LockOutlined, UnlockOutlined, RestOutlined,
  UploadOutlined, EyeOutlined, DownloadOutlined
} from '@ant-design/icons';
import {
  userApi, User, LearningProfile
} from '../../api/user';
import { useDictData, useDebouncedValue } from '../../hooks/useDictData';

const { Option } = Select;

export default function UserManage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 });
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchRole, setSearchRole] = useState('');
  const [searchDepartment, setSearchDepartment] = useState('');
  const debouncedSearchKeyword = useDebouncedValue(searchKeyword);

  const [modalVisible, setModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importUploading, setImportUploading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; failedDetails: string[] } | null>(null);
  const roleDictData = useDictData('ROLE');
  const deptDictData = useDictData('DEPARTMENT');
  const roleDict = roleDictData.dictMap;
  const roleOptions = roleDictData.options;
  const departmentDict = deptDictData.dictMap;
  const departmentOptions = deptDictData.options;

  const [form] = Form.useForm();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [learningProfile, setLearningProfile] = useState<LearningProfile | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userApi.getList({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: debouncedSearchKeyword || undefined,
        role: searchRole || undefined,
        department: searchDepartment || undefined,
      });
      setUsers(response.items);
      setTotal(response.total);
    } catch (error) {
      console.error('获取用户列表失败:', error);
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination, debouncedSearchKeyword, searchRole, searchDepartment]);

  const columns = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '姓名', dataIndex: 'realName', key: 'realName' },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={roleDict[role]?.color}>{roleDict[role]?.label || role}</Tag>
      ),
    },
    { title: '科室', dataIndex: 'department', key: 'department', render: (dept: string) => departmentDict[dept]?.label || dept },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '锁定状态',
      dataIndex: 'isLocked',
      key: 'isLocked',
      render: (locked: boolean) => (
        <Tag color={locked ? 'red' : 'green'}>
          {locked ? '已锁定' : '正常'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: User) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm
            title="确认重置密码？"
            description="将生成新的随机密码，用户原密码将失效。"
            onConfirm={() => handleResetPassword(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button icon={<RestOutlined />} size="small">重置密码</Button>
          </Popconfirm>
          <Popconfirm
            title={record.isLocked ? "确认解锁该用户？" : "确认锁定该用户？"}
            description={record.isLocked ? "用户将可以正常登录" : "用户将无法登录系统"}
            onConfirm={() => handleToggleLock(record.id)}
            okText="确认"
            cancelText="取消"
            okButtonProps={record.isLocked ? {} : { danger: true }}
          >
            <Button
              icon={record.isLocked ? <UnlockOutlined /> : <LockOutlined />}
              size="small"
              danger={record.isLocked}
            >
              {record.isLocked ? '解锁' : '锁定'}
            </Button>
          </Popconfirm>
          <Button icon={<EyeOutlined />} size="small" onClick={() => handleViewProfile(record.id)}>学习档案</Button>
          {record.role !== 'ADMIN' && (
            <Popconfirm title="确定删除该用户吗？" onConfirm={() => handleDelete(record.id)}>
              <Button icon={<DeleteOutlined />} size="small" danger>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    // 生成随机默认密码（8位字母数字）
    const randomPassword = Math.random().toString(36).slice(-8) + '1';
    form.setFieldsValue({ password: randomPassword });
    setModalVisible(true);
  };

  const handleEdit = (record: User) => {
    setEditingUser(record);
    form.setFieldsValue({
      username: record.username,
      realName: record.realName,
      role: record.role || undefined,
      department: record.department,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await userApi.delete(id);
      message.success('删除成功');
      fetchUsers();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleResetPassword = async (id: number) => {
    try {
      const response = await userApi.resetPassword(id);
      const tempPassword = response?.tempPassword || '';
      if (tempPassword) {
        Modal.success({
          title: '密码已重置',
          content: `新密码为：${tempPassword}，请通知用户及时修改密码。`,
        });
      } else {
        message.success('密码已重置成功');
      }
    } catch (error) {
      message.error('重置失败');
    }
  };

  const handleToggleLock = async (id: number) => {
    try {
      const response = await userApi.toggleLock(id);
      message.success(response.isLocked ? '已锁定' : '已解锁');
      fetchUsers();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleViewProfile = async (id: number) => {
    try {
      const response = await userApi.getLearningProfile(id);
      // 将后端返回的结构映射为前端 LearningProfile 接口
      const profile: LearningProfile = {
        userId: response.user?.id ?? id,
        examRecords: (response.examStats?.recentExams ?? []).map((r: any) => ({
          id: r.id,
          paperTitle: r.paperName ?? '已删除试卷',
          score: r.score ?? 0,
          totalScore: r.totalScore ?? 100,
          examDate: r.startTime ?? r.endTime ?? '',
          status: r.isPassed ? 'PASS' as const : 'FAIL' as const,
        })),
        complianceProgress: (() => {
          const current = response.infectionCompliance?.currentMonth;
          if (!current) return 0;
          return current.requiredCount > 0
            ? Math.round((current.completedCount / current.requiredCount) * 100)
            : 0;
        })(),
        wrongQuestionCount: response.wrongQuestionCount ?? 0,
        totalStudyMinutes: Math.round((response.learningStats?.totalStudySeconds ?? 0) / 60),
        infectionRequirement: (() => {
          const current = response.infectionCompliance?.currentMonth;
          if (!current) return null;
          // 计算下个月日期
          const monthStr = current.month || '';
          const [y, m] = monthStr.split('-').map(Number);
          const nextMonth = y && m ? new Date(y, m, 1) : null; // 月份从0开始，m=6则下个月是7月
          return {
            id: 0,
            userId: id,
            requirementType: 'monthly',
            isCompliant: current.isCompliant ?? false,
            lastExamDate: monthStr,
            nextExamDate: nextMonth ? nextMonth.toISOString().slice(0, 10) : '',
          };
        })(),
      };
      setLearningProfile(profile);
      setProfileModalVisible(true);
    } catch (error) {
      message.error('获取学习档案失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data: any = {
        username: values.username,
        realName: values.realName,
        role: values.role,
        department: values.department,
      };

      if (!editingUser) {
        data.password = values.password;
      }

      if (editingUser) {
        await userApi.update(editingUser.id, data);
        message.success('编辑成功');
      } else {
        await userApi.create(data);
        message.success('创建成功');
      }
      setModalVisible(false);
      form.resetFields();
      fetchUsers();
    } catch (error: any) {
      console.error('表单提交失败:', error);
      const msg = error?.response?.data?.error || error?.response?.data?.message || '操作失败';
      message.error(msg);
    }
  };

  const handleImport = async (file: File) => {
    setImportUploading(true);
    setImportProgress(0);
    try {
      const response = await userApi.batchImport(file, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setImportProgress(Math.min(percent, 99));
        }
      });
      setImportProgress(100);
      setImportResult(response);
      message.success(`导入完成，成功${response.success}条，失败${response.failed}条`);
      fetchUsers();
    } catch (error) {
      message.error('导入失败');
    } finally {
      setImportUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await userApi.downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = '用户导入模板.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success('模板下载成功');
    } catch (error) {
      message.error('下载模板失败');
    }
  };

  const handleImportFile = (info: any) => {
    const { file } = info;
    if (file.originFileObj) {
      handleImport(file.originFileObj);
    }
  };

  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-800">用户管理</h2>
        <div className="flex gap-2">
          <Button icon={<UploadOutlined />} onClick={() => setImportModalVisible(true)}>
            批量导入
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建用户
          </Button>
        </div>
      </div>

      <Card>
        <div className="flex gap-4 mb-4">
          <Input
            placeholder="搜索用户名或姓名"
            prefix={<SearchOutlined />}
            value={searchKeyword}
            onChange={(e) => {
              setSearchKeyword(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            style={{ width: 250 }}
          />
          <Select
            placeholder="选择角色"
            value={searchRole}
            onChange={(value) => {
              setSearchRole(value ?? undefined);
              setPagination({ ...pagination, page: 1 });
            }}
            style={{ width: 150 }}
            allowClear
          >
            {roleOptions.map(opt => (
              <Option key={opt.value} value={opt.value}>{opt.label}</Option>
            ))}
          </Select>
          <Select
            placeholder="选择科室"
            value={searchDepartment}
            onChange={(value) => {
              setSearchDepartment(value ?? undefined);
              setPagination({ ...pagination, page: 1 });
            }}
            style={{ width: 150 }}
            allowClear
          >
            {departmentOptions.filter(d => d.value !== 'ALL').map(opt => (
              <Option key={opt.value} value={opt.value}>{opt.label}</Option>
            ))}
          </Select>
        </div>

        <Table
          dataSource={users}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => setPagination({ page, pageSize }),
          }}
        />
      </Card>

      <Modal
        title={editingUser ? '编辑用户' : '新建用户'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          setEditingUser(null);
          form.resetFields();
        }}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入用户名" disabled={!!editingUser} />
          </Form.Item>
          {!editingUser && (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}
          <Form.Item
            name="realName"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              {roleOptions.map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="department"
            label="科室"
            rules={[{ required: true, message: '请选择科室' }]}
          >
            <Select placeholder="请选择科室">
              {departmentOptions.filter(d => d.value !== 'ALL').map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
          </Form.Item>

        </Form>
      </Modal>

      <Modal
        title="学习档案"
        open={profileModalVisible}
        onCancel={() => {
          setProfileModalVisible(false);
          setLearningProfile(null);
        }}
        footer={null}
        width={700}
      >
        {learningProfile ? (
          <div className="space-y-6">
            <Row gutter={16}>
              <Col span={12}>
                <Card title="院感达标情况">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-2">
                        <span>达标进度</span>
                        <span>{learningProfile.complianceProgress}%</span>
                      </div>
                      <Progress
                        percent={learningProfile.complianceProgress}
                        strokeColor={{
                          '0%': '#10b981',
                          '100%': 'var(--color-primary, #3b82f6)',
                        }}
                      />
                    </div>
                  </div>
                  {learningProfile.infectionRequirement && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm">
                        最近考试: {learningProfile.infectionRequirement.lastExamDate
                          ? new Date(learningProfile.infectionRequirement.lastExamDate).toLocaleDateString('zh-CN')
                          : '暂无'}
                      </p>
                      <p className="text-sm">
                        下次考试: {learningProfile.infectionRequirement.nextExamDate
                          ? new Date(learningProfile.infectionRequirement.nextExamDate).toLocaleDateString('zh-CN')
                          : '暂无'}
                      </p>
                    </div>
                  )}
                </Card>
              </Col>
              <Col span={12}>
                <Card title="学习统计">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">错题本数量</span>
                      <span className="text-2xl font-bold text-orange-500">{learningProfile.wrongQuestionCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">累计学习时长</span>
                      <span className="text-2xl font-bold text-blue-500">{formatStudyTime(learningProfile.totalStudyMinutes)}</span>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>

            <Card title="最近考试记录">
              {learningProfile.examRecords.length > 0 ? (
                <div className="space-y-3">
                  {learningProfile.examRecords.map(record => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{record.paperTitle}</p>
                        <p className="text-sm text-gray-500">{new Date(record.examDate).toLocaleDateString('zh-CN')}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${record.status === 'PASS' ? 'text-green-500' : 'text-red-500'}`}>
                          {record.score}/{record.totalScore}
                        </p>
                        <Tag color={record.status === 'PASS' ? 'green' : 'red'}>
                          {record.status === 'PASS' ? '及格' : '不及格'}
                        </Tag>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty description="暂无考试记录" />
              )}
            </Card>
          </div>
        ) : (
          <Empty />
        )}
      </Modal>

      <Modal
        title="批量导入用户"
        open={importModalVisible}
        onCancel={() => {
          setImportModalVisible(false);
          setImportResult(null);
        }}
        footer={null}
        width={500}
      >
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">导入说明：</p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• 请下载Excel模板，按格式填写用户信息</li>
              <li>• 模板字段：用户名、姓名、密码、角色、科室</li>
              <li>• 角色可选：{roleOptions.map(r => r.label).join('、')}</li>
              <li>• 请为每个用户设置安全的密码</li>
            </ul>
          </div>

          <Button icon={<DownloadOutlined />} block onClick={handleDownloadTemplate}>
            下载导入模板
          </Button>

          <Upload
            name="file"
            accept=".xlsx,.xls"
            beforeUpload={() => false}
            onChange={handleImportFile}
            fileList={[]}
            disabled={importUploading}
          >
            <Button icon={<UploadOutlined />} block disabled={importUploading}>
              {importUploading ? '上传中...' : '选择Excel文件'}
            </Button>
          </Upload>

          {importUploading && (
            <Progress percent={importProgress} status="active" />
          )}

          {importResult && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm mb-2">导入结果：</p>
              <div className="flex gap-4 text-sm">
                <span className="text-green-500">成功：{importResult.success}条</span>
                <span className="text-red-500">失败：{importResult.failed}条</span>
              </div>
              {importResult.failedDetails.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-2">失败详情：</p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {importResult.failedDetails.map((detail, idx) => (
                      <p key={idx} className="text-xs text-red-500">{detail}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}