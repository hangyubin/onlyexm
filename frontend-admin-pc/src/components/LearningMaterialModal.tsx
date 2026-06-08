import { Modal, Form, Input, Select, Switch, InputNumber, Upload, message } from 'antd';
import type { UploadProps } from 'antd';
import { PictureOutlined, FileTextOutlined } from '@ant-design/icons';
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

  useEffect(() => {
    if (open) {
      if (editData) {
        form.setFieldsValue({
          ...editData,
        });
        setThumbnailUrl(editData.thumbnailUrl || '');
        setAttachmentUrl(editData.attachmentUrl || '');
      } else {
        form.resetFields();
        form.setFieldsValue({
          type: 'ARTICLE',
          isActive: true,
          sortOrder: 0,
        });
        setThumbnailUrl('');
        setAttachmentUrl('');
      }
    }
  }, [open, editData, form]);

  const handleThumbnailUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    try {
      const rawFile = file as any;
      const actualFile = rawFile.originFileObj || rawFile;
      const formData = new FormData();
      formData.append('file', actualFile);

      const response = await api.post('/upload', formData);
      if (response.data.success) {
        const url = response.data.data.url;
        form.setFieldsValue({ thumbnailUrl: url });
        setThumbnailUrl(url);
        onSuccess?.(response.data);
        message.success('缩略图上传成功');
      } else {
        onError?.(new Error(response.data.message || '上传失败'));
      }
    } catch (error: any) {
      onError?.(error);
      message.error(error?.response?.data?.message || '上传失败');
    }
  };

  const handleAttachmentUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    try {
      const rawFile = file as any;
      const actualFile = rawFile.originFileObj || rawFile;
      const formData = new FormData();
      formData.append('file', actualFile);

      const response = await api.post('/upload', formData);
      if (response.data.success) {
        const url = response.data.data.url;
        form.setFieldsValue({ attachmentUrl: url });
        setAttachmentUrl(url);
        onSuccess?.(response.data);
        message.success('附件上传成功');
      } else {
        onError?.(new Error(response.data.message || '上传失败'));
      }
    } catch (error: any) {
      onError?.(error);
      message.error(error?.response?.data?.message || '上传失败');
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
                name: '缩略图',
                status: 'done' as const,
                url: thumbnailUrl
              }] : []}
              showUploadList={{ showPreviewIcon: true, showRemoveIcon: true }}
              onRemove={() => {
                setThumbnailUrl('');
                form.setFieldsValue({ thumbnailUrl: '' });
              }}
            >
              <button type="button" className="ant-btn ant-btn-default ant-btn-block">
                <PictureOutlined className="mr-2" />
                上传缩略图
              </button>
            </Upload>
            {thumbnailUrl && (
              <p className="mt-2 text-sm text-gray-500">
                当前: {thumbnailUrl}
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
                name: '附件',
                status: 'done' as const,
                url: attachmentUrl
              }] : []}
              showUploadList={{ showPreviewIcon: false, showRemoveIcon: true }}
              onRemove={() => {
                setAttachmentUrl('');
                form.setFieldsValue({ attachmentUrl: '' });
              }}
            >
              <button type="button" className="ant-btn ant-btn-default ant-btn-block">
                <FileTextOutlined className="mr-2" />
                上传附件
              </button>
            </Upload>
            <p className="mt-2 text-sm text-gray-500">
              支持格式: PDF, Word, Excel, PowerPoint, 视频
            </p>
            {attachmentUrl && (
              <p className="mt-1 text-sm text-gray-500">
                当前: {attachmentUrl}
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
