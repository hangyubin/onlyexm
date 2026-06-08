import { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Popconfirm, message, Input, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { LearningMaterial, learningMaterialApi, LearningMaterialListParams } from '../../api/learningMaterial';
import { useDictData } from '../../hooks/useDictData';
import LearningMaterialModal from '../../components/LearningMaterialModal';

const { Option } = Select;

export default function LearningMaterialManage() {
  const [modalVisible, setModalVisible] = useState(false);
  const [editData, setEditData] = useState<LearningMaterial | null>(null);
  const [data, setData] = useState<LearningMaterial[]>([]);
  const [loading, setLoading] = useState(false);

  const typeDictData = useDictData('MATERIAL_TYPE');
  const typeDict = Object.keys(typeDictData.dictMap).length > 0 ? typeDictData.dictMap : {
    ARTICLE: { label: '文章', color: 'blue' },
    VIDEO: { label: '视频', color: 'green' },
    PDF: { label: 'PDF', color: 'orange' },
    DOC: { label: 'Word文档', color: 'purple' },
    EXCEL: { label: 'Excel表格', color: 'cyan' },
    PPT: { label: 'PowerPoint', color: 'magenta' },
  };

  const [searchForm, setSearchForm] = useState({
    keyword: '',
    type: '',
    category: '',
    isActive: undefined as boolean | undefined,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: LearningMaterialListParams = {
        keyword: searchForm.keyword || undefined,
        type: searchForm.type || undefined,
        category: searchForm.category || undefined,
        isActive: searchForm.isActive,
      };
      const response = await learningMaterialApi.getList(params);
      if (response.success) {
        setData(response.data);
      } else {
        setData([]);
      }
    } catch (error) {
      message.error('获取学习资料列表失败');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchData();
  };

  const handleReset = () => {
    setSearchForm({
      keyword: '',
      type: '',
      category: '',
      isActive: undefined,
    });
    fetchData();
  };

  const handleAdd = () => {
    setEditData(null);
    setModalVisible(true);
  };

  const handleEdit = (record: LearningMaterial) => {
    setEditData(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await learningMaterialApi.delete(id);
      if (response.success) {
        message.success(response.message || '删除成功');
        fetchData();
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setEditData(null);
  };

  const handleModalSuccess = () => {
    handleModalClose();
    fetchData();
  };

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      ellipsis: true,
      width: 200,
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
      width: 200,
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      render: (type: string) => (
        <Tag color={typeDict[type]?.color || 'gray'}>
          {typeDict[type]?.label || type}
        </Tag>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      width: 120,
      render: (category: string) => category || '-',
    },
    {
      title: '浏览次数',
      dataIndex: 'viewCount',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      width: 80,
      align: 'center' as const,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      width: 80,
      align: 'center' as const,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
    },
    {
      title: '操作',
      width: 150,
      fixed: 'right' as const,
      render: (_: unknown, record: LearningMaterial) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个学习资料吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <Input
            placeholder="搜索标题或描述"
            prefix={<SearchOutlined />}
            value={searchForm.keyword}
            onChange={(e) => setSearchForm({ ...searchForm, keyword: e.target.value })}
            onPressEnter={handleSearch}
            style={{ width: 250 }}
          />
          <Select
            placeholder="选择类型"
            value={searchForm.type}
            onChange={(value) => setSearchForm({ ...searchForm, type: value })}
            allowClear
            style={{ width: 120 }}
          >
            <Option value="">全部</Option>
            {Object.entries(typeDict).map(([key, value]) => (
              <Option key={key} value={key}>{value.label}</Option>
            ))}
          </Select>
          <Input
            placeholder="搜索分类"
            value={searchForm.category}
            onChange={(e) => setSearchForm({ ...searchForm, category: e.target.value })}
            style={{ width: 150 }}
          />
          <Select
            placeholder="选择状态"
            value={searchForm.isActive === undefined ? '' : searchForm.isActive}
            onChange={(value) => setSearchForm({ ...searchForm, isActive: value === '' ? undefined : Boolean(value) })}
            allowClear
            style={{ width: 120 }}
          >
            <Option value="">全部</Option>
            <Option value={true}>启用</Option>
            <Option value={false}>禁用</Option>
          </Select>
          <Space>
            <Button type="primary" onClick={handleSearch}>
              搜索
            </Button>
            <Button onClick={handleReset}>
              重置
            </Button>
          </Space>
        </div>
        <div className="flex justify-between items-center">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建学习资料
        </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
      />

      <LearningMaterialModal
        open={modalVisible}
        editData={editData}
        onCancel={handleModalClose}
        onSubmit={async (data) => {
          try {
            if (editData) {
              const response = await learningMaterialApi.update(editData.id, data);
              if (response.success) {
                message.success(response.message || '更新成功');
                handleModalSuccess();
              }
            } else {
              const response = await learningMaterialApi.create(data);
              if (response.success) {
                message.success(response.message || '创建成功');
                handleModalSuccess();
              }
            }
          } catch (error) {
            message.error(editData ? '更新失败' : '创建失败');
          }
        }}
      />
    </div>
  );
}