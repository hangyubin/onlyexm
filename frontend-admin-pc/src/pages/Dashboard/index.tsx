import { Card, Row, Col, Statistic, Table, Tag, Spin, message } from 'antd';
import { UserOutlined, BookOutlined, FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined, EditOutlined, ReadOutlined } from '@ant-design/icons';
import * as echarts from 'echarts';
import { useEffect, useRef, useState, useCallback } from 'react';
import api from '../../api/axios';

interface DashboardStats {
  totalUsers: number;
  totalQuestions: number;
  totalPapers: number;
  totalExams: number;
  complianceRate: number;
  activeUsers: number;
}

interface RecentExam {
  id: number;
  name: string;
  participants: number;
  passRate: string;
  status: string;
  deadline: string;
}

interface RecentActivity {
  user: string;
  action: string;
  target: string;
  time: string;
  score: number | null;
  type: 'exam' | 'practice' | 'learning';
}

interface ProgressItem {
  label: string;
  value: number;
  count: number;
  total: number;
  color: string;
}

interface WeeklyStat {
  day: string;
  learningUsers: number;
  examCount: number;
  practiceCount: number;
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}小时前`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}天前`;
  return date.toLocaleDateString('zh-CN');
}

export default function Dashboard() {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [examData, setExamData] = useState<RecentExam[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [progressItems, setProgressItems] = useState<ProgressItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        api.get<DashboardStats>('/dashboard/stats'),
        api.get<RecentExam[]>('/dashboard/recent-exams'),
        api.get<RecentActivity[]>('/dashboard/recent-activities'),
        api.get<ProgressItem[]>('/dashboard/progress'),
        api.get<WeeklyStat[]>('/dashboard/weekly-stats'),
      ]);

      if (results[0].status === 'fulfilled') setStats(results[0].value.data);
      if (results[1].status === 'fulfilled') setExamData(results[1].value.data);
      if (results[2].status === 'fulfilled') setRecentActivities(results[2].value.data);
      if (results[3].status === 'fulfilled') setProgressItems(results[3].value.data);

      if (chartRef.current) {
        if (!chartInstanceRef.current) {
          chartInstanceRef.current = echarts.init(chartRef.current);
        }
        const weeklyRes = results[4];
        if (weeklyRes.status === 'fulfilled' && weeklyRes.value.data.length > 0) {
          chartInstanceRef.current.setOption({
            title: { text: '本周学习数据', left: 'center', textStyle: { fontSize: 14 } },
            tooltip: { trigger: 'axis' },
            legend: { data: ['学习人数', '考试次数', '练习次数'], top: 30 },
            grid: { left: '3%', right: '4%', bottom: '3%', top: 60, containLabel: true },
            xAxis: { type: 'category', data: weeklyRes.value.data.map((d: WeeklyStat) => d.day) },
            yAxis: { type: 'value' },
            series: [
              { name: '学习人数', type: 'bar', data: weeklyRes.value.data.map((d: WeeklyStat) => d.learningUsers) },
              { name: '考试次数', type: 'bar', data: weeklyRes.value.data.map((d: WeeklyStat) => d.examCount) },
              { name: '练习次数', type: 'line', data: weeklyRes.value.data.map((d: WeeklyStat) => d.practiceCount) },
            ],
          });
        }
      }
    } catch (error) {
      console.error('获取仪表盘数据失败:', error);
      message.error('获取仪表盘数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    const handleResize = () => {
      chartInstanceRef.current?.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstanceRef.current?.dispose();
      chartInstanceRef.current = null;
    };
  }, []);

  const statsConfig = [
    { title: '总用户数', key: 'totalUsers' as const, icon: UserOutlined, color: '#1890ff' },
    { title: '题目总数', key: 'totalQuestions' as const, icon: BookOutlined, color: '#722ed1' },
    { title: '试卷总数', key: 'totalPapers' as const, icon: FileTextOutlined, color: '#13c2c2' },
    { title: '达标率', key: 'complianceRate' as const, icon: CheckCircleOutlined, color: '#52c41a', suffix: '%' },
  ];

  const examColumns = [
    { title: '考试名称', dataIndex: 'name', key: 'name', ellipsis: true },
    { title: '参与人数', dataIndex: 'participants', key: 'participants', width: 100 },
    { title: '通过率', dataIndex: 'passRate', key: 'passRate', width: 80, render: (rate: string) => (
      <Tag color={(parseInt(rate) || 0) >= 80 ? 'green' : 'orange'}>{rate}</Tag>
    )},
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (status: string) => {
      const colorMap: Record<string, string> = { '进行中': 'blue', '未开始': 'orange', '已结束': 'gray' };
      return <Tag color={colorMap[status] || 'gray'}>{status}</Tag>;
    }},
    { title: '截止时间', dataIndex: 'deadline', key: 'deadline', width: 100 },
  ];

  return (
    <div style={{ padding: '0 4px' }}>
      <h2 className="text-xl font-bold text-slate-800 mb-4">仪表盘</h2>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {statsConfig.map((stat) => (
            <Col xs={24} sm={12} lg={6} key={stat.key}>
              <Card hoverable>
                <Statistic
                  title={stat.title}
                  value={stats ? (stat.suffix ? stats[stat.key] : stats[stat.key]) : '-'}
                  valueStyle={{ color: stat.color, fontWeight: 'bold' }}
                  prefix={<stat.icon style={{ color: stat.color, fontSize: 20 }} />}
                  suffix={stat.suffix || undefined}
                />
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={14}>
            <Card title="学习数据统计" style={{ height: '100%' }}>
              <div ref={chartRef} style={{ width: '100%', height: 300 }} />
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card title="进行中的考试" style={{ height: '100%', overflow: 'hidden' }}>
              <Table
                columns={examColumns}
                dataSource={examData}
                rowKey="id"
                pagination={false}
                size="small"
                scroll={{ y: 240 }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="学习进度">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {progressItems.map((item) => (
                  <div key={item.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 14, color: '#475569' }}>{item.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>
                        {item.count}/{item.total}人 <span style={{ color: item.color }}>{item.value}%</span>
                      </span>
                    </div>
                    <div style={{ width: '100%', height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        background: item.value === 0 ? '#e2e8f0' : item.color,
                        borderRadius: 4,
                        width: `${Math.max(item.value, 2)}%`,
                        minWidth: item.value > 0 ? 8 : 0,
                        transition: 'width 0.3s'
                      }} />
                    </div>
                  </div>
                ))}
                {progressItems.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: 24 }}>暂无数据</div>
                )}
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="最近动态">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recentActivities.map((activity, idx) => {
                  const typeConfig: Record<string, { icon: React.ReactNode; bg: string; color: string; targetColor: string }> = {
                    exam: { icon: <FileTextOutlined />, bg: '#eff6ff', color: '#3b82f6', targetColor: '#1890ff' },
                    practice: { icon: <EditOutlined />, bg: '#f0fdf4', color: '#22c55e', targetColor: '#52c41a' },
                    learning: { icon: <ReadOutlined />, bg: '#faf5ff', color: '#a855f7', targetColor: '#722ed1' },
                  };
                  const cfg = typeConfig[activity.type] || typeConfig.exam;
                  return (
                    <div
                      key={`${activity.user}-${activity.time}-${idx}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: 8,
                        borderRadius: 8,
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{
                        width: 32,
                        height: 32,
                        background: cfg.bg,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {cfg.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 14 }}>
                          <span style={{ fontWeight: 500 }}>{activity.user}</span>
                          <span style={{ color: '#64748b', margin: '0 4px' }}>{activity.action}</span>
                          <span style={{ color: cfg.targetColor }}>{activity.target}</span>
                          {activity.score != null && (
                            <span style={{ marginLeft: 8, color: '#52c41a' }}>({activity.score}分)</span>
                          )}
                        </p>
                        <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <ClockCircleOutlined />
                          {formatTimeAgo(activity.time)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
}
