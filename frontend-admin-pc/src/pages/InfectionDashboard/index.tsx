import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Row, Col, Statistic, Tag, Button, Table, Modal, Checkbox, message, Space, Switch } from 'antd';
import { CheckboxChangeEvent } from 'antd/es/checkbox';
import { ArrowUpOutlined, ArrowDownOutlined, WarningOutlined, FileTextOutlined, DownloadOutlined, SendOutlined, RestOutlined } from '@ant-design/icons';
import * as echarts from 'echarts';
import { infectionApi, KPIData, DeptRanking, WeakPoint, TrendData, UnqualifiedStaff } from '../../api/infection';

export default function InfectionDashboard() {
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [deptRanking, setDeptRanking] = useState<DeptRanking[]>([]);
  const [weakPoints, setWeakPoints] = useState<WeakPoint[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [unqualifiedStaff, setUnqualifiedStaff] = useState<UnqualifiedStaff[]>([]);
  const [totalStaff, setTotalStaff] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<number[]>([]);
  const [notifyModalVisible, setNotifyModalVisible] = useState(false);
  const [staffPage, setStaffPage] = useState(1);
  const [staffPageSize, setStaffPageSize] = useState(10);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const deptChartRef = useRef<HTMLDivElement>(null);
  const weakPointsChartRef = useRef<HTMLDivElement>(null);
  const trendChartRef = useRef<HTMLDivElement>(null);

  const deptChartInstance = useRef<echarts.ECharts | null>(null);
  const weakPointsChartInstance = useRef<echarts.ECharts | null>(null);
  const trendChartInstance = useRef<echarts.ECharts | null>(null);

  const fetchStaff = useCallback(async (page: number, pageSize: number) => {
    try {
      const result = await infectionApi.getUnqualifiedStaff(page, pageSize);
      setUnqualifiedStaff(result.data);
      setTotalStaff(result.total);
    } catch (error) {
      console.error('获取未达标人员失败:', error);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        infectionApi.getKPI(),
        infectionApi.getDeptRanking(),
        infectionApi.getWeakPoints(),
        infectionApi.getTrend(6),
      ]);
      if (results[0].status === 'fulfilled') setKpiData(results[0].value);
      if (results[1].status === 'fulfilled') setDeptRanking(results[1].value);
      if (results[2].status === 'fulfilled') setWeakPoints(results[2].value);
      if (results[3].status === 'fulfilled') setTrendData(results[3].value);
      await fetchStaff(staffPage, staffPageSize);
    } catch (error) {
      console.error('获取数据失败:', error);
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  }, [fetchStaff, staffPage, staffPageSize]);

  useEffect(() => {
    fetchAllData();
    let interval: ReturnType<typeof setInterval> | undefined;
    if (autoRefresh) {
      interval = setInterval(fetchAllData, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchAllData, autoRefresh]);

  useEffect(() => {
    if (deptChartRef.current && !deptChartInstance.current) {
      deptChartInstance.current = echarts.init(deptChartRef.current);
    }
    updateDeptChart();
    // 不 dispose/recreate，只 setOption 更新
  }, [deptRanking]);

  useEffect(() => {
    if (weakPointsChartRef.current && !weakPointsChartInstance.current) {
      weakPointsChartInstance.current = echarts.init(weakPointsChartRef.current);
    }
    updateWeakPointsChart();
  }, [weakPoints]);

  useEffect(() => {
    if (trendChartRef.current && !trendChartInstance.current) {
      trendChartInstance.current = echarts.init(trendChartRef.current);
    }
    updateTrendChart();
  }, [trendData]);

  useEffect(() => {
    const handleResize = () => {
      deptChartInstance.current?.resize();
      weakPointsChartInstance.current?.resize();
      trendChartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      deptChartInstance.current?.dispose();
      weakPointsChartInstance.current?.dispose();
      trendChartInstance.current?.dispose();
      deptChartInstance.current = null;
      weakPointsChartInstance.current = null;
      trendChartInstance.current = null;
    };
  }, []);
  const updateDeptChart = () => {
    if (!deptChartInstance.current || (deptRanking || []).length === 0) return;
    
    const data = deptRanking || [];
    deptChartInstance.current.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const dataItem = params[0];
          return `${dataItem.name}<br/>正确率: <strong>${dataItem.value}%</strong>`;
        },
      },
      grid: {
        left: '10%',
        right: '8%',
        top: '10%',
        bottom: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: {
          formatter: '{value}%',
          color: '#666',
          fontSize: 12,
        },
        splitLine: {
          lineStyle: {
            color: '#e8e8e8',
            type: 'dashed',
          },
        },
      },
      yAxis: {
        type: 'category',
        data: data.map(item => item?.department || ''),
        axisLabel: {
          color: '#333',
          fontSize: 13,
        },
        axisTick: {
          show: false,
        },
      },
      series: [
        {
          type: 'bar',
          data: data.map(item => ({
            value: item?.correctRate || 0,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: '#1890ff' },
                { offset: 1, color: '#91cc75' },
              ]),
              borderRadius: [0, 4, 4, 0],
            },
          })),
          barWidth: '60%',
          label: {
            show: true,
            position: 'right',
            formatter: '{c}%',
            color: '#666',
            fontSize: 12,
          },
        },
      ],
    });
  };

  const updateWeakPointsChart = () => {
    if (!weakPointsChartInstance.current || (weakPoints || []).length === 0) return;
    
    const data = weakPoints || [];
    weakPointsChartInstance.current.setOption({
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          return `${params.name}<br/>错误数: ${params.value}<br/>正确率: ${params.data.rate}%`;
        },
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        textStyle: {
          fontSize: 12,
          color: '#666',
        },
      },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 18,
              fontWeight: 'bold',
              formatter: '{b}\n{c}次',
            },
          },
          labelLine: {
            show: false,
          },
          data: data.map((item, index) => ({
            value: item?.count || 0,
            name: item?.name || '',
            rate: item?.rate || 0,
            itemStyle: {
              color: [
                '#f5222d',
                '#fa541c',
                '#faad14',
                '#a0d911',
                '#52c41a',
                '#13c2c2',
                '#1890ff',
                '#722ed1',
              ][index % 8],
            },
          })),
        },
      ],
    });
  };

  const updateTrendChart = () => {
    if (!trendChartInstance.current || (trendData || []).length === 0) return;
    
    const data = trendData || [];
    trendChartInstance.current.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', label: { backgroundColor: '#6a7985' } },
        formatter: (params: any) => {
          let result = `${params[0]?.axisValue || ''}<br/>`;
          (params || []).forEach((param: any) => {
            const unit = param?.seriesName === '平均分' ? '分' : '人';
            result += `${param?.marker || ''}${param?.seriesName || ''}: ${param?.value || 0}${unit}<br/>`;
          });
          return result;
        },
      },
      legend: {
        data: ['平均分', '参与人数'],
        top: '5%',
        textStyle: { fontSize: 12, color: '#666' },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '8%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.map(item => item?.month || ''),
        axisLabel: { color: '#666', fontSize: 12 },
        axisLine: { lineStyle: { color: '#e8e8e8' } },
      },
      yAxis: [
        {
          type: 'value',
          name: '平均分',
          min: 0,
          max: 100,
          interval: 20,
          axisLabel: {
            formatter: '{value}',
            color: '#666',
            fontSize: 12,
          },
          splitLine: { lineStyle: { color: '#e8e8e8', type: 'dashed' } },
        },
        {
          type: 'value',
          name: '参与人数',
          min: 0,
          axisLabel: {
            formatter: '{value}',
            color: '#666',
            fontSize: 12,
          },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '平均分',
          type: 'line',
          smooth: true,
          data: data.map(item => item?.avgScore || 0),
          lineStyle: { color: '#1890ff', width: 3 },
          itemStyle: { color: '#1890ff' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.05)' },
            ]),
          },
        },
        {
          name: '参与人数',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          data: data.map(item => item?.participantCount || 0),
          lineStyle: { color: '#52c41a', width: 3 },
          itemStyle: { color: '#52c41a' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(82, 196, 26, 0.3)' },
              { offset: 1, color: 'rgba(82, 196, 26, 0.05)' },
            ]),
          },
        },
      ],
    });
  };

  const handleSelectAll = (e: CheckboxChangeEvent) => {
    const checked = e.target.checked;
    if (checked) {
      setSelectedStaff(unqualifiedStaff.map(s => s.id));
    } else {
      setSelectedStaff([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedStaff([...selectedStaff, id]);
    } else {
      setSelectedStaff(selectedStaff.filter(s => s !== id));
    }
  };

  const handleBatchNotify = () => {
    if (selectedStaff.length === 0) {
      message.warning('请选择要发送通知的人员');
      return;
    }
    setNotifyModalVisible(true);
  };

  const confirmNotify = async () => {
    try {
      await infectionApi.batchNotify(selectedStaff);
      message.success('通知发送成功');
      setNotifyModalVisible(false);
      setSelectedStaff([]);
      fetchAllData();
    } catch (error) {
      message.error('发送失败');
    }
  };

  const handleExportExcel = () => {
    const headers = ['姓名', '科室', '本月练习数', '正确率', '锁定状态', '薄弱知识点'];
    const data = unqualifiedStaff.map(staff => [
      staff.name,
      staff.department,
      staff.practiceCount,
      `${staff.correctRate}%`,
      staff.isLocked ? '是' : '否',
      staff.weakPoints.join('; '),
    ]);

    const csvContent = [headers, ...data].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `未达标人员_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.csv`;
    link.click();
  };

  const handleGenerateReport = async () => {
    try {
      const response = await infectionApi.generateReport();
      const blob = new Blob([response], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `院感报告_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.pdf`;
      link.click();
      message.success('报告生成成功');
    } catch (error) {
      message.error('生成报告失败');
    }
  };

  const handleRefresh = () => {
    fetchAllData();
    message.info('数据已刷新');
  };

  const columns = [
    {
      title: (
        <Checkbox
          checked={selectedStaff.length === unqualifiedStaff.length && unqualifiedStaff.length > 0}
          indeterminate={selectedStaff.length > 0 && selectedStaff.length < unqualifiedStaff.length}
          onChange={handleSelectAll}
        />
      ),
      key: 'selection',
      width: 60,
      render: (_: unknown, record: UnqualifiedStaff) => (
        <Checkbox
          checked={selectedStaff.includes(record.id)}
          onChange={(e) => handleSelectOne(record.id, e.target.checked)}
        />
      ),
    },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '科室', dataIndex: 'department', key: 'department' },
    { title: '本月练习数', dataIndex: 'practiceCount', key: 'practiceCount' },
    {
      title: '正确率',
      dataIndex: 'correctRate',
      key: 'correctRate',
      render: (rate: number) => (
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${rate < 60 ? 'bg-red-500' : rate < 80 ? 'bg-orange-500' : 'bg-green-500'}`}
              style={{ width: `${rate}%` }}
            />
          </div>
          <span>{rate}%</span>
        </div>
      ),
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
      title: '薄弱知识点',
      dataIndex: 'weakPoints',
      key: 'weakPoints',
      render: (points: string[] | undefined) => (
        <Space wrap>
          {(points || []).map((point, idx) => (
            <Tag key={idx} color="orange">{point}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: UnqualifiedStaff) => (
        <Button icon={<SendOutlined />} size="small" onClick={() => {
          setSelectedStaff([record.id]);
          setNotifyModalVisible(true);
        }}>
          发送通知
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">院感管理看板</h2>
        <div className="flex gap-3">
          <Button icon={<RestOutlined />} onClick={handleRefresh} loading={loading}>
            刷新数据
          </Button>
        </div>
      </div>

      <Row gutter={24} className="mb-6">
        <Col span={6}>
          <Card className="h-full">
            <Statistic
              title="本月院感考试平均分"
              value={kpiData?.monthlyAvgScore || 0}
              precision={1}
              valueStyle={{ fontSize: 32, fontWeight: 'bold', color: '#1890ff' }}
              suffix={
                kpiData && (
                  <span className={`flex items-center text-sm ml-2 ${kpiData.monthlyAvgScoreChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {kpiData.monthlyAvgScoreChange >= 0 ? <ArrowUpOutlined className="mr-1" /> : <ArrowDownOutlined className="mr-1" />}
                    {kpiData.monthlyAvgScoreChange >= 0 ? '+' : ''}{kpiData.monthlyAvgScoreChange}
                  </span>
                )
              }
            />
            <p className="text-xs text-gray-400 mt-2">环比变化</p>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="h-full">
            <Statistic
              title="院感达标率"
              value={kpiData?.complianceRate || 0}
              precision={1}
              valueStyle={{ fontSize: 32, fontWeight: 'bold', color: '#52c41a' }}
              suffix="%"
            />
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>达标进度</span>
                <span>{kpiData?.complianceRate}%</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
                  style={{ width: `${kpiData?.complianceRate || 0}%` }}
                />
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="h-full">
            <Statistic
              title="被锁定人数"
              value={kpiData?.lockedCount || 0}
              valueStyle={{ fontSize: 32, fontWeight: 'bold', color: '#f5222d' }}
              prefix={<WarningOutlined style={{ color: '#f5222d' }} />}
              suffix={
                <span className="text-sm text-gray-500 ml-2">
                  占比 {kpiData?.lockedRate}%
                </span>
              }
            />
            <p className="text-xs text-gray-400 mt-2">连续3次未达标</p>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="h-full">
            <Statistic
              title="本月练习总量"
              value={kpiData?.monthlyPracticeCount || 0}
              valueStyle={{ fontSize: 32, fontWeight: 'bold', color: '#722ed1' }}
              prefix={<FileTextOutlined style={{ color: '#722ed1' }} />}
              suffix={
                kpiData && (
                  <span className={`flex items-center text-sm ml-2 ${kpiData.monthlyPracticeChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {kpiData.monthlyPracticeChange >= 0 ? <ArrowUpOutlined className="mr-1" /> : <ArrowDownOutlined className="mr-1" />}
                    {kpiData.monthlyPracticeChange >= 0 ? '+' : ''}{kpiData.monthlyPracticeChange}%
                  </span>
                )
              }
            />
            <p className="text-xs text-gray-400 mt-2">同比变化</p>
          </Card>
        </Col>
      </Row>

      <Row gutter={24} className="mb-6">
        <Col span={12}>
          <Card title="各科室院感正确率排名" className="h-full">
            <div ref={deptChartRef} style={{ width: '100%', height: 400 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="院感薄弱知识点分布" className="h-full">
            <div ref={weakPointsChartRef} style={{ width: '100%', height: 400 }} />
            <p className="text-xs text-gray-400 text-center mt-2">点击饼图可查看子分类</p>
          </Card>
        </Col>
      </Row>

      <Row gutter={24} className="mb-6">
        <Col span={24}>
          <Card title="近6个月院感成绩趋势">
            <div ref={trendChartRef} style={{ width: '100%', height: 350 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={24}>
          <Card
            title="未达标人员名单"
            extra={
              <Space>
                <span style={{ fontSize: 13, color: '#64748b' }}>自动刷新</span>
                <Switch checked={autoRefresh} onChange={setAutoRefresh} size="small" />
                <Button icon={<SendOutlined />} onClick={handleBatchNotify} disabled={selectedStaff.length === 0}>
                  批量发送通知 ({selectedStaff.length})
                </Button>
                <Button icon={<DownloadOutlined />} onClick={handleExportExcel}>
                  导出 Excel
                </Button>
              </Space>
            }
          >
            <Table
              dataSource={unqualifiedStaff}
              columns={columns}
              rowKey="id"
              pagination={{
                current: staffPage,
                total: totalStaff,
                pageSize: staffPageSize,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
                onChange: (page, pageSize) => {
                  setStaffPage(page);
                  setStaffPageSize(pageSize);
                  fetchStaff(page, pageSize);
                },
              }}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      <Button
        type="primary"
        icon={<DownloadOutlined />}
        onClick={handleGenerateReport}
        className="fixed right-6 bottom-6 shadow-lg"
        size="large"
      >
        生成院感报告
      </Button>

      <Modal
        title="发送补训通知"
        open={notifyModalVisible}
        onCancel={() => setNotifyModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setNotifyModalVisible(false)}>取消</Button>,
          <Button key="submit" type="primary" onClick={confirmNotify}>确认发送</Button>,
        ]}
      >
        <p>将向 {selectedStaff.length} 名未达标人员发送补训通知，确认发送？</p>
        <p className="text-sm text-gray-500 mt-2">通知将包含薄弱知识点分析和学习建议</p>
      </Modal>
    </div>
  );
}