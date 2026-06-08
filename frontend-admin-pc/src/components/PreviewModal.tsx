import { Modal, Card, Tag, Row, Col, Empty } from 'antd';
import { QuestionCircleOutlined, FileTextOutlined, BookOutlined } from '@ant-design/icons';
const BookOpenOutlined = BookOutlined;
import { Question } from '../api/question';
import { useMultiDictData } from '../hooks/useDictData';

interface PreviewModalProps {
  open: boolean;
  onCancel: () => void;
  data: Question | null;
}

const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export default function PreviewModal({ open, onCancel, data }: PreviewModalProps) {
  const { data: dictData } = useMultiDictData(['QUESTION_TYPE', 'QUESTION_CATEGORY', 'INFECTION_TAG']);
  const typeDict = dictData?.QUESTION_TYPE?.dictMap || {};
  const categoryDict = dictData?.QUESTION_CATEGORY?.dictMap || {};
  const tagDict = dictData?.INFECTION_TAG?.dictMap || {};

  if (!data) {
    return (
      <Modal
        title="题目预览"
        open={open}
        onCancel={onCancel}
        footer={null}
        width={600}
      >
        <Empty description="暂无题目数据" />
      </Modal>
    );
  }

  return (
    <Modal
      title="题目预览"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      <Card>
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <QuestionCircleOutlined className="text-blue-500" />
            <Tag color={typeDict[data.type]?.color || 'gray'}>
              {typeDict[data.type]?.label || data.type}
            </Tag>
            <Tag color="gray">{categoryDict[data.category || data.sanjiCategory || '']?.label || data.category || data.sanjiCategory || '未分类'}</Tag>
            {data.infectionTag && (
              <Tag color={tagDict[data.infectionTag]?.color || 'gray'}>
                {tagDict[data.infectionTag]?.label || data.infectionTag}
              </Tag>
            )}
            {data.infectionTags?.map((tag) => (
              <Tag key={tag} color={tagDict[tag]?.color || 'gray'}>
                {tagDict[tag]?.label || tag}
              </Tag>
            ))}
            <span className="ml-auto">
              {'⭐'.repeat(data.difficulty || 1)}
              {data.difficulty === 1 && <span className="text-sm text-gray-500 ml-1">基础</span>}
              {data.difficulty === 2 && <span className="text-sm text-gray-500 ml-1">进阶</span>}
            </span>
          </div>
          
          <p className="text-lg font-medium text-gray-800">{data.content || ''}</p>
        </div>

        <div className="mb-4">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <FileTextOutlined className="text-gray-400" />
            选项
          </h4>
          <div className="space-y-2">
            {data.options?.map((option, index) => (
              <div
                key={option.optionKey || option.key || index}
                className={`p-3 rounded-lg border ${
                  data.correctAnswer?.includes(option.optionKey || option.key || '')
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-100 bg-gray-50'
                }`}
              >
                <Row align="middle">
                  <Col span={2} className="font-bold text-gray-600">
                    {optionLetters[index]}
                  </Col>
                  <Col span={20}>{option.content}</Col>
                  <Col span={2} className="text-right">
                    {data.correctAnswer?.includes(option.optionKey || option.key || '') && (
                      <Tag color="green">正确</Tag>
                    )}
                  </Col>
                </Row>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <BookOpenOutlined className="text-gray-400" />
            正确答案
          </h4>
          <Tag color="green" className="text-lg px-4 py-2">
            {data.correctAnswer?.join('、') || ''}
          </Tag>
        </div>

        {data.analysis && (
          <div>
            <h4 className="font-medium mb-2">解析</h4>
            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
              {data.analysis}
            </p>
          </div>
        )}

        {data.source && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">规范出处</h4>
            <p className="text-gray-500 text-sm">{data.source}</p>
          </div>
        )}
      </Card>
    </Modal>
  );
}