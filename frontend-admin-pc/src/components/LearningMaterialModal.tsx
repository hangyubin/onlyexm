import { Modal, Form, Input, Select, Switch, InputNumber, Upload, message, Progress } from 'antd';
import type { UploadProps } from 'antd';
import { PictureOutlined, FileTextOutlined, LoadingOutlined } from '@ant-design/icons';
import { LearningMaterial } from '../api/learningMaterial';
import { useEffect, useState } from 'react';
import api from '../api/axios';

const { Option } = Select;
const { TextArea } = Input;

interface LearningMaterialModalProps {
  open: boolean;
  editData: LearningMaterial | null;
  onCancel: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export default function LearningMaterialModal({ open, editData, onCancel, onSubmit }: LearningMaterialModalProps) {
  const [form] = Form.useForm();
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');
  const [thumbnailName, setThumbnailName] = useState<string>('');
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [thumbnailProgress, setThumbnailProgress] = useState(0);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [attachmentProgress, setAttachmentProgress] = useState(0);

  useEffect(() => {
    if (open) {
      if (editData) {
        form.setFieldsValue({
          ...editData,
        });
        setThumbnailUrl(editData.thumbnailUrl || '');
        setAttachmentUrl(editData.attachmentUrl || '');
        setThumbnailName(editData.thumbnailUrl ? '已上传缩略图' : '');
        setAttachmentName(editData.attachmentUrl ? '已上传附件' : '');
      } else {
        form.resetFields();
        form.setFieldsValue({
          type: 'ARTICLE',
          isActive: true,
          sortOrder: 0,
        });
        setThumbnailUrl('');
        setAttachmentUrl('');
        setThumbnailName('');
        setAttachmentName('');
        setThumbnailUploading(false);
        setThumbnailProgress(0);
        setAttachmentUploading(false);
        setAttachmentProgress(0);
      }
    }
  }, [open, editData, form]);

  const handleThumbnailUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    setThumbnailUploading(true);
    setThumbnailProgress(0);
    try {
      const rawFile = file as any;
      const actualFile = rawFile.originFileObj || rawFile;
      const formData = new FormData();
      formData.append('file', actualFile);

      const response = await api.post('/upload', formData, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setThumbnailProgress(percent);
          }
        },
      });
      // axios拦截器已解包，response.data = { url, filename }
      const url = response.data.url;
      const filename = response.data.filename;
      if (url) {
        form.setFieldsValue({ thumbnailUrl: url, thumbnailName: filename });
        setThumbnailUrl(url);
        setThumbnailName(filename || '缩略图');
        onSuccess?.(response.data);
        message.success('缩略图上传成功');
      } else {
        onError?.(new Error('上传失败'));
      }
    } catch (error: any) {
      onError?.(error);
      message.error(error?.response?.data?.message || '上传失败');
    } finally {
      setThumbnailUploading(false);
      setThumbnailProgress(0);
    }
  };

  const handleAttachmentUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    setAttachmentUploading(true);
    setAttachmentProgress(0);
    try {
      const rawFile = file as any;
      const actualFile = rawFile.originFileObj || rawFile;
      const formData = new FormData();
      formData.append('file', actualFile);

      const response = await api.post('/upload', formData, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setAttachmentProgress(percent);
          }
        },
      });
      // axios拦截器已解包，response.data = { url, filename }
      const url = response.data.url;
      const filename = response.data.filename;
      if (url) {
        form.setFieldsValue({ attachmentUrl: url, attachmentName: filename });
        setAttachmentUrl(url);
        setAttachmentName(filename || '附件');
        onSuccess?.(response.data);
        message.success('附件上传成功');
      } else {
        onError?.(new Error('上传失败'));
      }
    } catch (error: any) {
      onError?.(error);
      message.error(error?.response?.data?.message || '上传失败');
    } finally {
      setAttachmentUploading(false);
      setAttachmentProgress(0);
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Modal
      title={editData ? '编辑学习资料' : '新建学习资料'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      width={700}
      okText="保存"
      cancelText="取消"
      destroyOnHidden
    >
      <Form form={form} layout="vertical" initialValues={{ isActive: true, sortOrder: 0 }}>
        <Form.Item
          name="title"
          label="标题"
          rules={[{ required: true, message: '请输入标题' }]}
        >
          <Input placeholder="请输入标题" />
        </Form.Item>

        <Form.Item name="description" label="描述">
          <TextArea rows={3} placeholder="请输入描述" />
        </Form.Item>

        <Form.Item
          name="type"
          label="类型"
          rules={[{ required: true, message: '请选择类型' }]}
        >
          <Select placeholder="请选择类型">
            <Option value="ARTICLE">文章</Option>
            <Option value="VIDEO">视频</Option>
            <Option value="PDF">PDF</Option>
            <Option value="DOC">Word文档</Option>
            <Option value="EXCEL">Excel表格</Option>
            <Option value="PPT">PowerPoint</Option>
          </Select>
        </Form.Item>

        <Form.Item name="category" label="分类">
          <Input placeholder="请输入分类" />
        </Form.Item>

        <Form.Item
          name="content"
          label="内容"
          rules={[{ required: true, message: '请输入内容' }]}
        >
          <TextArea rows={8} placeholder="请输入内容" />
        </Form.Item>

        <Form.Item name="thumbnailUrl" label="缩略图">
          <div>
            <Upload
              accept="image/*"
              customRequest={handleThumbnailUpload}
              fileList={thumbnailUrl ? [{
                uid: '-1',
                name: thumbnailName || '缩略图',
                status: 'done' as const,
                url: thumbnailUrl
              }] : []}
              showUploadList={{ showPreviewIcon: true, showRemoveIcon: true }}
              onRemove={() => {
                setThumbnailUrl('');
                form.setFieldsValue({ thumbnailUrl: '' });
              }}
              disabled={thumbnailUploading}
            >
              <button type="button" className="ant-btn ant-btn-default ant-btn-block" disabled={thumbnailUploading}>
                {thumbnailUploading ? <LoadingOutlined className="mr-2" /> : <PictureOutlined className="mr-2" />}
                {thumbnailUploading ? '上传中...' : '上传缩略图'}
              </button>
            </Upload>
            {thumbnailUploading && (
              <Progress percent={thumbnailProgress} status="active" size="small" className="mt-2" />
            )}
            {thumbnailUrl && !thumbnailUploading && (
              <p className="mt-2 text-sm text-gray-500">
                当前: {thumbnailName || thumbnailUrl}
              </p>
            )}
          </div>
        </Form.Item>

        <Form.Item name="attachmentUrl" label="附件">
          <div>
            <Upload
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp4,.webm,.ogg"
              customRequest={handleAttachmentUpload}
              fileList={attachmentUrl ? [{
                uid: '-1',
                name: attachmentName || '附件',
                status: 'done' as const,
                url: attachmentUrl
              }] : []}
              showUploadList={{ showPreviewIcon: false, showRemoveIcon: true }}
              onRemove={() => {
                setAttachmentUrl('');
                form.setFieldsValue({ attachmentUrl: '' });
              }}
              disabled={attachmentUploading}
            >
              <button type="button" className="ant-btn ant-btn-default ant-btn-block" disabled={attachmentUploading}>
                {attachmentUploading ? <LoadingOutlined className="mr-2" /> : <FileTextOutlined className="mr-2" />}
                {attachmentUploading ? '上传中...' : '上传附件'}
              </button>
            </Upload>
            {attachmentUploading && (
              <Progress percent={attachmentProgress} status="active" size="small" className="mt-2" />
            )}
            <p className="mt-2 text-sm text-gray-500">
              支持格式: PDF, Word, Excel, PowerPoint, 视频
            </p>
            {attachmentUrl && !attachmentUploading && (
              <p className="mt-1 text-sm text-gray-500">
                当前: {attachmentName || attachmentUrl}
              </p>
            )}
          </div>
        </Form.Item>

        <Form.Item name="sortOrder" label="排序">
          <InputNumber min={0} style={{ width: '100%' }} placeholder="数字越小越靠前" />
        </Form.Item>

        <Form.Item name="isActive" label="启用" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}
