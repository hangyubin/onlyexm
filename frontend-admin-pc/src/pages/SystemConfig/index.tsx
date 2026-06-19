import { Card, Button, Form, Input, InputNumber, Switch, Select, Row, Col, message, Tabs, Table, Modal, Popconfirm, Tag, Space, ColorPicker } from 'antd';
import { SaveOutlined, RestOutlined, PlusOutlined, EditOutlined, DeleteOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useState, useEffect, useCallback } from 'react';
import { systemApi, DictItem } from '../../api/system';
import { clearDictCache } from '../../hooks/useDictData';
import { pinyin } from 'pinyin-pro';

const { Option } = Select;

function ConfigTab() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const config = await systemApi.getConfig();
      form.setFieldsValue({
        monthlyRequiredCount: config.monthlyRequiredCount ?? 20,
        infectionTargetScore: config.infectionTargetScore ?? 60,
        infectionTargetRate: config.infectionTargetRate ?? 80,
        practiceCount: config.practiceCount ?? 3,
        wrongQuestionReviewDays: config.wrongQuestionReviewDays ?? 7,
        antiCheatEnabled: config.antiCheatEnabled ?? true,
        offlineEnabled: config.offlineEnabled ?? false,
        autoSyncEnabled: config.autoSyncEnabled ?? true,
        syncInterval: config.syncInterval ?? 30,
      });
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      try {
        await systemApi.saveConfig(values);
        message.success('配置保存成功');
      } catch (apiError) {
        message.error('配置保存失败，请稍后重试');
      }
    } catch (validationError) {
      // 表单验证失败，Ant Design 会自动展示验证错误提示
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    loadConfig();
  };

  return (
    <div>
      <div className="flex justify-end gap-2 mb-4">
        <Button icon={<RestOutlined />} onClick={handleReset}>重置</Button>
        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={loading}>
          保存配置
        </Button>
      </div>

      <Card title="院感达标配置">
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="monthlyRequiredCount" label="每月院感要求题数" rules={[{ required: true, message: '请输入每月院感要求题数' }]}>
                <InputNumber min={1} max={100} placeholder="每月院感要求题数" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="infectionTargetScore" label="达标分数" rules={[{ required: true, message: '请输入达标分数' }]}>
                <InputNumber min={0} max={100} placeholder="请输入达标分数" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="infectionTargetRate" label="达标正确率" rules={[{ required: true, message: '请输入达标正确率' }]}>
                <InputNumber min={0} max={100} placeholder="请输入达标正确率(%)" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="practiceCount" label="每日练习次数" rules={[{ required: true, message: '请输入每日练习次数' }]}>
                <InputNumber min={1} max={50} placeholder="请输入每日练习次数" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="wrongQuestionReviewDays" label="错题复习天数" rules={[{ required: true, message: '请输入错题复习天数' }]}>
                <InputNumber min={1} max={30} placeholder="请输入错题复习天数" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card title="防作弊配置" className="mt-4">
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="antiCheatEnabled" label="启用防作弊" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card title="离线配置" className="mt-4">
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="offlineEnabled" label="启用离线模式" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="autoSyncEnabled" label="自动同步" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="syncInterval" label="同步间隔(分钟)" rules={[{ required: true, message: '请输入同步间隔' }]}>
                <InputNumber min={1} max={1440} placeholder="请输入同步间隔" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
}

function DictManageTab() {
  const [dictItems, setDictItems] = useState<DictItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('QUESTION_CATEGORY');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<DictItem | null>(null);
  const [form] = Form.useForm();

  const categories = [
    { value: 'QUESTION_CATEGORY', label: '题目分类' },
    { value: 'INFECTION_TAG', label: '院感标签' },
    { value: 'ROLE', label: '角色' },
    { value: 'DEPARTMENT', label: '科室' },
    { value: 'QUESTION_TYPE', label: '题目类型' },
    { value: 'HOSPITAL_LEVEL', label: '医院等级' },
  ];

  const fetchDictItems = useCallback(async () => {
    setLoading(true);
    try {
      const items = await systemApi.getAllDicts(selectedCategory);
      setDictItems(items);
    } catch (error) {
      message.error('获取字典数据失败');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchDictItems();
  }, [fetchDictItems]);

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ category: selectedCategory, isActive: true, sortOrder: 0 });
    setModalVisible(true);
  };

  const handleEdit = (record: DictItem) => {
    setEditingItem(record);
    form.setFieldsValue({
      category: record.category,
      code: record.code,
      name: record.name,
      color: record.color,
      sortOrder: record.sortOrder,
      isActive: record.isActive,
      remark: record.remark,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await systemApi.deleteDict(id);
      message.success('删除成功');
      clearDictCache();
      fetchDictItems();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleInit = async () => {
    try {
      const result = await systemApi.initDict([selectedCategory]);
      message.success(`初始化完成：创建${result.created}条，跳过${result.skipped}条`);
      clearDictCache();
      fetchDictItems();
    } catch (error) {
      message.error('初始化失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingItem) {
        await systemApi.updateDict(editingItem.id, {
          name: values.name,
          color: values.color,
          sortOrder: values.sortOrder,
          isActive: values.isActive,
          remark: values.remark,
        });
        message.success('编辑成功');
      } else {
        await systemApi.createDict(values);
        message.success('创建成功');
      }
      clearDictCache();
      setModalVisible(false);
      form.resetFields();
      fetchDictItems();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    { title: '编码', dataIndex: 'code', key: 'code' },
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '颜色', dataIndex: 'color', key: 'color', render: (color: string) => color ? <Tag color={color}><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', backgroundColor: color, marginRight: 4, verticalAlign: 'middle' }} />{color}</Tag> : '-' },
    { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder' },
    { title: '状态', dataIndex: 'isActive', key: 'isActive', render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? '启用' : '禁用'}</Tag> },
    { title: '备注', dataIndex: 'remark', key: 'remark', render: (v: string | undefined) => v || '-' },
    {
      title: '操作', key: 'actions', render: (_: unknown, record: DictItem) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除吗？" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">字典分类:</span>
          <Select value={selectedCategory} onChange={setSelectedCategory} style={{ width: 200 }}>
            {categories.map(c => <Option key={c.value} value={c.value}>{c.label}</Option>)}
          </Select>
        </div>
        <div className="flex gap-2">
          <Button icon={<ThunderboltOutlined />} onClick={handleInit}>初始化字典</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增字典项</Button>
        </div>
      </div>

      <Table columns={columns} dataSource={dictItems} rowKey="id" loading={loading} />

      <Modal
        title={editingItem ? '编辑字典项' : '新增字典项'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => { setModalVisible(false); setEditingItem(null); form.resetFields(); }}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="category" label="字典分类" rules={[{ required: true, message: '请选择字典分类' }]}>
            <Select disabled={!!editingItem}>
              {categories.map(c => <Option key={c.value} value={c.value}>{c.label}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="code" label="编码" rules={[{ required: true, message: '请输入编码' }]}>
            <Input placeholder="输入名称后自动生成，也可手动修改" disabled={!!editingItem} />
          </Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="请输入名称" onChange={(e) => {
              if (!editingItem && e.target.value) {
                const py = pinyin(e.target.value, { toneType: 'none', type: 'array' }).join('').toUpperCase();
                form.setFieldsValue({ code: py });
              }
            }} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="color" label="颜色">
                <Input placeholder="点击下方选择颜色" readOnly style={{ width: '100%' }} />
              </Form.Item>
              <div className="flex flex-wrap gap-2 -mt-4 mb-4">
                {['#f5222d', '#fa541c', '#fa8c16', '#faad14', '#a0d911', '#52c41a', '#13c2c2', '#1890ff', '#2f54eb', '#722ed1', '#eb2f96', '#ff85c0'].map(c => (
                  <div
                    key={c}
                    className="w-7 h-7 rounded cursor-pointer border-2 border-gray-200 hover:scale-125 transition-transform"
                    style={{ backgroundColor: c }}
                    onClick={() => form.setFieldsValue({ color: c })}
                  />
                ))}
                <ColorPicker
                  format="hex"
                  showText
                  onChangeComplete={(color) => {
                    form.setFieldsValue({ color: color.toHexString() });
                  }}
                />
              </div>
            </Col>
            <Col span={12}>
              <Form.Item name="sortOrder" label="排序">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="isActive" label="是否启用" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function HospitalManageTab() {
  const [hospitals, setHospitals] = useState<{ id: number; name: string; level: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: number; name: string; level: string } | null>(null);
  const [form] = Form.useForm();
  const [levelOptions, setLevelOptions] = useState<{ value: string; label: string }[]>([]);

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const data = await systemApi.getHospitals();
      setHospitals(data);
    } catch (error) {
      message.error('获取医院列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadLevelDict = async () => {
    try {
      const items = await systemApi.getDict('HOSPITAL_LEVEL');
      setLevelOptions(items.map(item => ({ value: item.code, label: item.name })));
    } catch (error) {
      console.error('加载医院等级字典失败:', error);
    }
  };

  useEffect(() => {
    fetchHospitals();
    loadLevelDict();
  }, []);

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: { id: number; name: string; level: string }) => {
    setEditingItem(record);
    form.setFieldsValue({ name: record.name, level: record.level });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await systemApi.deleteHospital(id);
      message.success('删除成功');
      fetchHospitals();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingItem) {
        await systemApi.updateHospital(editingItem.id, values);
        message.success('编辑成功');
      } else {
        await systemApi.createHospital(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      form.resetFields();
      fetchHospitals();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    { title: '医院名称', dataIndex: 'name', key: 'name' },
    { title: '医院等级', dataIndex: 'level', key: 'level', render: (v: string) => {
      const item = levelOptions.find(o => o.value === v);
      return item ? item.label : (v || '-');
    }},
    {
      title: '操作', key: 'actions', render: (_: unknown, record: { id: number; name: string; level: string }) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除吗？" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增医院</Button>
      </div>

      <Table columns={columns} dataSource={hospitals} rowKey="id" loading={loading} />

      <Modal
        title={editingItem ? '编辑医院' : '新增医院'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => { setModalVisible(false); setEditingItem(null); form.resetFields(); }}
        width={450}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="医院名称" rules={[{ required: true, message: '请输入医院名称' }]}>
            <Input placeholder="请输入医院名称" />
          </Form.Item>
          <Form.Item name="level" label="医院等级">
            <Select placeholder="请选择医院等级" allowClear onChange={(value) => value ?? undefined}>
              {levelOptions.map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default function SystemConfig() {
  const tabItems = [
    { key: 'config', label: '系统配置', children: <ConfigTab /> },
    { key: 'dict', label: '字典管理', children: <DictManageTab /> },
    { key: 'hospital', label: '医院管理', children: <HospitalManageTab /> },
  ];

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-800">系统配置</h2>
      </div>
      <Tabs items={tabItems} />
    </div>
  );
}
