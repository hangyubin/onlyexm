import { Card, Button, Table, DatePicker, Select, Tag, message, Spin, Descriptions } from 'antd';
import { FileExcelOutlined, DownloadOutlined, FilterOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { Dayjs } from 'dayjs';
import { reportApi, ExamSummaryItem, PracticeRecordItem, InfectionComplianceItem, UserStudyItem } from '../../api/report';

const { RangePicker } = DatePicker;
const { Option } = Select;

type ReportType = 'exam' | 'practice' | 'infection' | 'user' | 'dept-ranking' | 'error-rate' | 'unqualified' | 'activity';

const reportTypes: { value: ReportType; label: string; needsDate: boolean; hasPreview: boolean }[] = [
  { value: 'exam', label: '考试成绩汇总', needsDate: true, hasPreview: true },
  { value: 'practice', label: '练习记录', needsDate: true, hasPreview: true },
  { value: 'infection', label: '院感达标情况', needsDate: false, hasPreview: true },
  { value: 'user', label: '用户学习情况', needsDate: false, hasPreview: true },
  { value: 'dept-ranking', label: '科室排名', needsDate: true, hasPreview: false },
  { value: 'error-rate', label: '题目错误率分析', needsDate: false, hasPreview: false },
  { value: 'unqualified', label: '院感未达标人员', needsDate: false, hasPreview: false },
  { value: 'activity', label: '学习活跃度统计', needsDate: true, hasPreview: false },
];

export default function Reports() {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [reportType, setReportType] = useState<ReportType>('exam');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [examData, setExamData] = useState<ExamSummaryItem[]>([]);
  const [examSummary, setExamSummary] = useState({ passCount: 0, failCount: 0, passRate: 0, averageScore: 0 });
  const [practiceData, setPracticeData] = useState<PracticeRecordItem[]>([]);
  const [infectionData, setInfectionData] = useState<InfectionComplianceItem[]>([]);
  const [userStudyData, setUserStudyData] = useState<UserStudyItem[]>([]);

  const currentType = reportTypes.find(t => t.value === reportType)!;

  const fetchReport = async () => {
    setLoading(true);
    try {
      const startDate = dateRange?.[0]?.format('YYYY-MM-DD');
      const endDate = dateRange?.[1]?.format('YYYY-MM-DD');

      if (reportType === 'exam') {
        const res = await reportApi.getExamSummary({ startDate, endDate });
        setExamData(res.items);
        setExamSummary({ passCount: res.passCount, failCount: res.failCount, passRate: res.passRate, averageScore: res.averageScore });
      } else if (reportType === 'practice') {
        const res = await reportApi.getPracticeRecords({ startDate, endDate });
        setPracticeData(res);
      } else if (reportType === 'infection') {
        const res = await reportApi.getInfectionCompliance({});
        setInfectionData(res);
      } else if (reportType === 'user') {
        const res = await reportApi.getUserStudy({});
        setUserStudyData(res);
      }
    } catch (error) {
      message.error('获取报表数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const startDate = dateRange?.[0]?.format('YYYY-MM-DD');
      const endDate = dateRange?.[1]?.format('YYYY-MM-DD');

      switch (reportType) {
        case 'exam':
          await reportApi.downloadExamSummary(startDate || '', endDate || '');
          break;
        case 'practice':
          // 练习记录没有独立导出，复用 exam-summary
          await reportApi.downloadExamSummary(startDate || '', endDate || '');
          break;
        case 'infection':
          await reportApi.downloadUnqualifiedStaff();
          break;
        case 'user':
          await reportApi.downloadExamSummary(startDate || '', endDate || '');
          break;
        case 'dept-ranking':
          await reportApi.downloadDeptRanking(startDate || '', endDate || '');
          break;
        case 'error-rate':
          await reportApi.downloadQuestionErrorRate();
          break;
        case 'unqualified':
          await reportApi.downloadUnqualifiedStaff();
          break;
        case 'activity':
          await reportApi.downloadActivity(startDate || '', endDate || '');
          break;
      }
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败，请稍后重试');
    } finally {
      setExporting(false);
    }
  };

  const examColumns = [
    { title: '序号', dataIndex: 'id', key: 'id' },
    { title: '用户姓名', dataIndex: 'realName', key: 'realName' },
    { title: '科室', dataIndex: 'department', key: 'department' },
    { title: '考试名称', dataIndex: 'examName', key: 'examName' },
    { title: '得分', dataIndex: 'score', key: 'score', render: (score: number, record: ExamSummaryItem) => (
      <Tag color={score >= record.totalScore * 0.6 ? 'green' : 'red'}>{score}分</Tag>
    )},
    { title: '状态', dataIndex: 'status', key: 'status', render: (status: string) => (
      <Tag color={status === 'PASS' ? 'green' : 'orange'}>
        {status === 'PASS' ? '通过' : '未通过'}
      </Tag>
    )},
    { title: '考试时间', dataIndex: 'examTime', key: 'examTime' },
  ];

  const practiceColumns = [
    { title: '序号', dataIndex: 'id', key: 'id' },
    { title: '用户姓名', dataIndex: 'realName', key: 'realName' },
    { title: '科室', dataIndex: 'department', key: 'department' },
    { title: '练习名称', dataIndex: 'practiceName', key: 'practiceName' },
    { title: '得分', dataIndex: 'score', key: 'score' },
    { title: '总分', dataIndex: 'totalScore', key: 'totalScore' },
    { title: '练习时间', dataIndex: 'practiceTime', key: 'practiceTime' },
    { title: '用时(分钟)', dataIndex: 'duration', key: 'duration' },
  ];

  const infectionColumns = [
    { title: '序号', dataIndex: 'id', key: 'id' },
    { title: '用户姓名', dataIndex: 'realName', key: 'realName' },
    { title: '科室', dataIndex: 'department', key: 'department' },
    { title: '要求类型', dataIndex: 'requirementType', key: 'requirementType' },
    { title: '是否达标', dataIndex: 'isCompliant', key: 'isCompliant', render: (v: boolean) => (
      <Tag color={v ? 'green' : 'red'}>{v ? '达标' : '未达标'}</Tag>
    )},
    { title: '最近考试', dataIndex: 'lastExamDate', key: 'lastExamDate' },
    { title: '下次考试', dataIndex: 'nextExamDate', key: 'nextExamDate' },
    { title: '成绩', dataIndex: 'score', key: 'score' },
  ];

  const userStudyColumns = [
    { title: '序号', dataIndex: 'id', key: 'id' },
    { title: '用户姓名', dataIndex: 'realName', key: 'realName' },
    { title: '科室', dataIndex: 'department', key: 'department' },
    { title: '学习时长(分钟)', dataIndex: 'totalStudyMinutes', key: 'totalStudyMinutes' },
    { title: '练习次数', dataIndex: 'practiceCount', key: 'practiceCount' },
    { title: '错题数量', dataIndex: 'wrongQuestionCount', key: 'wrongQuestionCount' },
    { title: '达标进度', dataIndex: 'complianceProgress', key: 'complianceProgress', render: (v: number) => `${v}%` },
  ];

  const getColumns = () => {
    switch (reportType) {
      case 'exam': return examColumns;
      case 'practice': return practiceColumns;
      case 'infection': return infectionColumns;
      case 'user': return userStudyColumns;
      default: return [];
    }
  };

  const getDataSource = () => {
    switch (reportType) {
      case 'exam': return examData;
      case 'practice': return practiceData;
      case 'infection': return infectionData;
      case 'user': return userStudyData;
      default: return [];
    }
  };

  const exportOnlyDescriptions: Record<string, { title: string; desc: string }> = {
    'dept-ranking': { title: '科室排名', desc: '按科室统计参考人数、平均分、及格率和院感平均分，按平均分降序排列' },
    'error-rate': { title: '题目错误率分析', desc: '统计近30天各题目的错误率和错误人数，按错误率降序排列' },
    'unqualified': { title: '院感未达标人员', desc: '列出本月院感练习量不足或正确率低于70%的人员，并给出补训建议' },
    'activity': { title: '学习活跃度统计', desc: '按日统计活跃人数、完成练习/考试人数、平均学习时长' },
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-800">报表导出</h2>
        <Button type="primary" icon={<FileExcelOutlined />} onClick={handleExport} loading={exporting}>
          导出Excel
        </Button>
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <FilterOutlined className="text-slate-500" />
            <span className="text-sm text-slate-600">报表类型:</span>
            <Select value={reportType} onChange={(v) => { setReportType(v); setDateRange(null); }} style={{ width: 160 }}>
              {reportTypes.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
            </Select>
          </div>
          {currentType.needsDate && (
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates ? (dates as [Dayjs, Dayjs]) : null)}
              placeholder={['开始日期', '结束日期']}
            />
          )}
          {currentType.hasPreview && (
            <Button icon={<DownloadOutlined />} onClick={fetchReport} loading={loading}>查询</Button>
          )}
        </div>

        {currentType.hasPreview ? (
          <>
            {reportType === 'exam' && examData.length > 0 && (
              <div className="flex items-center gap-4 mb-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Tag color="green">通过</Tag>
                  <span className="text-sm">{examSummary.passCount}人</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag color="red">未通过</Tag>
                  <span className="text-sm">{examSummary.failCount}人</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">通过率:</span>
                  <span className="text-sm text-green-600">{examSummary.passRate}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">平均分:</span>
                  <span className="text-sm text-blue-600">{examSummary.averageScore}分</span>
                </div>
              </div>
            )}
            <Spin spinning={loading}>
              <Table columns={getColumns() as any} dataSource={getDataSource() as any} rowKey="id" />
            </Spin>
          </>
        ) : (
          <Descriptions bordered column={1} size="small">
            {exportOnlyDescriptions[reportType] && (
              <Descriptions.Item label={exportOnlyDescriptions[reportType].title}>
                <span className="text-gray-500">{exportOnlyDescriptions[reportType].desc}</span>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="操作">
              <span className="text-gray-500">选择日期范围后，点击右上角「导出Excel」按钮即可下载</span>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>
    </div>
  );
}
