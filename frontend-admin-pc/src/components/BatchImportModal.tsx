import { useState } from 'react';
import { Modal, Upload, Button, Progress, Alert, Space } from 'antd';
import { UploadOutlined, DownloadOutlined, CopyOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import copy from 'copy-to-clipboard';
import { questionApi } from '../api/question';
import { saveAs } from 'file-saver';

interface BatchImportModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function BatchImportModal({ open, onCancel, onSuccess }: BatchImportModalProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ success: number; failed: number; failedDetails: string[] } | null>(null);

  const handleDownloadTemplate = async () => {
    try {
      const response = await questionApi.downloadTemplate();
      saveAs(response, 'question_template.xlsx');
    } catch (error) {
      console.error('下载模板失败:', error);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setProgress(0);
    setResult(null);

    try {
      const response = await questionApi.batchImport(file, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(Math.min(percent, 99)); // 保留1%给服务端处理
        }
      });
      
      setProgress(100);
      setResult(response);
    } catch (error) {
      console.error('批量导入失败:', error);
      setProgress(0);
      setResult({ success: 0, failed: 1, failedDetails: ['导入失败，请检查文件格式'] });
    } finally {
      setUploading(false);
    }
  };

  const props = {
    name: 'file',
    accept: '.xlsx,.xls',
    beforeUpload: (file: File) => {
      handleUpload(file);
      return false;
    },
    showUploadList: false,
    disabled: uploading,
  };

  return (
    <Modal
      title="批量导入题目"
      open={open}
      onCancel={() => {
        onCancel();
        setResult(null);
        setProgress(0);
      }}
      footer={null}
      width={500}
    >
      {!result ? (
        <div>
          <Alert
            message="院感标签必填提醒"
            description="分类为「院感知识」的题目，必须在「二级分类/院感标签」列填写院感标签（手卫生、医疗废物、消毒隔离、职业暴露、隔离防护、无菌操作、多重耐药菌、空气质量），否则导入失败！"
            type="warning"
            showIcon
            className="mb-4"
          />
          <div className="mb-4">
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleDownloadTemplate}
              className="w-full mb-4"
            >
              下载导入模板
            </Button>
            <p className="text-sm text-gray-500 text-center">
              请先下载模板，按照模板格式填写题目后再上传
            </p>
          </div>

          <Upload {...props}>
            <Button
              icon={<UploadOutlined />}
              disabled={uploading}
              className="w-full"
            >
              {uploading ? '上传中...' : '上传Excel文件'}
            </Button>
          </Upload>

          {uploading && (
            <div className="mt-4">
              <Progress percent={Math.round(progress)} status={progress === 100 ? 'success' : 'active'} />
            </div>
          )}

          <p className="text-sm text-gray-400 mt-4 text-center">
            支持 .xlsx、.xls 格式文件
          </p>
        </div>
      ) : (
        <div>
          <Alert
            icon={result.success > 0 ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
            message={`导入完成：成功 ${result.success} 条，失败 ${result.failed} 条`}
            type={result.failed > 0 ? 'warning' : 'success'}
            className="mb-4"
          />

          {result.failedDetails && result.failedDetails.length > 0 && (
            <div className="border rounded p-4 bg-gray-50">
              <p className="font-medium mb-2">失败详情：</p>
              <div className="max-h-40 overflow-y-auto">
                {result.failedDetails.map((detail, index) => (
                  <p key={index} className="text-sm text-red-500 mb-1">
                    {detail}
                  </p>
                ))}
              </div>
              <div className="mt-2 flex justify-end">
                <Button
                  type="text"
                  icon={<CopyOutlined />}
                  size="small"
                  onClick={() => copy(result.failedDetails.join('\n'))}
                >
                  复制详情
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-4">
            <Space>
              <Button onClick={() => {
                onCancel();
                setResult(null);
                setProgress(0);
              }}>
                关闭
              </Button>
              {result.success > 0 && (
                <Button type="primary" onClick={() => {
                  onSuccess();
                  onCancel();
                  setResult(null);
                  setProgress(0);
                }}>
                  确定
                </Button>
              )}
            </Space>
          </div>
        </div>
      )}
    </Modal>
  );
}
