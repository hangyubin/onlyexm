import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import { WeakPoint, DEFAULT_WEAK_POINTS } from '../api/home';

// 院感标签名称到代码的映射
const TAG_NAME_TO_CODE: Record<string, string> = {
  '手卫生': 'HAND_HYGIENE',
  '医废处理': 'MEDICAL_WASTE',
  '医疗废物': 'MEDICAL_WASTE',
  '职业暴露': 'EXPOSURE',
  '消毒隔离': 'DISINFECTION',
  '消毒灭菌': 'DISINFECTION',
  '多重耐药菌': 'MDRO',
  '空气质量': 'AIR_QUALITY',
  '隔离防护': 'ISOLATION',
  '无菌操作': 'STERILIZATION',
  '感染监测': 'INFECTION_MONITOR',
};

interface RadarChartProps {
  data: WeakPoint[];
}

export const RadarChart: React.FC<RadarChartProps> = ({ data }) => {
  const navigate = useNavigate();
  const safeData = data && Array.isArray(data) && data.length > 0 ? data : DEFAULT_WEAK_POINTS;

  const handleClick = (params: any) => {
    if (params.name && TAG_NAME_TO_CODE[params.name]) {
      navigate(`/wrong-questions?tag=${TAG_NAME_TO_CODE[params.name]}`);
    }
  };
  
  const option = {
    radar: {
      indicator: safeData.map((item: WeakPoint) => ({
        name: item.name,
        max: 100
      })),
      radius: '65%',
      center: ['50%', '50%'],
      splitNumber: 4,
      axisName: {
        color: '#666',
        fontSize: 10
      },
      splitLine: {
        lineStyle: {
          color: ['#eee', '#ddd', '#ccc', '#bbb']
        }
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['rgba(255,255,255,0.8)', 'rgba(245,245,245,0.6)']
        }
      },
      axisLine: {
        lineStyle: {
          color: '#ddd'
        }
      }
    },
    series: [{
      type: 'radar',
      data: [{
        value: safeData.map((item: WeakPoint) => item.score || 0),
        name: '薄弱点分析',
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          color: '#5B8FF9',
          width: 2
        },
        areaStyle: {
          color: 'rgba(91, 143, 249, 0.3)'
        },
        itemStyle: {
          color: '#5B8FF9'
        }
      }]
    }]
  };

  return (
    <ReactECharts 
      option={option} 
      style={{ height: 200, width: '100%' }}
      opts={{ renderer: 'canvas' }}
      onEvents={{ click: handleClick }}
    />
  );
};
