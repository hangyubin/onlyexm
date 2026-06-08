import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Eye,
  Calendar,
  FileText,
  Video,
  File,
  FileSpreadsheet,
  FileText as FileDoc,
  ExternalLink,
  AlertCircle,
  Download,
  X,
  Loader
} from 'lucide-react';
import { learningMaterialApi, LearningMaterial } from '../api/learningMaterial';
import mammoth from 'mammoth';

const typeIconMap = {
  ARTICLE: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-100' },
  VIDEO: { icon: Video, color: 'text-green-500', bg: 'bg-green-100' },
  PDF: { icon: File, color: 'text-orange-500', bg: 'bg-orange-100' },
  DOC: { icon: FileDoc, color: 'text-purple-500', bg: 'bg-purple-100' },
  EXCEL: { icon: FileSpreadsheet, color: 'text-cyan-500', bg: 'bg-cyan-100' },
  PPT: { icon: File, color: 'text-pink-500', bg: 'bg-pink-100' },
};

const normalizeUrl = (url: string | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
    return url;
  }
  if (url.startsWith('/')) return url;
  return '/' + url;
};

const getFileType = (url: string | undefined, type: string): 'docx' | 'pdf' | 'ppt' | 'video' | 'audio' | 'other' => {
  if (!url) return 'other';
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('.pdf') || type === 'PDF') return 'pdf';
  if (lowerUrl.includes('.ppt') || lowerUrl.includes('.pptx') || type === 'PPT') return 'ppt';
  if (lowerUrl.includes('.mp4') || lowerUrl.includes('.webm') || lowerUrl.includes('.ogg') || lowerUrl.includes('.mov') || type === 'VIDEO') return 'video';
  if (lowerUrl.includes('.mp3') || lowerUrl.includes('.wav')) return 'audio';
  if (lowerUrl.includes('.docx') || lowerUrl.includes('.doc') || type === 'DOC') return 'docx';
  return 'other';
};

const LearningMaterialDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [material, setMaterial] = useState<LearningMaterial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewType, setPreviewType] = useState<'docx' | 'pdf' | 'ppt' | 'video' | 'audio'>('docx');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [docxContent, setDocxContent] = useState<string>('');

  useEffect(() => {
    if (id) {
      fetchMaterial(parseInt(id));
    }
  }, [id]);

  const fetchMaterial = async (materialId: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await learningMaterialApi.getById(materialId);
      if (response.success) {
        setMaterial(response.data);
      } else {
        setError('加载学习资料失败');
      }
    } catch (error) {
      console.error('Failed to fetch learning material:', error);
      setError('加载学习资料失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (type: 'docx' | 'pdf' | 'ppt' | 'video' | 'audio') => {
    if (!material?.attachmentUrl) return;
    setPreviewType(type);
    setShowPreview(true);
    setPreviewLoading(false);
    setPreviewError(null);
    setDocxContent('');

    if (type === 'docx') {
      loadDocx();
    }
  };

  const loadDocx = async () => {
    if (!material?.attachmentUrl) return;
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const url = normalizeUrl(material.attachmentUrl);
      const response = await fetch(url, { method: 'GET' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      if (!result.value || result.value.trim() === '') {
        throw new Error('文档内容为空');
      }
      setDocxContent(result.value);
    } catch (error: any) {
      console.error('DOCX 预览失败:', error);
      setPreviewError(
        error?.message?.includes('HTTP')
          ? `文档加载失败（${error.message}），请下载后查看`
          : '文档预览失败，请下载后查看'
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = () => {
    if (!material?.attachmentUrl) return;
    const url = normalizeUrl(material.attachmentUrl);
    const link = document.createElement('a');
    link.href = url;
    link.download = material.title + pathExtFromUrl(url);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pathExtFromUrl = (url: string): string => {
    const m = url.match(/\.[a-zA-Z0-9]+(\?|#|$)/);
    return m ? m[0].split('?')[0].split('#')[0] : '';
  };

  const safeAttachmentUrl = material ? normalizeUrl(material.attachmentUrl) : '';
  const fileType = getFileType(safeAttachmentUrl, material?.type || 'ARTICLE');
  const typeConfig = material ? (typeIconMap[material.type as keyof typeof typeIconMap] || typeIconMap.ARTICLE) : typeIconMap.ARTICLE;
  const Icon = typeConfig.icon;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">学习资料不存在</p>
          <button
            onClick={() => navigate('/learning')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            返回列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold truncate pr-4">
                {previewType === 'docx' ? 'Word 文档预览' :
                 previewType === 'pdf' ? 'PDF 文档预览' :
                 previewType === 'ppt' ? 'PowerPoint 预览' :
                 previewType === 'video' ? '视频播放' : '音频播放'}
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
                aria-label="关闭"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-gray-50">
              {previewType === 'docx' && (
                previewLoading ? (
                  <div className="flex items-center justify-center h-96">
                    <Loader className="w-8 h-8 animate-spin text-blue-500" />
                    <span className="ml-2 text-gray-500">正在加载文档...</span>
                  </div>
                ) : previewError ? (
                  <div className="text-center py-16 px-4">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-600 mb-6">{previewError}</p>
                    <button
                      onClick={handleDownload}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 inline-flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      下载文件查看
                    </button>
                  </div>
                ) : (
                  <div
                    className="bg-white p-6 sm:p-10 rounded-lg shadow mx-auto max-w-4xl my-4 prose prose-blue max-w-none"
                    style={{ lineHeight: '1.8' }}
                    dangerouslySetInnerHTML={{ __html: docxContent }}
                  />
                )
              )}

              {previewType === 'pdf' && safeAttachmentUrl && (
                <div className="w-full" style={{ height: '75vh' }}>
                  <iframe
                    src={`${safeAttachmentUrl}#toolbar=1&view=FitH`}
                    className="w-full h-full bg-white rounded"
                    title="PDF Preview"
                  />
                </div>
              )}

              {previewType === 'ppt' && safeAttachmentUrl && (
                <div className="p-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-sm text-blue-800">
                    <AlertCircle className="w-4 h-4 inline mr-2" />
                    PowerPoint 在线预览需要公网可访问的文档地址。如无法显示，请下载后查看。
                  </div>
                  <div style={{ height: '65vh' }}>
                    <iframe
                      src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(safeAttachmentUrl)}`}
                      className="w-full h-full bg-white rounded-lg shadow"
                      title="PPT Preview"
                    />
                  </div>
                </div>
              )}

              {previewType === 'video' && safeAttachmentUrl && (
                <div className="flex flex-col items-center py-6 px-4">
                  <video
                    key={safeAttachmentUrl}
                    controls
                    className="w-full max-w-3xl rounded-lg shadow-lg bg-black"
                  >
                    <source src={safeAttachmentUrl} />
                    您的浏览器不支持视频播放，请下载后查看。
                  </video>
                </div>
              )}

              {previewType === 'audio' && safeAttachmentUrl && (
                <div className="flex flex-col items-center justify-center py-16 bg-white mx-4 my-4 rounded-lg shadow">
                  <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                    <FileText className="w-12 h-12 text-blue-500" />
                  </div>
                  <audio
                    key={safeAttachmentUrl}
                    controls
                    className="w-full max-w-md"
                  >
                    <source src={safeAttachmentUrl} />
                    您的浏览器不支持音频播放，请下载后查看。
                  </audio>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-between items-center">
              <p className="text-sm text-gray-500 truncate pr-2">
                附件: {safeAttachmentUrl.split('/').pop()}
              </p>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 flex-shrink-0"
              >
                <Download className="w-4 h-4" />
                下载文件
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/learning')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-800 truncate">{material.title}</h1>
        </div>
      </div>

      <div className="p-4">
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
          <div className="flex items-start gap-4 mb-4">
            <div className={`${typeConfig.bg} rounded-xl p-3 flex-shrink-0`}>
              <Icon className={`w-8 h-8 ${typeConfig.color}`} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-gray-800 mb-2 break-words">{material.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                {material.category && (
                  <span className="bg-gray-100 px-2 py-1 rounded">{material.category}</span>
                )}
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {material.viewCount}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(material.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {material.description && (
            <p className="text-gray-600 mb-4">{material.description}</p>
          )}

          {material.thumbnailUrl && (
            <div className="mb-4">
              <img
                src={normalizeUrl(material.thumbnailUrl)}
                alt={material.title}
                className="w-full rounded-lg max-h-80 object-cover"
              />
            </div>
          )}

          <div className="prose prose-blue max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">{material.content}</div>
          </div>

          {(fileType === 'video' || fileType === 'audio') && safeAttachmentUrl && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-lg font-semibold mb-4">
                {fileType === 'video' ? '视频播放' : '音频播放'}
              </h3>
              {fileType === 'video' ? (
                <video
                  controls
                  className="w-full max-w-2xl rounded-lg shadow bg-black"
                  poster={normalizeUrl(material.thumbnailUrl)}
                >
                  <source src={safeAttachmentUrl} />
                  您的浏览器不支持视频播放。
                </video>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg max-w-xl">
                  <audio controls className="w-full">
                    <source src={safeAttachmentUrl} />
                    您的浏览器不支持音频播放。
                  </audio>
                </div>
              )}
            </div>
          )}

          {safeAttachmentUrl && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-lg font-semibold mb-4">附件</h3>
              <div className="flex flex-wrap gap-3">
                {fileType === 'docx' && (
                  <button
                    onClick={() => handlePreview('docx')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    预览文档
                  </button>
                )}

                {fileType === 'pdf' && (
                  <button
                    onClick={() => handlePreview('pdf')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    预览 PDF
                  </button>
                )}

                {fileType === 'ppt' && (
                  <button
                    onClick={() => handlePreview('ppt')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    预览 PPT
                  </button>
                )}

                {fileType === 'video' && (
                  <button
                    onClick={() => handlePreview('video')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    全屏播放
                  </button>
                )}

                {fileType === 'audio' && (
                  <button
                    onClick={() => handlePreview('audio')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    播放音频
                  </button>
                )}

                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {fileType === 'pdf' ? '下载 PDF' :
                   fileType === 'ppt' ? '下载 PPT' :
                   fileType === 'docx' ? '下载文档' :
                   fileType === 'video' ? '下载视频' :
                   fileType === 'audio' ? '下载音频' : '下载附件'}
                </button>

                <a
                  href={safeAttachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  新窗口打开
                </a>
              </div>

              <p className="mt-3 text-sm text-gray-500 break-all">
                文件名: {safeAttachmentUrl.split('/').pop()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningMaterialDetail;
