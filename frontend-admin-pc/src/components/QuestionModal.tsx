import { useEffect } from 'react';
import { Modal, Form, Input, Radio, Slider, Button, Row, Col, Select } from 'antd';
import { PlusOutlined, MinusCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Question, QuestionOption } from '../api/question';
import { useMultiDictData } from '../hooks/useDictData';

const { Option } = Select;

interface QuestionModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (data: Omit<Question, 'id' | 'createdAt'>) => void;
  editData?: Question | null;
}

const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

// 需要选项的题型
const CHOICE_TYPES = ['SINGLE', 'MULTIPLE', 'JUDGE'];
// 需要文本答案的题型
const TEXT_ANSWER_TYPES = ['FILL', 'SHORT_ANSWER'];
// 病例分析题
const CASE_TYPE = 'CASE';

export default function QuestionModal({ open, onCancel, onSubmit, editData }: QuestionModalProps) {
  const [form] = Form.useForm();

  const { data: dictData } = useMultiDictData(['QUESTION_TYPE', 'QUESTION_CATEGORY', 'INFECTION_TAG']);
  const typeOptions = dictData?.QUESTION_TYPE?.options || [];
  const categoryOptions = dictData?.QUESTION_CATEGORY?.options || [];
  const tagOptions = dictData?.INFECTION_TAG?.options || [];

  useEffect(() => {
    if (open && editData) {
      form.setFieldsValue({
        content: editData.content,
        type: editData.type,
        category: editData.category || editData.sanjiCategory || '',
        infectionTag: editData.infectionTag || editData.subCategory || undefined,
        difficulty: editData.difficulty,
        analysis: editData.analysis,
        source: editData.source || editData.standardSource || '',
        correctAnswer: editData.correctAnswer || '',
        options: (editData.options || []).map((opt, index) => ({
          ...opt,
          key: opt.key || opt.optionKey || optionLetters[index] || `opt-${index}`,
        })),
      });
    } else if (open && !editData) {
      form.resetFields();
      form.setFieldsValue({
        type: typeOptions.length > 0 ? typeOptions[0].value : 'SINGLE',
        difficulty: 1,
        options: [
          { key: 'A', content: '', isCorrect: false },
          { key: 'B', content: '', isCorrect: false },
        ],
      });
    }
  }, [open, editData, form, typeOptions]);

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const questionType = values.type;
      let questionData: any = {
        content: values.content,
        type: questionType,
        category: values.category,
        infectionTag: values.infectionTag || undefined,
        difficulty: values.difficulty,
        analysis: values.analysis,
        standardSource: values.source || undefined,
      };

      if (CHOICE_TYPES.includes(questionType)) {
        // 选择题：从选项中提取正确答案
        const correctOptions = (values.options || []).filter((opt: QuestionOption) => opt.isCorrect);
        if (correctCount(values.options) === 0) {
          form.setFields([{ name: 'options', errors: ['请至少选择一个正确答案'] }]);
          return;
        }
        questionData.correctAnswer = correctOptions.map((opt: QuestionOption) => opt.key);
        questionData.options = values.options;
      } else if (TEXT_ANSWER_TYPES.includes(questionType)) {
        // 填空题/简答题：文本答案
        questionData.correctAnswer = values.correctAnswer || '';
        questionData.options = [];
      } else if (questionType === CASE_TYPE) {
        // 病例分析题：参考答案
        questionData.correctAnswer = values.correctAnswer || '';
        questionData.options = [];
      }

      onSubmit(questionData);
    });
  };

  function correctCount(options?: QuestionOption[]): number {
    return (options || []).filter(o => o.isCorrect).length;
  }

  return (
    <Modal
      title={editData ? '编辑题目' : '新建题目'}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      width={800}
      okText="保存"
    >
      <Form form={form} layout="vertical" initialValues={{ type: 'SINGLE', difficulty: 1 }}>
        <Form.Item
          name="content"
          label="题目内容"
          rules={[{ required: true, message: '请输入题目内容' }]}
        >
          <Input.TextArea rows={4} placeholder="请输入题目内容" />
        </Form.Item>

        <Form.Item
          name="type"
          label="题型"
          rules={[{ required: true, message: '请选择题型' }]}
        >
          <Radio.Group options={typeOptions.length > 0 ? typeOptions : [{ label: '单选题', value: 'SINGLE' }]} />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="category"
              label="分类"
              rules={[{ required: true, message: '请选择分类' }]}
            >
              <Select placeholder="请选择分类" allowClear onChange={() => form.setFieldsValue({ infectionTag: undefined })}>
                {categoryOptions.map(opt => (
                  <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="infectionTag"
              label="院感标签"
            >
              <Select placeholder="请选择院感标签（可选）" allowClear>
                {tagOptions.map(opt => (
                  <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="difficulty"
          label="难度"
          rules={[{ required: true, message: '请选择难度' }]}
        >
          <Slider
            min={1}
            max={5}
            marks={{ 1: '基础', 2: '较易', 3: '中等', 4: '较难', 5: '困难' }}
            step={null}
            tooltip={{ formatter: (value) => {
              const labels: Record<number, string> = { 1: '基础', 2: '较易', 3: '中等', 4: '较难', 5: '困难' };
              return labels[value || 1] || '';
            }}}
          />
        </Form.Item>

        {/* 选择题选项管理 */}
        <Form.Item shouldUpdate={(prev, curr) => prev.type !== curr.type}>
          {() => {
            const currentType = form.getFieldValue('type');
            if (!CHOICE_TYPES.includes(currentType)) return null;

            return (
              <Form.Item label="选项管理" required>
                <Form.List name="options">
                  {(fields, { add, remove }) => (
                    <div>
                      {fields.map((field, index) => (
                        <Row key={field.key} gutter={16} className="mb-3">
                          <Col span={4}>
                            <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg border">
                              <span className="text-xl font-bold text-gray-600">
                                {optionLetters[index]}
                              </span>
                            </div>
                          </Col>
                          <Col span={14}>
                            <Form.Item
                              key={field.key}
                              name={[field.name, 'content']}
                              rules={[{ required: true, message: '请输入选项内容' }]}
                            >
                              <Input placeholder={`选项 ${optionLetters[index]} 内容`} />
                            </Form.Item>
                          </Col>
                          <Col span={4}>
                            <Form.Item
                              key={field.key}
                              name={[field.name, 'isCorrect']}
                              valuePropName="checked"
                            >
                              <Radio.Group>
                                <Radio value={true}>正确</Radio>
                                <Radio value={false}>错误</Radio>
                              </Radio.Group>
                            </Form.Item>
                          </Col>
                          <Col span={2}>
                            {fields.length > 2 && (
                              <Button
                                type="text"
                                danger
                                onClick={() => remove(field.name)}
                                icon={<MinusCircleOutlined />}
                              />
                            )}
                          </Col>
                        </Row>
                      ))}
                      <Button
                        type="dashed"
                        onClick={() => add({ key: optionLetters[fields.length], content: '', isCorrect: false })}
                        icon={<PlusOutlined />}
                        disabled={fields.length >= 8}
                      >
                        添加选项
                      </Button>
                    </div>
                  )}
                </Form.List>
              </Form.Item>
            );
          }}
        </Form.Item>

        {/* 选择题正确答案校验提示 */}
        <Form.Item shouldUpdate={(prevValues, currentValues) => prevValues.options !== currentValues.options}>
          {() => {
            const options = form.getFieldValue('options');
            const type = form.getFieldValue('type');
            if (!CHOICE_TYPES.includes(type)) return null;

            const count = correctCount(options);
            if (count === 0) {
              return (
                <div className="flex items-center gap-2 text-orange-500 mb-4">
                  <InfoCircleOutlined />
                  <span>请至少选择一个正确答案</span>
                </div>
              );
            }
            if (type === 'SINGLE' && count > 1) {
              return (
                <div className="flex items-center gap-2 text-orange-500 mb-4">
                  <InfoCircleOutlined />
                  <span>单选题只能有一个正确答案</span>
                </div>
              );
            }
            return null;
          }}
        </Form.Item>

        {/* 填空题/简答题/病例分析题：参考答案 */}
        <Form.Item shouldUpdate={(prev, curr) => prev.type !== curr.type}>
          {() => {
            const currentType = form.getFieldValue('type');
            if (!TEXT_ANSWER_TYPES.includes(currentType) && currentType !== CASE_TYPE) return null;

            const isCase = currentType === CASE_TYPE;
            return (
              <Form.Item
                name="correctAnswer"
                label={isCase ? "参考答案/评分要点" : "参考答案"}
                rules={[{ required: true, message: '请输入参考答案' }]}
              >
                <Input.TextArea
                  rows={isCase ? 6 : 3}
                  placeholder={isCase ? "请输入参考答案或评分要点（可分点描述）" : "请输入参考答案"}
                />
              </Form.Item>
            );
          }}
        </Form.Item>

        <Form.Item
          name="analysis"
          label="解析"
        >
          <Input.TextArea rows={3} placeholder="请输入答案解析" />
        </Form.Item>

        <Form.Item
          name="source"
          label="规范出处"
        >
          <Input placeholder="请输入规范出处" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
