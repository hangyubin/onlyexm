import { useState, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, Row, Col, Table, Tag, Button, Select, Input, message, Spin, Switch, Modal, Space, Descriptions, Progress, Popconfirm } from 'antd';
import { ClockCircleOutlined, WarningOutlined, CheckCircleOutlined, SearchOutlined, EyeOutlined, PrinterOutlined } from '@ant-design/icons';
import { examApi, ExamRecordItem, ExamStats } from '../../api/exam';
import { paperApi } from '../../api/paper';

export default function ExamMonitor() {
  const [stats, setStats] = useState<ExamStats | null>(null);
  const [records, setRecords] = useState<ExamRecordItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [paperId, setPaperId] = useState<number | undefined>();
  const [keyword, setKeyword] = useState('');
  const [papers, setPapers] = useState<{ id: number; name: string }[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailRecord, setDetailRecord] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [page, paperId, keyword]);

  useEffect(() => {
    fetchPapers();
  }, []);

  // 自动刷新：每10秒刷新统计数据和列表
  useEffect(() => {
    if (autoRefresh) {
      timerRef.current = setInterval(() => {
        fetchStats();
        fetchRecords();
      }, 10000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoRefresh, page, paperId, keyword]);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const data = await examApi.getStats();
      setStats(data);
    } catch {
      message.error('获取考试统计失败');
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await examApi.getRecords({
        page,
        pageSize,
        paperId,
        keyword: keyword || undefined,
      });
      setRecords(data.items);
      setTotal(data.total);
    } catch {
      message.error('获取考试记录失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchPapers = async () => {
    try {
      const data = await paperApi.getList({ pageSize: 100 });
      setPapers(data.data.map((p) => ({ id: p.id, name: p.title })));
    } catch {
      // ignore
    }
  };

  const handleForceSubmit = async (recordId: number) => {
    try {
      await examApi.forceSubmit(recordId);
      message.success('已强制交卷');
      fetchRecords();
      fetchStats();
    } catch {
      message.error('强制交卷失败');
    }
  };

  const handleSearch = () => {
    if (page === 1) {
      fetchRecords();
    } else {
      setPage(1);
    }
  };

  const handleViewDetail = async (record: ExamRecordItem) => {
    setDetailVisible(true);
    setDetailLoading(true);
    try {
      const data = await examApi.getRecordDetail(record.id);
      setDetailRecord(data);
    } catch {
      message.error('获取考试详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  const handlePrint = async (record: ExamRecordItem) => {
    try {
      await examApi.printRecord(record.id, record.paperName, record.userName);
    } catch {
      message.error('打印试卷失败');
    }
  };

  const columns = [
    { title: '考生', dataIndex: 'userName', key: 'userName' },
    { title: '试卷', dataIndex: 'paperName', key: 'paperName' },
    { title: '状态', dataIndex: 'statusLabel', key: 'statusLabel', render: (label: string, record: ExamRecordItem) => (
      <Tag color={record.status === 'IN_PROGRESS' ? 'blue' : record.status === 'SUBMITTED' ? 'green' : record.status === 'FORCE_SUBMIT' ? 'red' : 'orange'}>
        {label}
      </Tag>
    )},
    { title: '用时', dataIndex: 'time', key: 'time' },
    { title: '切屏次数', dataIndex: 'tabSwitchCount', key: 'tabSwitchCount', render: (count: number) => (
      <span className={count > 3 ? 'text-red-500 font-medium' : 'text-gray-600'}>{count}</span>
    )},
    { title: 'IP地址', dataIndex: 'clientIp', key: 'clientIp', render: (ip: string) => (
      <span className="text-gray-500 text-xs">{ip || '-'}</span>
    )},
    { title: '操作', key: 'actions', render: (_: unknown, record: ExamRecordItem) => (
      <Space size="small">
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
        {record.status !== 'IN_PROGRESS' && (
          <Button size="small" icon={<PrinterOutlined />} onClick={() => handlePrint(record)}>打印</Button>
        )}
        {record.status === 'IN_PROGRESS' && (
          <Popconfirm
            title="确认强制交卷？"
            description="此操作不可撤销，考生的答卷将被强制提交。"
            onConfirm={() => handleForceSubmit(record.id)}
            okText="确认"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger>强制交卷</Button>
          </Popconfirm>
        )}
      </Space>
    )},
  ];

  const realtimeOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category' as const, data: stats?.trend.labels || [] },
    yAxis: { type: 'value' as const },
    series: [{
      name: '在线考试人数',
      type: 'line' as const,
      smooth: true,
      data: stats?.trend.data || [],
      lineStyle: { color: '#3b82f6', width: 3 },
      areaStyle: { color: 'rgba(59, 130, 246, 0.1)' },
    }],
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">考试监控</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">自动刷新</span>
          <Switch size="small" checked={autoRefresh} onChange={setAutoRefresh} />
          {autoRefresh && <span className="text-xs text-gray-400">每10秒</span>}
        </div>
      </div>

      <Spin spinning={statsLoading}>
        <Row gutter={16} className="mb-6">
          <Col span={8}>
            <Card className="bg-blue-50 border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <ClockCircleOutlined className="text-blue-500 text-xl" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{stats?.inProgressCount ?? '-'}</p>
                  <p className="text-sm text-blue-600/70">正在考试人数</p>
                </div>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card className="bg-green-50 border-green-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircleOutlined className="text-green-500 text-xl" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats?.todayCompletedCount ?? '-'}</p>
                  <p className="text-sm text-green-600/70">今日完成考试</p>
                </div>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card className="bg-orange-50 border-orange-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <WarningOutlined className="text-orange-500 text-xl" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">{stats?.abnormalSwitchCount ?? '-'}</p>
                  <p className="text-sm text-orange-600/70">异常切屏预警</p>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </Spin>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="实时考试人数趋势">
            <ReactECharts option={realtimeOption} style={{ height: 250 }} notMerge={true} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="考试监控列表" extra={
            <div className="flex gap-2">
              <Select
                placeholder="筛选试卷"
                allowClear
                style={{ width: 160 }}
                value={paperId}
                onChange={(val) => { setPaperId(val); setPage(1); }}
                options={papers.map((p) => ({ value: p.id, label: p.name }))}
              />
              <Input.Search
                placeholder="搜索考生"
                allowClear
                style={{ width: 140 }}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onSearch={handleSearch}
                enterButton={<SearchOutlined />}
              />
            </div>
          }>
            <Table
              columns={columns}
              dataSource={records}
              rowKey="id"
              loading={loading}
              pagination={{
                current: page,
                pageSize,
                total,
                onChange: (p) => setPage(p),
                showTotal: (t) => `共 ${t} 条`,
                size: 'small',
              }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="考试详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={
          detailRecord && detailRecord.status !== 'IN_PROGRESS' ? (
            <Button icon={<PrinterOutlined />} onClick={() => {
              handlePrint({ id: detailRecord.id, paperName: detailRecord.paperName, userName: detailRecord.userName } as ExamRecordItem);
            }}>
              打印试卷
            </Button>
          ) : null
        }
        width={700}
      >
        <Spin spinning={detailLoading}>
          {detailRecord && (
            <>
              <Descriptions bordered size="small" column={2} className="mb-4">
                <Descriptions.Item label="考生">{detailRecord.userName}</Descriptions.Item>
                <Descriptions.Item label="科室">{detailRecord.department}</Descriptions.Item>
                <Descriptions.Item label="试卷">{detailRecord.paperName}</Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={detailRecord.status === 'IN_PROGRESS' ? 'blue' : 'green'}>
                    {detailRecord.status === 'IN_PROGRESS' ? '进行中' : '已结束'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="得分">{detailRecord.score ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="切屏次数">
                  <span className={(detailRecord.tabSwitchCount || 0) > 3 ? 'text-red-500 font-medium' : ''}>
                    {detailRecord.tabSwitchCount || 0}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="IP地址">{detailRecord.clientIp || '-'}</Descriptions.Item>
                <Descriptions.Item label="可疑行为">
                  {(detailRecord.suspiciousLog?.length || 0) > 0 ? (
                    <Tag color="orange">{detailRecord.suspiciousLog.length} 条记录</Tag>
                  ) : (
                    <Tag color="green">无异常</Tag>
                  )}
                </Descriptions.Item>
              </Descriptions>

              {detailRecord.answerProgress && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">答题进度</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <Progress
                      percent={detailRecord.answerProgress.percent}
                      size="small"
                      style={{ width: 200 }}
                    />
                    <span className="text-sm text-gray-500">
                      {detailRecord.answerProgress.answered}/{detailRecord.answerProgress.total} 题
                    </span>
                  </div>
                </div>
              )}

              {detailRecord.suspiciousLog?.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">可疑行为记录</h4>
                  <Table
                    size="small"
                    pagination={false}
                    dataSource={detailRecord.suspiciousLog}
                    rowKey={(_, i) => String(i)}
                    columns={[
                      { title: '题目ID', dataIndex: 'questionId', key: 'questionId', width: 80 },
                      { title: '停留时间', dataIndex: 'timeSpent', key: 'timeSpent', render: (v: number) => `${v}ms` },
                      { title: '时间', dataIndex: 'timestamp', key: 'timestamp', render: (v: string) => new Date(v).toLocaleString('zh-CN') },
                    ]}
                  />
                </div>
              )}

              {detailRecord.currentAnswers?.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">已答题目</h4>
                  <Table
                    size="small"
                    pagination={false}
                    dataSource={detailRecord.currentAnswers}
                    rowKey="questionId"
                    columns={[
                      { title: '题号', dataIndex: 'questionIndex', key: 'questionIndex', width: 60, render: (i: number) => `${i}.` },
                      { title: '题目', dataIndex: 'content', key: 'content', ellipsis: true },
                      { title: '用户答案', dataIndex: 'userAnswer', key: 'userAnswer', width: 120 },
                    ]}
                  />
                </div>
              )}
            </>
          )}
        </Spin>
      </Modal>
    </div>
  );
}
