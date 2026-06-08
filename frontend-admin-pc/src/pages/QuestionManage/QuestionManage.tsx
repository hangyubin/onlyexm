import { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Popconfirm, message, Tooltip, Input, Select } from 'antd';
import { PlusOutlined, UploadOutlined, DownloadOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { Question, questionApi, QuestionListParams } from '../../api/question';
import { useMultiDictData, useDebouncedValue } from '../../hooks/useDictData';
import QuestionModal from '../../components/QuestionModal';
import BatchImportModal from '../../components/BatchImportModal';
import PreviewModal from '../../components/PreviewModal';

const { Option } = Select;

export default function QuestionManage() {
  const [modalVisible, setModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [editData, setEditData] = useState<Question | null>(null);
  const [previewData, setPreviewData] = useState<Question | null>(null);
  const [data, setData] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 });

  const [searchForm, setSearchForm] = useState({
    content: '',
    type: '',
    category: '',
    infectionTag: '',
    difficulty: undefined as number | undefined,
  });
  const debouncedSearchContent = useDebouncedValue(searchForm.content);

  const { data: dictData } = useMultiDictData(['QUESTION_TYPE', 'QUESTION_CATEGORY', 'INFECTION_TAG']);
  const typeDict = dictData?.QUESTION_TYPE?.dictMap || {};
  const categoryDict = dictData?.QUESTION_CATEGORY?.dictMap || {};
  const tagDict = dictData?.INFECTION_TAG?.dictMap || {};
  const categoryOptions = dictData?.QUESTION_CATEGORY?.options || [];
  const tagOptions = dictData?.INFECTION_TAG?.options || [];

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: QuestionListParams = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        content: debouncedSearchContent || undefined,
        type: searchForm.type || undefined,
        category: searchForm.category || undefined,
        infectionTag: searchForm.infectionTag || undefined,
        difficulty: searchForm.difficulty,
      };
      const response = await questionApi.getList(params);
      setData(response.data);
      setTotal(response.total);
    } catch (error) {
      message.error('获取题目列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination, debouncedSearchContent]);

  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 });
    fetchData();
  };

  const handleReset = () => {
    setSearchForm({
      content: '',
      type: '',
      category: '',
      infectionTag: '',
      difficulty: undefined,
    });
    setPagination({ ...pagination, page: 1 });
    fetchData();
  };

  const handleAdd = () => {
    setEditData(null);
    setModalVisible(true);
  };

  const handleEdit = (record: Question) => {
    setEditData(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await questionApi.delete(id);
      message.success('删除成功');
      fetchData();
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
      title: '题目内容',
      dataIndex: 'content',
      ellipsis: true,
      width: 300,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '题型',
      dataIndex: 'type',
      width: 80,
      render: (type: string) => (
        <Tag color={typeDict[type]?.color || 'gray'}>
          {typeDict[type]?.label || type}
        </Tag>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      width: 100,
      render: (category: string) => (
        <Tag color={categoryDict[category]?.color || 'gray'}>{categoryDict[category]?.label || category}</Tag>
      ),
    },
    {
      title: '院感标签',
      dataIndex: 'infectionTag',
      width: 120,
      render: (tag: string | undefined) => {
        if (!tag) return <span className="text-gray-400">-</span>;
        return <Tag color={tagDict[tag]?.color || 'gray'}>{tagDict[tag]?.label || tag}</Tag>;
      },
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      width: 80,
      align: 'center' as const,
      render: (level: number) => (
        <span className="flex items-center justify-center">
          {'⭐'.repeat(level || 1)}
          <span className="text-xs text-gray-500 ml-1">
            {level === 1 ? '基础' : '进阶'}
          </span>
        </span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, record: Question) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" onClick={() => { setPreviewData(record); setPreviewModalVisible(true); }}>预览</Button>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除吗？" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex flex-wrap gap-4 items-center">
          <Input
            placeholder="搜索题目内容"
            prefix={<SearchOutlined />}
            value={searchForm.content}
            onChange={(e) => setSearchForm({ ...searchForm, content: e.target.value })}
            style={{ width: 200 }}
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="题型"
            value={searchForm.type || undefined}
            onChange={(value) => setSearchForm({ ...searchForm, type: value ?? '' })}
            style={{ width: 120 }}
            allowClear
          >
            {Object.entries(typeDict).map(([code, info]) => (
              <Option key={code} value={code}>{info.label}</Option>
            ))}
          </Select>
          <Select
            placeholder="分类"
            value={searchForm.category || undefined}
            onChange={(value) => setSearchForm({ ...searchForm, category: value ?? '' })}
            style={{ width: 140 }}
            allowClear
          >
            {categoryOptions.map(opt => (
              <Option key={opt.value} value={opt.value}>{opt.label}</Option>
            ))}
          </Select>
          <Select
            placeholder="院感标签"
            value={searchForm.infectionTag || undefined}
            onChange={(value) => setSearchForm({ ...searchForm, infectionTag: value ?? '' })}
            style={{ width: 140 }}
            allowClear
          >
            {tagOptions.map(opt => (
              <Option key={opt.value} value={opt.value}>{opt.label}</Option>
            ))}
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
          <Button onClick={handleReset}>重置</Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">题库管理</h2>
          <Space>
            <Button icon={<DownloadOutlined />} onClick={async () => {
              try {
                const blob = await questionApi.downloadTemplate();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = '题目导入模板.xlsx';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
              } catch {
                message.error('下载模板失败');
              }
            }}>下载模板</Button>
            <Button icon={<UploadOutlined />} onClick={() => setImportModalVisible(true)}>批量导入</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增题目</Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, pageSize) => setPagination({ page, pageSize }),
          }}
        />
      </div>

      <QuestionModal
        open={modalVisible}
        onCancel={handleModalClose}
        onSubmit={(questionData) => {
          if (editData) {
            questionApi.update(editData.id, questionData).then(() => {
              message.success('更新成功');
              handleModalSuccess();
            }).catch(() => message.error('更新失败'));
          } else {
            questionApi.create(questionData).then(() => {
              message.success('创建成功');
              handleModalSuccess();
            }).catch(() => message.error('创建失败'));
          }
        }}
        editData={editData}
      />

      <BatchImportModal
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        onSuccess={() => { setImportModalVisible(false); fetchData(); }}
      />

      <PreviewModal
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        data={previewData}
      />
    </div>
  );
}
