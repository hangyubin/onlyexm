import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  FileText, 
  Video, 
  File,
  FileSpreadsheet,
  FileText as FileDoc,
  ChevronLeft,
  Eye,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { learningMaterialApi, LearningMaterial } from '../api/learningMaterial';
import { useDicts, DICT_CATEGORY } from '../hooks/useDict';

const typeIconMap = {
  ARTICLE: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-100' },
  VIDEO: { icon: Video, color: 'text-green-500', bg: 'bg-green-100' },
  PDF: { icon: File, color: 'text-orange-500', bg: 'bg-orange-100' },
  DOC: { icon: FileDoc, color: 'text-purple-500', bg: 'bg-purple-100' },
  EXCEL: { icon: FileSpreadsheet, color: 'text-cyan-500', bg: 'bg-cyan-100' },
  PPT: { icon: File, color: 'text-pink-500', bg: 'bg-pink-100' },
};

const LearningMaterials: React.FC = () => {
  useDicts([DICT_CATEGORY.LEARNING_MATERIAL_TYPE]);
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await learningMaterialApi.getList();
      setMaterials(data);
    } catch (error) {
      console.error('Failed to fetch learning materials:', error);
      setError('加载学习资料失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 max-w-md mx-auto">
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-800">学习资料</h1>
        </div>
      </div>

      <div className="p-4">
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">加载中...</p>
          </div>
        ) : materials.length > 0 ? (
          <div className="space-y-4">
            {materials.map((material) => {
              const typeConfig = typeIconMap[material.type as keyof typeof typeIconMap] || typeIconMap.ARTICLE;
              const Icon = typeConfig.icon;
              
              return (
                <Link
                  key={material.id}
                  to={`/learning/${material.id}`}
                  className="block bg-white rounded-xl shadow-sm border border-gray-100 p-4 active:opacity-70 transition-opacity hover:shadow-md"
                >
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 ${typeConfig.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-6 h-6 ${typeConfig.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-800 mb-1 truncate">{material.title}</h3>
                      {material.description && (
                        <p className="text-sm text-gray-500 mb-2 line-clamp-2">{material.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        {material.category && (
                          <span className="bg-gray-100 px-2 py-0.5 rounded">{material.category}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {material.viewCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(material.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暂无学习资料</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningMaterials;