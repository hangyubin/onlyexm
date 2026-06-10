import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import {
  Table, Button, Tag, Space, Popconfirm, message, Input, Select, InputNumber,
  Modal, Steps, Row, Col, Card, Divider, Radio, DatePicker
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
  PlayCircleOutlined, PauseCircleOutlined, ApiOutlined,
  PrinterOutlined
} from '@ant-design/icons';
import { Paper, paperApi, SmartGenerateParams } from '../../api/paper';
import { questionApi, Question } from '../../api/question';
import api from '../../api/axios';
import { useMultiDictData } from '../../hooks/useDictData';

const { Option } = Select;
const { Step } = Steps;

type SelectedQuestionType = Question & { score: number };

export default function PaperManage() {
  const [data, setData] = useState<Paper[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 });
  const [modalVisible, setModalVisible] = useState(false);
  const [publishModalVisible, setPublishModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);

  const [basicInfo, setBasicInfo] = useState({
    title: '',
    description: '',
    duration: 60,
    passScore: 60,
    departments: [] as string[],
    examStartTime: null as string | null,
    examEndTime: null as string | null,
  });

  const [selectedQuestions, setSelectedQuestions] = useState<SelectedQuestionType[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [searchContent, setSearchContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionPagination, setQuestionPagination] = useState({ page: 1, pageSize: 20 });
  const [questionTotal, setQuestionTotal] = useState(0);
  const [batchScoreByType, setBatchScoreByType] = useState<Record<string, number>>({});
  const [selectMethod, setSelectMethod] = useState<'manual' | 'smart'>('manual');

  // 使用统一字典 Hook
  const { data: dictData } = useMultiDictData(['DEPARTMENT', 'QUESTION_TYPE', 'QUESTION_CATEGORY']);
  const departmentOptions = dictData?.DEPARTMENT?.options || [];
  const typeDict = dictData?.QUESTION_TYPE?.dictMap || {};
  const typeOptions = dictData?.QUESTION_TYPE?.options || [];
  const categoryDict = dictData?.QUESTION_CATEGORY?.dictMap || {};
  const categoryOptions = dictData?.QUESTION_CATEGORY?.options || [];

  const [smartConfig, setSmartConfig] = useState({
    categoryCounts: {} as Record<string, number>,
    singleCount: 10,
    singleScore: 2,
    multipleCount: 5,
    multipleScore: 3,
    judgeCount: 5,
    judgeScore: 2,
    caseCount: 2,
    caseScore: 5,
    difficultyRatio: '5:3:2',
  });

  // 当考试开始时间或时长变化时，自动计算结束时间
  useEffect(() => {
    if (basicInfo.examStartTime && basicInfo.duration) {
      const endTime = dayjs(basicInfo.examStartTime).add(basicInfo.duration, 'minute').format('YYYY-MM-DD HH:mm');
      setBasicInfo((prev) => (prev.examEndTime !== endTime ? { ...prev, examEndTime: endTime } : prev));
    } else {
      setBasicInfo((prev) => (prev.examEndTime !== null ? { ...prev, examEndTime: null } : prev));
    }
  }, [basicInfo.examStartTime, basicInfo.duration]);

  // 初始化智能组卷分类数量
  useEffect(() => {
    if (categoryOptions.length > 0 && Object.keys(smartConfig.categoryCounts).length === 0) {
      setSmartConfig(prev => ({
        ...prev,
        categoryCounts: categoryOptions.reduce((acc, item) => ({ ...acc, [item.value]: 0 }), {}),
      }));
    }
  }, [categoryOptions]);

  const fetchPapers = async () => {
    setLoading(true);
    try {
      const response = await paperApi.getList(pagination);
      setData(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('获取试卷列表失败:', error);
      message.error('获取试卷列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async (searchParams?: { content?: string; category?: string; type?: string; page?: number }) => {
    setQuestionLoading(true);
    try {
      const params: any = {
        page: searchParams?.page || questionPagination.page,
        pageSize: questionPagination.pageSize,
      };
      const content = searchParams?.content ?? searchContent;
      const category = searchParams?.category ?? selectedCategory;
      const type = searchParams?.type ?? selectedType;
      if (content) params.content = content;
      if (category) params.category = category;
      if (type) params.type = type;
      const response = await questionApi.getList(params);
      setAvailableQuestions(response.data);
      setQuestionTotal(response.total);
    } catch (error) {
      console.error('获取题目失败:', error);
    } finally {
      setQuestionLoading(false);
    }
  };

  const handleSearchQuestions = () => {
    setQuestionPagination(prev => ({ ...prev, page: 1 }));
    fetchQuestions({ page: 1 });
  };

  useEffect(() => {
    fetchPapers();
  }, [pagination]);

  useEffect(() => {
    if (modalVisible && selectMethod === 'manual') {
      setSearchContent('');
      setSelectedCategory('');
      setSelectedType('');
      setQuestionPagination({ page: 1, pageSize: 20 });
      fetchQuestions({ content: '', category: '', type: '', page: 1 });
    }
  }, [modalVisible, selectMethod]);

  const paperColumns = [
    { title: '试卷名称', dataIndex: 'title', key: 'title' },
    { title: '总分', dataIndex: 'totalScore', key: 'totalScore', render: (score: number) => `${score}分` },
    { title: '及格线', dataIndex: 'passScore', key: 'passScore', render: (score: number) => `${score}分` },
    { title: '时长', dataIndex: 'duration', key: 'duration', render: (min: number) => `${min ?? '-'}分钟` },
    {
      title: '考试时间',
      key: 'examTime',
      render: (_: any, record: Paper) => {
        if (!record.examStartTime || !record.examEndTime) return <span className="text-gray-400">未设置</span>;
        const start = new Date(record.examStartTime).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
        const end = new Date(record.examEndTime).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
        return <span className="text-xs">{start} ~ {end}</span>;
      },
    },
    { title: '题目数', dataIndex: 'questionCount', key: 'questionCount', render: (count: number, record: Paper) => count ?? record.questions?.length ?? 0 },
    {
      title: '状态',
      key: 'status',
      render: (_: any, record: Paper) => {
        if (record.isPublished) {
          const now = new Date();
          const endTime = record.examEndTime ? new Date(record.examEndTime) : null;
          const startTime = record.examStartTime ? new Date(record.examStartTime) : null;
          if (endTime && now > endTime) return <Tag color="default">已结束</Tag>;
          if (startTime && now < startTime) return <Tag color="orange">未开始</Tag>;
          return <Tag color="green">进行中</Tag>;
        }
        return <Tag color="default">未发布</Tag>;
      },
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', render: (date: string) => new Date(date).toLocaleString('zh-CN') },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: Paper) => (
        <Space>
          {!record.isPublished && (
            <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)} />
          )}
          {/* 未发布或已结束的试卷可以删除 */}
          {!record.isPublished || !record.isActive ? (
            <Popconfirm title="确定删除该试卷吗？此操作不可撤销，且会删除相关考试记录。" onConfirm={() => handleDelete(record.id)}>
              <Button icon={<DeleteOutlined />} size="small" danger />
            </Popconfirm>
          ) : null}
          {!record.isPublished ? (
            <Button
              icon={<PlayCircleOutlined />}
              size="small"
              type="primary"
              onClick={() => handlePublish(record)}
            >
              发布
            </Button>
          ) : record.isActive ? (
            <Popconfirm title="确定取消发布吗？取消后用户将无法看到此试卷。" onConfirm={() => handleUnpublish(record)}>
              <Button
                icon={<PauseCircleOutlined />}
                size="small"
                danger
              >
                取消发布
              </Button>
            </Popconfirm>
          ) : null}
          <Button icon={<EyeOutlined />} size="small" onClick={() => handlePreview(record)} />
          <Button icon={<PrinterOutlined />} size="small" onClick={() => handlePrint(record)} />
        </Space>
      ),
    },
  ];

  const handleEdit = async (record: Paper) => {
    try {
      const detail = await paperApi.getById(record.id);
      setSelectedPaper(detail);
      setBasicInfo({
        title: detail.title,
        description: detail.description,
        duration: detail.duration,
        passScore: detail.passScore,
        departments: detail.departments,
        examStartTime: detail.examStartTime,
        examEndTime: detail.examEndTime,
      });
      setSelectedQuestions(detail.questions.map(q => ({
        id: q.questionId,
        content: q.content,
        type: q.type as 'SINGLE' | 'MULTIPLE' | 'JUDGE' | 'CASE',
        score: q.score,
        category: '',
        infectionTag: undefined,
        difficulty: 1,
        options: [],
        correctAnswer: [],
        analysis: '',
        source: '',
        createdAt: '',
      })));
      setCurrentStep(0);
      setModalVisible(true);
    } catch (error) {
      message.error('获取试卷详情失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await paperApi.delete(id);
      message.success('删除成功');
      fetchPapers();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handlePreview = async (record: Paper) => {
    try {
      const detail = await paperApi.getById(record.id);
      setSelectedPaper(detail);
      setPreviewModalVisible(true);
    } catch (error) {
      message.error('获取试卷详情失败');
    }
  };

  const handlePrint = async (record: Paper) => {
    const loadingMessage = message.loading('正在生成试卷...', 0);
    try {
      const response = await api.get(`/papers/${record.id}/print`, { responseType: 'blob' });
      loadingMessage();
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${record.title}_空白试卷.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      message.success('试卷已下载');
    } catch (error) {
      loadingMessage();
      message.error('打印失败');
      console.error('Print error:', error);
    }
  };

  const handlePublish = (record: Paper) => {
    setSelectedPaper(record);
    setPublishModalVisible(true);
  };

  const handleAddQuestion = (question: Question) => {
    if (!selectedQuestions.find(q => q.id === question.id)) {
      const defaultScore = question.type === 'CASE' ? 10 : 5;
      setSelectedQuestions([...selectedQuestions, { ...question, score: defaultScore }]);
    }
  };

  const handleRemoveQuestion = (questionId: number) => {
    setSelectedQuestions(selectedQuestions.filter(q => q.id !== questionId));
  };

  const handleScoreChange = (questionId: number, score: number) => {
    setSelectedQuestions(selectedQuestions.map(q =>
      q.id === questionId ? { ...q, score } : q
    ));
  };

  const handleSmartGenerate = async () => {
    try {
      if (!basicInfo.title) {
        message.error('请先填写试卷名称');
        return;
      }

      const totalQuestions = smartConfig.singleCount + smartConfig.multipleCount + smartConfig.judgeCount + smartConfig.caseCount;
      if (totalQuestions === 0) {
        message.error('请至少设置一种题型的数量');
        return;
      }

      const params: SmartGenerateParams = {
        title: basicInfo.title,
        description: basicInfo.description,
        duration: basicInfo.duration,
        passScore: basicInfo.passScore,
        departments: basicInfo.departments,
        categoryCounts: smartConfig.categoryCounts,
        typeCounts: {
          single: smartConfig.singleCount,
          multiple: smartConfig.multipleCount,
          judge: smartConfig.judgeCount,
          case: smartConfig.caseCount,
        },
        typeScores: {
          single: smartConfig.singleScore,
          multiple: smartConfig.multipleScore,
          judge: smartConfig.judgeScore,
          case: smartConfig.caseScore,
        },
        difficultyRatio: smartConfig.difficultyRatio,
      };

      const response = await paperApi.smartGenerate(params);
      
      if (!response.questions || response.questions.length === 0) {
        message.error('组卷失败：未生成任何题目，请调整参数后重试');
        return;
      }

      setSelectedPaper(response);
      setSelectedQuestions(response.questions.map(q => ({
        id: q.questionId,
        content: q.content,
        type: q.type as 'SINGLE' | 'MULTIPLE' | 'JUDGE' | 'CASE',
        score: q.score,
        category: '',
        infectionTag: undefined,
        difficulty: 1,
        options: [],
        correctAnswer: [],
        analysis: '',
        source: '',
        createdAt: '',
      })));
      message.success(`智能组卷成功，共生成 ${response.questions.length} 道题目`);
      setCurrentStep(2);
    } catch (error: any) {
      const errMsg = error?.response?.data?.message || error?.response?.data?.error || '组卷失败';
      message.error(errMsg);
    }
  };

  const handleSubmit = async () => {
    try {
      if (selectedQuestions.length === 0) {
        message.error('请先选择题目或使用智能组卷生成题目');
        return;
      }

      const paperData = {
        title: basicInfo.title,
        description: basicInfo.description,
        duration: basicInfo.duration,
        passScore: basicInfo.passScore,
        departments: basicInfo.departments,
        examStartTime: basicInfo.examStartTime,
        examEndTime: basicInfo.examEndTime,
        totalScore: selectedQuestions.reduce((sum, q) => sum + q.score, 0),
        questions: selectedQuestions.map(q => ({
          questionId: q.id,
          content: q.content,
          type: q.type,
          score: q.score,
        })),
      };

      if (selectedPaper && selectedPaper.id) {
        await paperApi.update(selectedPaper.id, paperData);
        message.success('更新成功');
      } else {
        await paperApi.create(paperData);
        message.success('创建成功');
      }
      setModalVisible(false);
      setSelectedPaper(null);
      setCurrentStep(0);
      setSelectedQuestions([]);
      fetchPapers();
    } catch (error: any) {
      const errMsg = error?.response?.data?.message || error?.response?.data?.error || '保存失败';
      message.error(errMsg);
    }
  };

  const handlePublishSubmit = async () => {
    if (!selectedPaper) return;
    try {
      await paperApi.publish(selectedPaper.id, { action: 'publish' });
      message.success('发布成功');
      setPublishModalVisible(false);
      setSelectedPaper(null);
      fetchPapers();
    } catch (error: any) {
      const msg = error?.response?.data?.error || '发布失败';
      message.error(msg);
    }
  };

  const handleUnpublish = async (record: Paper) => {
    try {
      await paperApi.publish(record.id, { action: 'unpublish' });
      message.success('已取消发布');
      fetchPapers();
    } catch (error: any) {
      const msg = error?.response?.data?.error || '取消发布失败';
      message.error(msg);
    }
  };

  const totalScore = selectedQuestions.reduce((sum, q) => sum + q.score, 0);

  // 按题型分组统计已选题目
  const selectedQuestionsByType = selectedQuestions.reduce((acc, q) => {
    if (!acc[q.type]) acc[q.type] = [];
    acc[q.type].push(q);
    return acc;
  }, {} as Record<string, SelectedQuestionType[]>);

  // 题型显示顺序
  const typeOrder = ['SINGLE', 'MULTIPLE', 'JUDGE', 'CASE'];
  const sortedTypeKeys = [
    ...typeOrder.filter(t => selectedQuestionsByType[t]),
    ...Object.keys(selectedQuestionsByType).filter(t => !typeOrder.includes(t)),
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-800">试卷管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          setSelectedPaper(null);
          setCurrentStep(0);
          setSelectedQuestions([]);
          setSelectMethod('manual');
          setBasicInfo({ title: '', description: '', duration: 60, passScore: 60, departments: [], examStartTime: null, examEndTime: null });
          setModalVisible(true);
        }}>
          新建试卷
        </Button>
      </div>

      <Table
        dataSource={data}
        columns={paperColumns}
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

      <Modal
        title={selectedPaper ? '编辑试卷' : '新建试卷'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedPaper(null);
          setCurrentStep(0);
          setSelectedQuestions([]);
          setSelectMethod('manual');
          setBasicInfo({ title: '', description: '', duration: 60, passScore: 60, departments: [], examStartTime: null, examEndTime: null });
        }}
        footer={null}
        width={900}
      >
        <Steps current={currentStep} onChange={setCurrentStep}>
          <Step title="基本信息" />
          <Step title="选题方式" />
          <Step title="确认预览" />
        </Steps>

        <div className="mt-6">
          {currentStep === 0 && (
            <div>
              <FormItem label="试卷名称">
                <Input
                  value={basicInfo.title}
                  onChange={(e) => setBasicInfo({ ...basicInfo, title: e.target.value })}
                  placeholder="请输入试卷名称"
                />
              </FormItem>
              <FormItem label="描述">
                <Input.TextArea
                  value={basicInfo.description}
                  onChange={(e) => setBasicInfo({ ...basicInfo, description: e.target.value })}
                  placeholder="请输入试卷描述（可选）"
                  rows={3}
                />
              </FormItem>
              <Row gutter={16}>
                <Col span={12}>
                  <FormItem label="考试时长（分钟）">
                    <InputNumber
                      value={basicInfo.duration}
                      onChange={(value) => setBasicInfo({ ...basicInfo, duration: value || 60 })}
                      min={5}
                      max={300}
                    />
                  </FormItem>
                </Col>
                <Col span={12}>
                  <FormItem label="及格线">
                    <InputNumber
                      value={basicInfo.passScore}
                      onChange={(value) => setBasicInfo({ ...basicInfo, passScore: value || 60 })}
                      min={0}
                      max={100}
                      suffix="分"
                    />
                  </FormItem>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <FormItem label="考试开始时间">
                    <DatePicker
                      showTime
                      format="YYYY-MM-DD HH:mm"
                      value={basicInfo.examStartTime ? dayjs(basicInfo.examStartTime) : undefined}
                      onChange={(_date: any, dateString: string | string[]) => setBasicInfo({ ...basicInfo, examStartTime: (typeof dateString === 'string' ? dateString : dateString[0]) || null })}
                      placeholder="选择开始时间"
                      className="w-full"
                    />
                  </FormItem>
                </Col>
                <Col span={12}>
                  <FormItem label="考试结束时间（自动计算）">
                    <DatePicker
                      showTime
                      format="YYYY-MM-DD HH:mm"
                      value={basicInfo.examEndTime ? dayjs(basicInfo.examEndTime) : undefined}
                      disabled
                      placeholder={basicInfo.examStartTime ? '自动根据开始时间+时长计算' : '请先设置开始时间和时长'}
                      className="w-full"
                    />
                  </FormItem>
                </Col>
              </Row>
              <FormItem label="适用科室（可选）">
                <Select
                  mode="multiple"
                  value={basicInfo.departments}
                  onChange={(value) => setBasicInfo({ ...basicInfo, departments: value })}
                  style={{ width: '100%' }}
                  placeholder="不选择则适用于所有科室"
                >
                  {departmentOptions.map(opt => (
                    <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                  ))}
                </Select>
              </FormItem>
            </div>
          )}

          {currentStep === 1 && (
            <div>
              <div className="mb-4">
                <span className="mr-4">选题方式：</span>
                <Radio.Group
                  value={selectMethod}
                  onChange={(e) => setSelectMethod(e.target.value as 'manual' | 'smart')}
                >
                  <Radio value="manual">手动选题</Radio>
                  <Radio value="smart">智能组卷</Radio>
                </Radio.Group>
              </div>

              {selectMethod === 'manual' ? (
                <Row gutter={16}>
                  <Col span={11}>
                    <Card title="可用题目" className="h-full">
                      <div className="mb-4 space-y-2">
                        <Input.Search
                          placeholder="搜索题目内容"
                          value={searchContent}
                          onChange={(e) => setSearchContent(e.target.value)}
                          onSearch={handleSearchQuestions}
                          allowClear
                          enterButton
                        />
                        <div className="flex gap-2">
                          <Select
                            value={selectedCategory}
                            onChange={(value) => {
                              setSelectedCategory(value);
                              fetchQuestions({ category: value, page: 1 });
                            }}
                            placeholder="按分类筛选"
                            className="flex-1"
                            allowClear
                          >
                            {categoryOptions.map(opt => (
                              <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                            ))}
                          </Select>
                          <Select
                            value={selectedType}
                            onChange={(value) => {
                              setSelectedType(value);
                              fetchQuestions({ type: value, page: 1 });
                            }}
                            placeholder="按题型筛选"
                            className="flex-1"
                            allowClear
                          >
                            {typeOptions.map(opt => (
                              <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                            ))}
                          </Select>
                        </div>
                      </div>
                      <div className="max-h-80 overflow-y-auto space-y-2">
                        {questionLoading ? (
                          <div className="text-gray-400 text-center py-12">加载中...</div>
                        ) : availableQuestions.length === 0 ? (
                          <div className="text-gray-400 text-center py-12">
                            <p>暂无符合条件的题目</p>
                          </div>
                        ) : (
                          availableQuestions.map(question => (
                            <div
                              key={question.id}
                              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                selectedQuestions.find(q => q.id === question.id)
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                              }`}
                              onClick={() => handleAddQuestion(question)}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <Tag color={typeDict[question.type]?.color || 'gray'} className="text-xs">{typeDict[question.type]?.label || question.type}</Tag>
                                <span className="text-xs text-gray-400">{categoryDict[question.category || '']?.label || question.category || '未分类'}</span>
                              </div>
                              <p className="text-sm text-gray-700 line-clamp-2">{question.content}</p>
                            </div>
                          ))
                        )}
                      </div>
                      {questionTotal > questionPagination.pageSize && (
                        <div className="mt-3 text-center">
                          <Space>
                            <Button
                              size="small"
                              disabled={questionPagination.page <= 1}
                              onClick={() => {
                                const newPage = questionPagination.page - 1;
                                setQuestionPagination(prev => ({ ...prev, page: newPage }));
                                fetchQuestions({ page: newPage });
                              }}
                            >
                              上一页
                            </Button>
                            <span className="text-sm text-gray-500">
                              {questionPagination.page} / {Math.ceil(questionTotal / questionPagination.pageSize)} 页（共{questionTotal}题）
                            </span>
                            <Button
                              size="small"
                              disabled={questionPagination.page >= Math.ceil(questionTotal / questionPagination.pageSize)}
                              onClick={() => {
                                const newPage = questionPagination.page + 1;
                                setQuestionPagination(prev => ({ ...prev, page: newPage }));
                                fetchQuestions({ page: newPage });
                              }}
                            >
                              下一页
                            </Button>
                          </Space>
                        </div>
                      )}
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title={`已选题目（${selectedQuestions.length}题，共${totalScore}分）`} className="h-full">
                      {selectedQuestions.length === 0 ? (
                        <div className="text-gray-400 text-center py-12">
                          <p>请从左侧选择题目</p>
                          <p className="text-sm mt-2">点击题目即可添加</p>
                        </div>
                      ) : (
                        <>
                          {Object.keys(selectedQuestionsByType).length > 0 && (
                            <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                              <div className="text-sm font-medium text-gray-600 mb-2">按题型批量设置分值</div>
                              <div className="space-y-2">
                                {Object.entries(selectedQuestionsByType).map(([type, questions]) => (
                                  <div key={type} className="flex items-center gap-2">
                                    <Tag color={typeDict[type]?.color || 'gray'} className="min-w-[60px] text-center">
                                      {typeDict[type]?.label || type}
                                    </Tag>
                                    <span className="text-xs text-gray-500">{questions.length}题</span>
                                    <InputNumber
                                      placeholder="分值"
                                      min={1}
                                      max={50}
                                      size="small"
                                      className="w-20"
                                      value={batchScoreByType[type]}
                                      onChange={(value) => {
                                        if (value && value > 0) {
                                          setBatchScoreByType(prev => ({ ...prev, [type]: value }));
                                        }
                                      }}
                                    />
                                    <span className="text-xs text-gray-400">分/题</span>
                                    <Button
                                      size="small"
                                      type="primary"
                                      disabled={!batchScoreByType[type]}
                                      onClick={() => {
                                        const score = batchScoreByType[type];
                                        if (score && score > 0) {
                                          setSelectedQuestions(selectedQuestions.map(q =>
                                            q.type === type ? { ...q, score } : q
                                          ));
                                          message.success(`已将${typeDict[type]?.label || type}的${questions.length}题分值设为${score}分`);
                                        }
                                      }}
                                    >
                                      应用
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="max-h-72 overflow-y-auto space-y-2">
                            {selectedQuestions.map((q, index) => (
                              <div key={q.id} className="p-3 border rounded-lg bg-white hover:shadow-sm transition-shadow">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-sm text-blue-600">第{index + 1}题</span>
                                  <Button icon={<DeleteOutlined />} size="small" danger onClick={() => handleRemoveQuestion(q.id)} />
                                </div>
                                <p className="text-sm text-gray-700 mb-2 line-clamp-2">{q.content}</p>
                                <div className="flex items-center justify-between">
                                  <Tag color={typeDict[q.type]?.color || 'gray'}>{typeDict[q.type]?.label || q.type}</Tag>
                                  <InputNumber
                                    value={q.score}
                                    onChange={(value) => handleScoreChange(q.id, value || 5)}
                                    min={1}
                                    max={50}
                                    className="w-20"
                                    suffix="分"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </Card>
                  </Col>
                </Row>
              ) : (
                <div className="space-y-4">
                  <Divider orientation="left" plain>分类题数（从系统字典动态获取）</Divider>
                  <Row gutter={16}>
                    {categoryOptions.map(cat => (
                      <Col span={6} key={cat.value}>
                        <FormItem label={`${cat.label}题数`}>
                          <InputNumber
                            value={smartConfig.categoryCounts[cat.value] || 0}
                            onChange={(value) => setSmartConfig({
                              ...smartConfig,
                              categoryCounts: { ...smartConfig.categoryCounts, [cat.value]: value || 0 },
                            })}
                            min={0}
                            max={100}
                            className="w-full"
                          />
                        </FormItem>
                      </Col>
                    ))}
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <FormItem label="难度比例（易:中:难）">
                        <Input
                          value={smartConfig.difficultyRatio}
                          onChange={(e) => setSmartConfig({ ...smartConfig, difficultyRatio: e.target.value })}
                          placeholder="如 5:3:2"
                        />
                      </FormItem>
                    </Col>
                  </Row>
                  <Divider orientation="left" plain>题型分配（数量 × 分值）</Divider>
                  <Row gutter={16}>
                    <Col span={6}>
                      <FormItem label="单选题">
                        <div className="flex items-center gap-2">
                          <InputNumber
                            value={smartConfig.singleCount}
                            onChange={(value) => setSmartConfig({ ...smartConfig, singleCount: value || 0 })}
                            min={0}
                            max={50}
                            className="flex-1"
                          />
                          <span className="text-gray-400">×</span>
                          <InputNumber
                            value={smartConfig.singleScore}
                            onChange={(value) => setSmartConfig({ ...smartConfig, singleScore: value || 1 })}
                            min={1}
                            max={20}
                            className="flex-1"
                            suffix="分"
                          />
                        </div>
                      </FormItem>
                    </Col>
                    <Col span={6}>
                      <FormItem label="多选题">
                        <div className="flex items-center gap-2">
                          <InputNumber
                            value={smartConfig.multipleCount}
                            onChange={(value) => setSmartConfig({ ...smartConfig, multipleCount: value || 0 })}
                            min={0}
                            max={50}
                            className="flex-1"
                          />
                          <span className="text-gray-400">×</span>
                          <InputNumber
                            value={smartConfig.multipleScore}
                            onChange={(value) => setSmartConfig({ ...smartConfig, multipleScore: value || 1 })}
                            min={1}
                            max={20}
                            className="flex-1"
                            suffix="分"
                          />
                        </div>
                      </FormItem>
                    </Col>
                    <Col span={6}>
                      <FormItem label="判断题">
                        <div className="flex items-center gap-2">
                          <InputNumber
                            value={smartConfig.judgeCount}
                            onChange={(value) => setSmartConfig({ ...smartConfig, judgeCount: value || 0 })}
                            min={0}
                            max={50}
                            className="flex-1"
                          />
                          <span className="text-gray-400">×</span>
                          <InputNumber
                            value={smartConfig.judgeScore}
                            onChange={(value) => setSmartConfig({ ...smartConfig, judgeScore: value || 1 })}
                            min={1}
                            max={20}
                            className="flex-1"
                            suffix="分"
                          />
                        </div>
                      </FormItem>
                    </Col>
                    <Col span={6}>
                      <FormItem label="案例题">
                        <div className="flex items-center gap-2">
                          <InputNumber
                            value={smartConfig.caseCount}
                            onChange={(value) => setSmartConfig({ ...smartConfig, caseCount: value || 0 })}
                            min={0}
                            max={20}
                            className="flex-1"
                          />
                          <span className="text-gray-400">×</span>
                          <InputNumber
                            value={smartConfig.caseScore}
                            onChange={(value) => setSmartConfig({ ...smartConfig, caseScore: value || 1 })}
                            min={1}
                            max={20}
                            className="flex-1"
                            suffix="分"
                          />
                        </div>
                      </FormItem>
                    </Col>
                  </Row>
                  <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">预计总题数</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {smartConfig.singleCount + smartConfig.multipleCount + smartConfig.judgeCount + smartConfig.caseCount} 题
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">预计总分</p>
                        <p className="text-2xl font-bold text-indigo-600">
                          {smartConfig.singleCount * smartConfig.singleScore + 
                           smartConfig.multipleCount * smartConfig.multipleScore + 
                           smartConfig.judgeCount * smartConfig.judgeScore + 
                           smartConfig.caseCount * smartConfig.caseScore} 分
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">及格线</p>
                        <p className="text-2xl font-bold text-green-600">{basicInfo.passScore} 分</p>
                      </div>
                    </div>
                  </Card>
                  <Button type="primary" icon={<ApiOutlined />} onClick={handleSmartGenerate} block size="large">
                    智能组卷
                  </Button>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <Card className="bg-white shadow-sm border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{basicInfo.title}</h3>
                    {basicInfo.description && (
                      <p className="text-gray-600 mt-2">{basicInfo.description}</p>
                    )}
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center px-4 py-2 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-600">总题数</p>
                      <p className="text-xl font-bold text-blue-700">{selectedQuestions.length}题</p>
                    </div>
                    <div className="text-center px-4 py-2 bg-indigo-50 rounded-lg">
                      <p className="text-xs text-indigo-600">总分</p>
                      <p className="text-xl font-bold text-indigo-700">{totalScore}分</p>
                    </div>
                    <div className="text-center px-4 py-2 bg-green-50 rounded-lg">
                      <p className="text-xs text-green-600">及格线</p>
                      <p className="text-xl font-bold text-green-700">{basicInfo.passScore}分</p>
                    </div>
                    <div className="text-center px-4 py-2 bg-orange-50 rounded-lg">
                      <p className="text-xs text-orange-600">时长</p>
                      <p className="text-xl font-bold text-orange-700">{basicInfo.duration}分钟</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card title="题目列表" className="shadow-sm border-gray-100">
                <div className="max-h-80 overflow-y-auto space-y-4">
                  {sortedTypeKeys.map(type => {
                    const questions = selectedQuestionsByType[type];
                    const typeTotal = questions.reduce((sum, q) => sum + q.score, 0);
                    return (
                      <div key={type}>
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                          <Tag color={typeDict[type]?.color || 'gray'} className="text-sm">
                            {typeDict[type]?.label || type}
                          </Tag>
                          <span className="text-sm text-gray-500">
                            共{questions.length}题，{typeTotal}分
                          </span>
                        </div>
                        <div className="space-y-2">
                          {questions.map((q, index) => (
                            <div key={q.id} className="p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <span className="font-medium text-blue-600 mr-2">{index + 1}.</span>
                                  <span className="text-gray-700">{q.content}</span>
                                </div>
                                <span className="text-sm font-bold text-indigo-600 ml-2">{q.score}分</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-6">
          <Button
            disabled={currentStep === 0}
            onClick={() => setCurrentStep(currentStep - 1)}
          >
            上一步
          </Button>
          {currentStep === 2 ? (
            <Button type="primary" onClick={handleSubmit}>
              保存试卷
            </Button>
          ) : (
            <Button
              type="primary"
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={currentStep === 0 && !basicInfo.title}
            >
              下一步
            </Button>
          )}
        </div>
      </Modal>

      <Modal
        title="发布考试"
        open={publishModalVisible}
        onCancel={() => {
          setPublishModalVisible(false);
          setSelectedPaper(null);
        }}
        onOk={handlePublishSubmit}
        okText="确认发布"
        cancelText="取消"
      >
        <p className="text-sm text-gray-600">
          确认发布试卷 {selectedPaper?.title ? `"${selectedPaper.title}"` : ''}？发布后考生即可参加考试。
        </p>
      </Modal>

      <Modal
        title="试卷预览"
        open={previewModalVisible}
        onCancel={() => {
          setPreviewModalVisible(false);
          setSelectedPaper(null);
        }}
        footer={null}
        width={600}
      >
        {selectedPaper && (
          <Card>
            <h3 className="text-lg font-bold mb-2">{selectedPaper.title}</h3>
            <p className="text-gray-500 mb-4">
              时长：{selectedPaper.duration ?? '-'}分钟 | 总分：{selectedPaper.totalScore}分 | 及格线：{selectedPaper.passScore}分
            </p>
            {selectedPaper.description && <p className="mb-4">{selectedPaper.description}</p>}
            <Divider />
            <div className="max-h-80 overflow-y-auto">
              {selectedPaper.questions.map((q, index) => (
                <div key={q.questionId} className="mb-4">
                  <p className="font-medium">
                    {index + 1}. {q.content}（{q.score}分）
                  </p>
                  <Tag color={typeDict[q.type]?.color || 'gray'}>{typeDict[q.type]?.label || q.type}</Tag>
                </div>
              ))}
            </div>
          </Card>
        )}
      </Modal>
    </div>
  );
}

function FormItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}