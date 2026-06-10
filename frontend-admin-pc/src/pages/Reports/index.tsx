import { Card, Button, Table, DatePicker, Select, Tag, message, Spin } from 'antd';
import { FileExcelOutlined, DownloadOutlined, FilterOutlined } from '@ant-design/icons';
import { useState } from 'react';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Dayjs } from 'dayjs';
import { reportApi, ExamSummaryItem, PracticeRecordItem, InfectionComplianceItem, UserStudyItem } from '../../api/report';

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function Reports() {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [reportType, setReportType] = useState('exam');
  const [loading, setLoading] = useState(false);

  const [examData, setExamData] = useState<ExamSummaryItem[]>([]);
  const [examSummary, setExamSummary] = useState({ passCount: 0, failCount: 0, passRate: 0, averageScore: 0 });
  const [practiceData, setPracticeData] = useState<PracticeRecordItem[]>([]);
  const [infectionData, setInfectionData] = useState<InfectionComplianceItem[]>([]);
  const [userStudyData, setUserStudyData] = useState<UserStudyItem[]>([]);

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
        const res = await reportApi.getInfectionCompliance({ startDate, endDate });
        setInfectionData(res);
      } else if (reportType === 'user') {
        const res = await reportApi.getUserStudy({ startDate, endDate });
        setUserStudyData(res);
      }
    } catch (error) {
      message.error('获取报表数据失败');
    } finally {
      setLoading(false);
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
      default: return examColumns;
    }
  };

  const getDataSource = () => {
    switch (reportType) {
      case 'exam': return examData;
      case 'practice': return practiceData;
      case 'infection': return infectionData;
      case 'user': return userStudyData;
      default: return examData;
    }
  };

  const handleExport = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('报表');

    const columns = getColumns();
    const data = getDataSource();

    worksheet.columns = columns.map((col: any) => ({
      header: col.title,
      key: col.dataIndex,
      width: 15,
    }));

    data.forEach((item: any) => {
      worksheet.addRow(item);
    });

    worksheet.getRow(1).font = { bold: true };

    const reportNames: Record<string, string> = {
      exam: '考试成绩报表',
      practice: '练习记录报表',
      infection: '院感达标报表',
      user: '用户学习报表',
    };

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${reportNames[reportType] || '报表'}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-800">报表导出</h2>
        <Button type="primary" icon={<FileExcelOutlined />} onClick={handleExport}>
          导出Excel
        </Button>
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <FilterOutlined className="text-slate-500" />
            <span className="text-sm text-slate-600">报表类型:</span>
            <Select value={reportType} onChange={setReportType} style={{ width: 150 }}>
              <Option value="exam">考试成绩报表</Option>
              <Option value="practice">练习记录报表</Option>
              <Option value="infection">院感达标报表</Option>
              <Option value="user">用户学习报表</Option>
            </Select>
          </div>
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              if (dates) {
                setDateRange(dates as [Dayjs, Dayjs]);
              } else {
                setDateRange(null);
              }
            }}
            placeholder={['开始日期', '结束日期']}
          />
          <Button icon={<DownloadOutlined />} onClick={fetchReport} loading={loading}>查询</Button>
        </div>

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
      </Card>
    </div>
  );
}
