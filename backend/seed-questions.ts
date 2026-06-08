import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// =============================================================
// 题目数据定义
// =============================================================

interface SeedQuestion {
  content: string;
  type: string;
  category: string;
  difficulty: number;
  analysis: string;
  standardSource?: string;
  options: { optionKey: string; content: string; isCorrect: boolean }[];
}

// ==================== 院感知识 - 单选题 ====================
const infectionSingle: SeedQuestion[] = [
  {
    content: '七步洗手法的总揉搓时间应不少于多少秒？',
    type: 'SINGLE', category: 'INFECTION_KNOWLEDGE', difficulty: 1,
    analysis: '根据WS/T 313-2019《医务人员手卫生规范》，七步洗手法揉搓总时间不少于15秒。',
    options: [
      { optionKey: 'A', content: '10秒', isCorrect: false },
      { optionKey: 'B', content: '15秒', isCorrect: true },
      { optionKey: 'C', content: '20秒', isCorrect: false },
      { optionKey: 'D', content: '30秒', isCorrect: false },
    ],
  },
  {
    content: '灭菌是指杀灭或清除传播媒介上一切微生物，包括什么？',
    type: 'SINGLE', category: 'INFECTION_KNOWLEDGE', difficulty: 1,
    analysis: '灭菌（sterilization）是杀灭或清除传播媒介上一切微生物的处理，包括细菌芽孢。',
    standardSource: 'GB 15982-2012 医院消毒卫生标准',
    options: [
      { optionKey: 'A', content: '仅细菌', isCorrect: false },
      { optionKey: 'B', content: '仅病毒', isCorrect: false },
      { optionKey: 'C', content: '细菌芽孢', isCorrect: true },
      { optionKey: 'D', content: '仅真菌', isCorrect: false },
    ],
  },
  {
    content: '医疗废物管理中，锐器应放入什么颜色的专用容器？',
    type: 'SINGLE', category: 'INFECTION_KNOWLEDGE', difficulty: 1,
    analysis: '根据《医疗废物管理条例》，损伤性废物（锐器）应放入黄色利器盒/锐器盒。',
    standardSource: '《医疗废物管理条例》',
    options: [
      { optionKey: 'A', content: '黑色垃圾袋', isCorrect: false },
      { optionKey: 'B', content: '黄色利器盒', isCorrect: true },
      { optionKey: 'C', content: '红色塑料袋', isCorrect: false },
      { optionKey: 'D', content: '蓝色收纳箱', isCorrect: false },
    ],
  },
  {
    content: '多重耐药菌（MDRO）患者应采取哪种隔离措施？',
    type: 'SINGLE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: '多重耐药菌感染患者应采取接触隔离，同时可结合实际情况采取单间隔离或同种病原体同室隔离。',
    optionKey: 'A', content: '飞沫隔离', isCorrect: false,
    options: [
      { optionKey: 'A', content: '飞沫隔离', isCorrect: false },
      { optionKey: 'B', content: '空气隔离', isCorrect: false },
      { optionKey: 'C', content: '接触隔离', isCorrect: true },
      { optionKey: 'D', content: '消化道隔离', isCorrect: false },
    ],
  },
  {
    content: '含氯消毒剂浸泡消毒时，有效氯浓度通常为多少？',
    type: 'SINGLE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: '一般物品表面消毒使用含有效氯500mg/L的消毒液浸泡30分钟；被血液、体液污染时使用2000-5000mg/L。',
    standardSource: 'WS/T 367-2012 医疗机构消毒技术规范',
    options: [
      { optionKey: 'A', content: '100mg/L', isCorrect: false },
      { optionKey: 'B', content: '500mg/L', isCorrect: true },
      { optionKey: 'C', content: '1000mg/L', isCorrect: false },
      { optionKey: 'D', content: '2000mg/L', isCorrect: false },
    ],
  },
  {
    content: '职业暴露后，HIV暴露者应在多长时间内开始预防性用药？',
    type: 'SINGLE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: 'HIV职业暴露后应尽快（最好在2小时内）开始预防性用药，最迟不超过72小时。',
    standardSource: '《血源性病原体职业接触防护导则》',
    options: [
      { optionKey: 'A', content: '1小时内', isCorrect: false },
      { optionKey: 'B', content: '2小时内（最迟72小时）', isCorrect: true },
      { optionKey: 'C', content: '24小时内', isCorrect: false },
      { optionKey: 'D', content: '48小时内', isCorrect: false },
    ],
  },
  {
    content: '手卫生的五个时刻不包括以下哪项？',
    type: 'SINGLE', category: 'INFECTION_KNOWLEDGE', difficulty: 1,
    analysis: 'WHO手卫生五时刻：接触患者前、清洁/无菌操作前、接触患者血液体液后、接触患者后、接触患者周围环境后。',
    options: [
      { optionKey: 'A', content: '接触患者前', isCorrect: false },
      { optionKey: 'B', content: '接触患者后', isCorrect: false },
      { optionKey: 'C', content: '查房前', isCorrect: true },
      { optionKey: 'D', content: '清洁/无菌操作前', isCorrect: false },
    ],
  },
  {
    content: '压力蒸汽灭菌的温度和时间要求正确的是？',
    type: 'SINGLE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: '下排气式压力蒸汽灭菌在121℃至少20-30分钟，预真空式在132-134℃至少4分钟。',
    standardSource: 'WS 310.2-2016 医院消毒供应中心',
    options: [
      { optionKey: 'A', content: '100℃, 10分钟', isCorrect: false },
      { optionKey: 'B', content: '121℃, 20-30分钟', isCorrect: true },
      { optionKey: 'C', content: '150℃, 5分钟', isCorrect: false },
      { optionKey: 'D', content: '160℃, 2分钟', isCorrect: false },
    ],
  },
  {
    content: '埃博拉病毒属于哪一类病原微生物？',
    type: 'SINGLE', category: 'INFECTION_KNOWLEDGE', difficulty: 3,
    analysis: '根据《人间传染的病原微生物名录》，埃博拉病毒属于第一类病原微生物（最高危害等级），需在BSL-4实验室操作。',
    options: [
      { optionKey: 'A', content: '第一类（高致病性）', isCorrect: true },
      { optionKey: 'B', content: '第二类', isCorrect: false },
      { optionKey: 'C', content: '第三类', isCorrect: false },
      { optionKey: 'D', content: '第四类', isCorrect: false },
    ],
  },
  {
    content: '医用防护口罩（N95）的过滤效率要求至少达到多少？',
    type: 'SINGLE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: 'N95口罩对非油性颗粒物过滤效率≥95%，KN95为≥95%。',
    standardSource: 'GB 19083-2010 医用防护口罩技术要求',
    options: [
      { optionKey: 'A', content: '85%', isCorrect: false },
      { optionKey: 'B', content: '90%', isCorrect: false },
      { optionKey: 'C', content: '95%', isCorrect: true },
      { optionKey: 'D', content: '99%', isCorrect: false },
    ],
  },
  {
    content: '下列哪种消毒剂属于高效消毒剂？',
    type: 'SINGLE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: '含氯消毒剂属于高效消毒剂，可杀灭包括细菌芽孢在内的各种微生物。乙醇属于中效消毒剂。',
    options: [
      { optionKey: 'A', content: '75%酒精', isCorrect: false },
      { optionKey: 'B', content: '含氯消毒剂', isCorrect: true },
      { optionKey: 'C', content: '碘伏', isCorrect: false },
      { optionKey: 'D', content: '洗必泰', isCorrect: false },
    ],
  },
  {
    content: '医院感染暴发是指医疗机构或其科室的患者中，短时间内发生多少例及以上同种同源感染病例？',
    type: 'SINGLE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: '根据《医院感染管理办法》，医院感染暴发指短时间内发生3例及以上同种同源感染病例。',
    options: [
      { optionKey: 'A', content: '2例', isCorrect: false },
      { optionKey: 'B', content: '3例', isCorrect: true },
      { optionKey: 'C', content: '5例', isCorrect: false },
      { optionKey: 'D', content: '10例', isCorrect: false },
    ],
  },
  {
    content: '医务人员发生针刺伤后，处理流程的第一步是什么？',
    type: 'SINGLE', category: 'INFECTION_KNOWLEDGE', difficulty: 1,
    analysis: '针刺伤处理流程：①立即挤出伤口旁血液 → ②流动水冲洗 → ③碘伏/酒精消毒 → ④包扎 → ⑤报告并评估。',
    options: [
      { optionKey: 'A', content: '立即报告', isCorrect: false },
      { optionKey: 'B', content: '立即挤出伤口旁血液并用流动水冲洗', isCorrect: true },
      { optionKey: 'C', content: '直接包扎', isCorrect: false },
      { optionKey: 'D', content: '抽血化验', isCorrect: false },
    ],
  },
  {
    content: '手术器械灭菌首选的灭菌方法是？',
    type: 'SINGLE', category: 'INFECTION_KNOWLEDGE', difficulty: 1,
    analysis: '压力蒸汽灭菌是首选的灭菌方法，适用于耐湿、耐热的器械、器具和物品。',
    standardSource: 'WS 310.2-2016',
    options: [
      { optionKey: 'A', content: '环氧乙烷灭菌', isCorrect: false },
      { optionKey: 'B', content: '压力蒸汽灭菌', isCorrect: true },
      { optionKey: 'C', content: '低温等离子灭菌', isCorrect: false },
      { optionKey: 'D', content: '戊二醛浸泡', isCorrect: false },
    ],
  },
  {
    content: '隔离标识中，黄色代表哪种隔离？',
    type: 'SINGLE', category: 'INFECTION_KNOWLEDGE', difficulty: 1,
    analysis: '蓝色=接触隔离，黄色=空气隔离，粉色=飞沫隔离。',
    options: [
      { optionKey: 'A', content: '接触隔离', isCorrect: false },
      { optionKey: 'B', content: '空气隔离', isCorrect: true },
      { optionKey: 'C', content: '飞沫隔离', isCorrect: false },
      { optionKey: 'D', content: '消化道隔离', isCorrect: false },
    ],
  },
  {
    content: '内镜消毒应达到什么水平？',
    type: 'SINGLE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: '根据斯伯丁分类，消化道内镜属于中度危险性物品，应达到高水平消毒。',
    standardSource: 'WS 507-2016 软式内镜清洗消毒技术规范',
    options: [
      { optionKey: 'A', content: '清洁', isCorrect: false },
      { optionKey: 'B', content: '低水平消毒', isCorrect: false },
      { optionKey: 'C', content: '高水平消毒', isCorrect: true },
      { optionKey: 'D', content: '灭菌', isCorrect: false },
    ],
  },
  {
    content: 'MRSA是什么细菌的缩写？',
    type: 'SINGLE', category: 'INFECTION_KNOWLEDGE', difficulty: 1,
    analysis: 'MRSA（Methicillin-resistant Staphylococcus aureus）即耐甲氧西林金黄色葡萄球菌。',
    options: [
      { optionKey: 'A', content: '耐万古霉素肠球菌', isCorrect: false },
      { optionKey: 'B', content: '耐甲氧西林金黄色葡萄球菌', isCorrect: true },
      { optionKey: 'C', content: '耐碳青霉烯鲍曼不动杆菌', isCorrect: false },
      { optionKey: 'D', content: '产ESBLs大肠埃希菌', isCorrect: false },
    ],
  },
  {
    content: '手术室空气消毒通常采用什么方法？',
    type: 'SINGLE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: '手术室空气消毒通常采用紫外线照射或空气消毒机，洁净手术室采用层流净化。',
    standardSource: 'GB 50333-2013 医院洁净手术部建筑技术规范',
    options: [
      { optionKey: 'A', content: '开窗通风', isCorrect: false },
      { optionKey: 'B', content: '紫外线照射或空气消毒机', isCorrect: true },
      { optionKey: 'C', content: '喷洒酒精', isCorrect: false },
      { optionKey: 'D', content: '熏蒸消毒', isCorrect: false },
    ],
  },
  {
    content: '医疗废物暂存时间不得超过多少小时？',
    type: 'SINGLE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: '根据《医疗废物管理条例》，医疗废物暂时贮存时间不得超过48小时。',
    options: [
      { optionKey: 'A', content: '12小时', isCorrect: false },
      { optionKey: 'B', content: '24小时', isCorrect: false },
      { optionKey: 'C', content: '48小时', isCorrect: true },
      { optionKey: 'D', content: '72小时', isCorrect: false },
    ],
  },
  {
    content: '标准预防的核心原则是什么？',
    type: 'SINGLE', category: 'INFECTION_KNOWLEDGE', difficulty: 1,
    analysis: '标准预防的核心原则是将所有患者的血液、体液、分泌物、排泄物视为有传染性，接触时需采取防护措施。',
    options: [
      { optionKey: 'A', content: '只防护已知传染病患者', isCorrect: false },
      { optionKey: 'B', content: '将所有患者的血液体液视为有传染性', isCorrect: true },
      { optionKey: 'C', content: '只使用手套', isCorrect: false },
      { optionKey: 'D', content: '只使用口罩', isCorrect: false },
    ],
  },
];

// ==================== 院感知识 - 多选题 ====================
const infectionMultiple: SeedQuestion[] = [
  {
    content: '下列哪些属于医院感染的危险因素？',
    type: 'MULTIPLE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: '侵入性操作（如插管、手术）、长期住院、使用广谱抗生素、免疫力低下都是医院感染的危险因素。',
    options: [
      { optionKey: 'A', content: '侵入性操作', isCorrect: true },
      { optionKey: 'B', content: '免疫力低下', isCorrect: true },
      { optionKey: 'C', content: '使用广谱抗生素', isCorrect: true },
      { optionKey: 'D', content: '住院时间短', isCorrect: false },
      { optionKey: 'E', content: '多次手术', isCorrect: true },
    ],
  },
  {
    content: '下列哪些属于医疗废物分类？',
    type: 'MULTIPLE', category: 'INFECTION_KNOWLEDGE', difficulty: 1,
    analysis: '医疗废物分为五类：感染性废物、损伤性废物、病理性废物、药物性废物、化学性废物。',
    standardSource: '《医疗废物分类目录》',
    options: [
      { optionKey: 'A', content: '感染性废物', isCorrect: true },
      { optionKey: 'B', content: '损伤性废物', isCorrect: true },
      { optionKey: 'C', content: '生活垃圾', isCorrect: false },
      { optionKey: 'D', content: '药物性废物', isCorrect: true },
      { optionKey: 'E', content: '化学性废物', isCorrect: true },
    ],
  },
  {
    content: '手卫生的指征包括哪些？',
    type: 'MULTIPLE', category: 'INFECTION_KNOWLEDGE', difficulty: 1,
    analysis: 'WHO手卫生五时刻：接触患者前、无菌操作前、接触体液后、接触患者后、接触患者周围环境后。',
    options: [
      { optionKey: 'A', content: '接触患者前', isCorrect: true },
      { optionKey: 'B', content: '无菌操作前', isCorrect: true },
      { optionKey: 'C', content: '接触患者体液后', isCorrect: true },
      { optionKey: 'D', content: '接触患者后', isCorrect: true },
      { optionKey: 'E', content: '接触患者周围环境后', isCorrect: true },
    ],
  },
  {
    content: '下列哪些消毒方法属于物理消毒法？',
    type: 'MULTIPLE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: '物理消毒法包括热力消毒（煮沸、蒸汽）、紫外线消毒、微波消毒等。化学消毒剂属于化学消毒法。',
    options: [
      { optionKey: 'A', content: '煮沸消毒', isCorrect: true },
      { optionKey: 'B', content: '紫外线照射', isCorrect: true },
      { optionKey: 'C', content: '含氯消毒剂浸泡', isCorrect: false },
      { optionKey: 'D', content: '压力蒸汽灭菌', isCorrect: true },
      { optionKey: 'E', content: '乙醇擦拭', isCorrect: false },
    ],
  },
  {
    content: '下列哪些是预防导管相关血流感染的措施？',
    type: 'MULTIPLE', category: 'INFECTION_KNOWLEDGE', difficulty: 3,
    analysis: '预防CLABSI措施包括：最大无菌屏障、氯己定消毒、选择合适穿刺部位、每日评估导管必要性、手卫生等。',
    options: [
      { optionKey: 'A', content: '置管时使用最大无菌屏障', isCorrect: true },
      { optionKey: 'B', content: '使用2%氯己定消毒皮肤', isCorrect: true },
      { optionKey: 'C', content: '每日评估导管保留必要性', isCorrect: true },
      { optionKey: 'D', content: '常规更换导管', isCorrect: false },
      { optionKey: 'E', content: '严格执行手卫生', isCorrect: true },
    ],
  },
  {
    content: '下列哪些属于多重耐药菌（MDRO）？',
    type: 'MULTIPLE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: '常见MDRO包括MRSA、VRE、CRE、CRAB、MDR/PDR-PA等。MSSA为甲氧西林敏感金葡菌，不属于MDRO。',
    options: [
      { optionKey: 'A', content: 'MRSA（耐甲氧西林金葡菌）', isCorrect: true },
      { optionKey: 'B', content: 'VRE（耐万古霉素肠球菌）', isCorrect: true },
      { optionKey: 'C', content: 'CRE（耐碳青霉烯肠杆菌）', isCorrect: true },
      { optionKey: 'D', content: 'MSSA（甲氧西林敏感金葡菌）', isCorrect: false },
      { optionKey: 'E', content: 'CRAB（耐碳青霉烯鲍曼不动杆菌）', isCorrect: true },
    ],
  },
  {
    content: '标准预防的措施包括哪些？',
    type: 'MULTIPLE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: '标准预防包括：手卫生、使用个人防护用品（PPE）、呼吸卫生/咳嗽礼仪、患者安置、器械消毒灭菌、环境清洁等。',
    options: [
      { optionKey: 'A', content: '手卫生', isCorrect: true },
      { optionKey: 'B', content: '使用个人防护用品', isCorrect: true },
      { optionKey: 'C', content: '安全注射', isCorrect: true },
      { optionKey: 'D', content: '仅对已知传染病患者使用防护', isCorrect: false },
      { optionKey: 'E', content: '正确处理医疗废物', isCorrect: true },
    ],
  },
  {
    content: '下列哪些属于医源性感染的传播途径？',
    type: 'MULTIPLE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: '医源性感染的传播途径包括：接触传播（直接/间接）、飞沫传播、空气传播、血源性传播、水源性传播。',
    options: [
      { optionKey: 'A', content: '接触传播', isCorrect: true },
      { optionKey: 'B', content: '飞沫传播', isCorrect: true },
      { optionKey: 'C', content: '空气传播', isCorrect: true },
      { optionKey: 'D', content: '血源性传播', isCorrect: true },
      { optionKey: 'E', content: '食物传播', isCorrect: false },
    ],
  },
  {
    content: '下列哪些情况需要穿隔离衣？',
    type: 'MULTIPLE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: '可能被血液、体液、分泌物污染时需穿隔离衣；接触MDRO患者需穿隔离衣；大面积烧伤护理需穿隔离衣。',
    options: [
      { optionKey: 'A', content: '接触MDRO感染患者', isCorrect: true },
      { optionKey: 'B', content: '大面积烧伤换药', isCorrect: true },
      { optionKey: 'C', content: '可能被血液体液大面积污染', isCorrect: true },
      { optionKey: 'D', content: '常规查房', isCorrect: false },
      { optionKey: 'E', content: 'ICU常规护理', isCorrect: false },
    ],
  },
  {
    content: '下列哪些是医院感染监测的主要内容？',
    type: 'MULTIPLE', category: 'INFECTION_KNOWLEDGE', difficulty: 3,
    analysis: '医院感染监测包括：感染发病率监测、环境卫生学监测、消毒灭菌效果监测、抗生素使用监测、MDRO监测等。',
    options: [
      { optionKey: 'A', content: '医院感染发病率监测', isCorrect: true },
      { optionKey: 'B', content: '环境卫生学监测', isCorrect: true },
      { optionKey: 'C', content: '消毒灭菌效果监测', isCorrect: true },
      { optionKey: 'D', content: '抗菌药物使用监测', isCorrect: true },
      { optionKey: 'E', content: '仅监测ICU', isCorrect: false },
    ],
  },
  {
    content: '下列哪些消毒剂可用于皮肤消毒？',
    type: 'MULTIPLE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: '碘伏、75%乙醇、氯己定均可用于皮肤消毒。含氯消毒剂有刺激性，不用于皮肤消毒。过氧乙酸为强氧化剂，不用于皮肤。',
    options: [
      { optionKey: 'A', content: '碘伏', isCorrect: true },
      { optionKey: 'B', content: '75%乙醇', isCorrect: true },
      { optionKey: 'C', content: '含氯消毒剂', isCorrect: false },
      { optionKey: 'D', content: '氯己定', isCorrect: true },
      { optionKey: 'E', content: '过氧乙酸', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于职业暴露后的处理措施？',
    type: 'MULTIPLE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: '职业暴露后处理：①局部处理（挤血、冲洗、消毒）→ ②报告 → ③评估暴露源 → ④血清学检测 → ⑤预防用药 → ⑥随访。',
    options: [
      { optionKey: 'A', content: '立即挤出伤口旁血液', isCorrect: true },
      { optionKey: 'B', content: '用流动水冲洗伤口', isCorrect: true },
      { optionKey: 'C', content: '用碘伏/酒精消毒', isCorrect: true },
      { optionKey: 'D', content: '立即报告并评估', isCorrect: true },
      { optionKey: 'E', content: '继续工作，无需处理', isCorrect: false },
    ],
  },
  {
    content: '下列哪些措施可以有效预防手术部位感染？',
    type: 'MULTIPLE', category: 'INFECTION_KNOWLEDGE', difficulty: 3,
    analysis: '预防SSI措施：术前沐浴、备皮正确、血糖控制、术中保温、预防性抗生素合理使用、严格无菌操作等。',
    options: [
      { optionKey: 'A', content: '术前使用抗菌沐浴液沐浴', isCorrect: true },
      { optionKey: 'B', content: '术前不备皮', isCorrect: true },
      { optionKey: 'C', content: '术中维持正常体温', isCorrect: true },
      { optionKey: 'D', content: '术前预防性使用抗生素', isCorrect: true },
      { optionKey: 'E', content: '术后常规更换敷料', isCorrect: false },
    ],
  },
  {
    content: '下列哪些部门需要重点进行医院感染监测？',
    type: 'MULTIPLE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: 'ICU、新生儿科、手术室、血透室、口腔科等都是医院感染高风险部门，需要重点监测。',
    options: [
      { optionKey: 'A', content: 'ICU', isCorrect: true },
      { optionKey: 'B', content: '新生儿科', isCorrect: true },
      { optionKey: 'C', content: '手术室', isCorrect: true },
      { optionKey: 'D', content: '血透室', isCorrect: true },
      { optionKey: 'E', content: '行政办公室', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于呼吸道传染病的隔离措施？',
    type: 'MULTIPLE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: '呼吸道传染病需采取飞沫隔离或空气隔离，戴口罩、单间隔离、负压病房、通风等。',
    options: [
      { optionKey: 'A', content: '戴口罩', isCorrect: true },
      { optionKey: 'B', content: '单间隔离', isCorrect: true },
      { optionKey: 'C', content: '负压病房', isCorrect: true },
      { optionKey: 'D', content: '加强通风', isCorrect: true },
      { optionKey: 'E', content: '无需隔离', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于医院感染管理组织体系？',
    type: 'MULTIPLE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: '医院感染管理组织体系包括：医院感染管理委员会、感染管理科、临床科室感染管理小组三级组织。',
    options: [
      { optionKey: 'A', content: '医院感染管理委员会', isCorrect: true },
      { optionKey: 'B', content: '感染管理科', isCorrect: true },
      { optionKey: 'C', content: '临床科室感染管理小组', isCorrect: true },
      { optionKey: 'D', content: '后勤保障科', isCorrect: false },
      { optionKey: 'E', content: '财务科', isCorrect: false },
    ],
  },
  {
    content: '下列哪些因素会影响消毒效果？',
    type: 'MULTIPLE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: '消毒效果受消毒剂浓度、作用时间、温度、pH值、有机物含量、微生物种类和数量等因素影响。',
    options: [
      { optionKey: 'A', content: '消毒剂浓度', isCorrect: true },
      { optionKey: 'B', content: '作用时间', isCorrect: true },
      { optionKey: 'C', content: '有机物污染', isCorrect: true },
      { optionKey: 'D', content: '环境温度', isCorrect: true },
      { optionKey: 'E', content: '操作人员性别', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于接触传播的防护措施？',
    type: 'MULTIPLE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: '接触传播防护措施包括：手卫生、戴手套、穿隔离衣、患者单间隔离或同种病原体同室隔离、专用诊疗器械。',
    options: [
      { optionKey: 'A', content: '严格手卫生', isCorrect: true },
      { optionKey: 'B', content: '戴手套', isCorrect: true },
      { optionKey: 'C', content: '穿隔离衣', isCorrect: true },
      { optionKey: 'D', content: '患者单间隔离', isCorrect: true },
      { optionKey: 'E', content: '使用专用诊疗器械', isCorrect: true },
    ],
  },
  {
    content: '下列哪些传染病需要采取空气隔离措施？',
    type: 'MULTIPLE', category: 'INFECTION_KNOWLEDGE', difficulty: 3,
    analysis: '需要空气隔离的传染病：活动性肺结核（痰菌阳性）、麻疹、水痘、播散性带状疱疹等。流感属于飞沫隔离。',
    options: [
      { optionKey: 'A', content: '活动性肺结核', isCorrect: true },
      { optionKey: 'B', content: '麻疹', isCorrect: true },
      { optionKey: 'C', content: '水痘', isCorrect: true },
      { optionKey: 'D', content: '流感', isCorrect: false },
      { optionKey: 'E', content: '播散性带状疱疹', isCorrect: true },
    ],
  },
  {
    content: '下列哪些属于灭菌效果的监测方法？',
    type: 'MULTIPLE', category: 'INFECTION_KNOWLEDGE', difficulty: 3,
    analysis: '灭菌效果监测方法包括：工艺监测（物理参数）、化学监测（化学指示卡/胶带）、生物监测（嗜热脂肪杆菌芽孢）。',
    options: [
      { optionKey: 'A', content: '工艺监测（温度、压力、时间）', isCorrect: true },
      { optionKey: 'B', content: '化学监测（化学指示卡）', isCorrect: true },
      { optionKey: 'C', content: '生物监测（嗜热脂肪杆菌芽孢）', isCorrect: true },
      { optionKey: 'D', content: '仅靠肉眼观察', isCorrect: false },
      { optionKey: 'E', content: 'B-D试验', isCorrect: true },
    ],
  },
];

// ==================== 院感知识 - 判断题 ====================
const infectionJudge: SeedQuestion[] = [
  {
    content: '体温计测量时间至少需要5分钟。',
    type: 'JUDGE', category: 'INFECTION_KNOWLEDGE', difficulty: 1,
    analysis: '腋下体温计测量时间通常为5-10分钟，但口表为3分钟，肛表为3分钟。题干说法不全面，但腋下测量确实至少需要5分钟。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
  {
    content: '意识障碍分为嗜睡、昏睡、昏迷三个等级。',
    type: 'JUDGE', category: 'INFECTION_KNOWLEDGE', difficulty: 1,
    analysis: '意识障碍分为嗜睡、昏睡、浅昏迷、深昏迷四个等级，题干缺少浅昏迷和深昏迷的区分。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
  {
    content: '人体血液循环分为体循环和肺循环。',
    type: 'JUDGE', category: 'INFECTION_KNOWLEDGE', difficulty: 1,
    analysis: '人体血液循环确实分为体循环（大循环）和肺循环（小循环），这是正确的。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '接种疫苗是预防传染病最有效的手段。',
    type: 'JUDGE', category: 'INFECTION_KNOWLEDGE', difficulty: 1,
    analysis: '接种疫苗是预防传染病最经济、最有效的手段之一，这是公认的公共卫生原则。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '多重耐药菌患者应采取接触隔离。',
    type: 'JUDGE', category: 'INFECTION_KNOWLEDGE', difficulty: 1,
    analysis: '多重耐药菌主要通过接触传播，应采取接触隔离措施。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '快速手消毒剂可以替代洗手。',
    type: 'JUDGE', category: 'INFECTION_KNOWLEDGE', difficulty: 1,
    analysis: '当手部没有明显污染时，快速手消毒剂可以替代洗手；但手部有明显污染时，必须用流动水洗手。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
  {
    content: '含氯消毒剂需要现配现用。',
    type: 'JUDGE', category: 'INFECTION_KNOWLEDGE', difficulty: 1,
    analysis: '含氯消毒剂因挥发性较强，配制后应尽快使用，通常要求现配现用。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '医务人员在接触不同患者之间不需要更换手套。',
    type: 'JUDGE', category: 'INFECTION_KNOWLEDGE', difficulty: 1,
    analysis: '接触不同患者之间必须更换手套并进行手卫生，以防止交叉感染。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
  {
    content: '紫外线消毒灯可以直接照射人体。',
    type: 'JUDGE', category: 'INFECTION_KNOWLEDGE', difficulty: 1,
    analysis: '紫外线对皮肤和眼睛有损伤，不能直接照射人体，消毒时人员必须离开。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
  {
    content: '环氧乙烷灭菌后可直接使用，无需解析。',
    type: 'JUDGE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: '环氧乙烷灭菌后需要充分解析（通风）去除残留的环氧乙烷气体，否则可能对患者造成伤害。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
  {
    content: '医疗废物可以与生活垃圾混放。',
    type: 'JUDGE', category: 'INFECTION_KNOWLEDGE', difficulty: 1,
    analysis: '医疗废物和生活垃圾必须严格分类收集，不得混放。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
  {
    content: '戴手套可以替代手卫生。',
    type: 'JUDGE', category: 'INFECTION_KNOWLEDGE', difficulty: 1,
    analysis: '戴手套不能替代手卫生，戴手套前后都需要进行手卫生。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
  {
    content: '发生医院感染暴发时，应在2小时内向所在地卫生行政部门报告。',
    type: 'JUDGE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: '根据《医院感染管理办法》，发生医院感染暴发应在规定时间内报告，但具体时限因严重程度而异。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
  {
    content: '新生儿病房应严格执行手卫生制度。',
    type: 'JUDGE', category: 'INFECTION_KNOWLEDGE', difficulty: 1,
    analysis: '新生儿免疫功能低下，是医院感染的高危人群，应严格执行手卫生制度。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '呼吸机管路可以每周更换一次。',
    type: 'JUDGE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: '呼吸机管路不需要常规更换，适时更换即可。常规更换反而增加VAP风险。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
  {
    content: '一次性医疗用品可以重复使用。',
    type: 'JUDGE', category: 'INFECTION_KNOWLEDGE', difficulty: 1,
    analysis: '一次性医疗用品严禁重复使用，使用后应按医疗废物处理。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
  {
    content: '诺如病毒主要通过粪-口途径传播。',
    type: 'JUDGE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: '诺如病毒主要通过粪-口途径传播，也可通过接触和气溶胶传播。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '医务人员发生HIV职业暴露后，预防用药越早越好。',
    type: 'JUDGE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: 'HIV职业暴露后预防用药越早越好，最好在2小时内，最迟不超过72小时。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: 'B超探头使用后只需擦拭清洁即可。',
    type: 'JUDGE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: 'B超探头使用后应根据用途进行消毒或灭菌，仅清洁是不够的，特别是接触黏膜和破损皮肤的探头。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
  {
    content: '隔离衣可以重复使用不需更换。',
    type: 'JUDGE', category: 'INFECTION_KNOWLEDGE', difficulty: 1,
    analysis: '隔离衣应根据污染情况及时更换，不同患者之间必须更换，不能重复使用。一次性隔离衣使用后丢弃。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
];

// ==================== 院感知识 - 案例分析 ====================
const infectionCase: SeedQuestion[] = [
  {
    content: '患者，男性，65岁，因"结肠癌"行结肠癌根治术后第5天，出现发热（T 38.5℃），切口红肿，有脓性分泌物。分泌物培养提示MRSA。请问：该患者最可能的诊断是什么？',
    type: 'CASE', category: 'INFECTION_KNOWLEDGE', difficulty: 3,
    analysis: '术后出现发热、切口红肿、脓性分泌物，培养MRSA阳性，符合手术部位感染（SSI）的诊断标准。',
    options: [
      { optionKey: 'A', content: '手术部位感染', isCorrect: true },
      { optionKey: 'B', content: '肺部感染', isCorrect: false },
      { optionKey: 'C', content: '尿路感染', isCorrect: false },
      { optionKey: 'D', content: '药物热', isCorrect: false },
    ],
  },
  {
    content: '患者，女性，72岁，因"COPD急性加重"入住ICU，气管插管机械通气第3天，出现发热（T 39℃），痰量增多，痰培养提示鲍曼不动杆菌（CRAB）。请问：该患者最可能发生了哪种医院感染？',
    type: 'CASE', category: 'INFECTION_KNOWLEDGE', difficulty: 3,
    analysis: '气管插管机械通气48小时后出现发热、痰量增多、痰培养阳性，符合呼吸机相关性肺炎（VAP）的诊断。',
    options: [
      { optionKey: 'A', content: '呼吸机相关性肺炎', isCorrect: true },
      { optionKey: 'B', content: '导管相关血流感染', isCorrect: false },
      { optionKey: 'C', content: '导管相关尿路感染', isCorrect: false },
      { optionKey: 'D', content: '手术部位感染', isCorrect: false },
    ],
  },
  {
    content: '护士在给患者抽血后，不慎被针头刺伤手指。该患者为乙肝表面抗原阳性。请问：该护士首先应采取的措施是什么？',
    type: 'CASE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: '针刺伤后第一步：立即从近心端向远心端挤出伤口旁血液，然后用流动水冲洗，再用碘伏/酒精消毒。',
    options: [
      { optionKey: 'A', content: '立即挤出伤口旁血液并用流动水冲洗', isCorrect: true },
      { optionKey: 'B', content: '立即抽血化验', isCorrect: false },
      { optionKey: 'C', content: '立即报告领导', isCorrect: false },
      { optionKey: 'D', content: '立即注射乙肝疫苗', isCorrect: false },
    ],
  },
  {
    content: '某医院ICU一周内连续出现3例VRE感染患者，且药敏谱相似。请问：此情况属于什么？',
    type: 'CASE', category: 'INFECTION_KNOWLEDGE', difficulty: 3,
    analysis: '短时间内出现3例及以上同种同源感染病例，符合医院感染暴发的定义。',
    options: [
      { optionKey: 'A', content: '医院感染暴发', isCorrect: true },
      { optionKey: 'B', content: '医院感染散发', isCorrect: false },
      { optionKey: 'C', content: '社区感染', isCorrect: false },
      { optionKey: 'D', content: '医院感染流行', isCorrect: false },
    ],
  },
  {
    content: '患者，男性，58岁，因"脑出血"入院，留置导尿管第5天，出现发热（T 38.2℃）、尿频尿急，尿培养提示大肠埃希菌（产ESBLs）。请问：该患者的感染类型是什么？',
    type: 'CASE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: '留置导尿管后出现发热、尿路刺激症状，尿培养阳性，符合导管相关尿路感染（CAUTI）的诊断。',
    options: [
      { optionKey: 'A', content: '导管相关尿路感染', isCorrect: true },
      { optionKey: 'B', content: '导管相关血流感染', isCorrect: false },
      { optionKey: 'C', content: '呼吸机相关性肺炎', isCorrect: false },
      { optionKey: 'D', content: '手术部位感染', isCorrect: false },
    ],
  },
  {
    content: '手术室护士在整理手术器械时，发现一把止血钳上有少量锈迹。请问：该止血钳应如何处理？',
    type: 'CASE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: '有锈迹的器械应先除锈处理，再按常规流程清洗、消毒、灭菌。锈迹会影响灭菌效果。',
    options: [
      { optionKey: 'A', content: '先除锈处理，再清洗消毒灭菌', isCorrect: true },
      { optionKey: 'B', content: '直接清洗后灭菌', isCorrect: false },
      { optionKey: 'C', content: '丢弃不用', isCorrect: false },
      { optionKey: 'D', content: '直接使用，不影响', isCorrect: false },
    ],
  },
  {
    content: '患者，女性，42岁，因"肺结核"入院，痰涂片抗酸杆菌阳性。请问：该患者应采取哪种隔离措施？',
    type: 'CASE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: '痰菌阳性的活动性肺结核患者应安置在负压病房，采取空气隔离措施，医务人员佩戴N95口罩。',
    options: [
      { optionKey: 'A', content: '空气隔离', isCorrect: true },
      { optionKey: 'B', content: '飞沫隔离', isCorrect: false },
      { optionKey: 'C', content: '接触隔离', isCorrect: false },
      { optionKey: 'D', content: '不需要隔离', isCorrect: false },
    ],
  },
  {
    content: '某医院手术室在连续3台手术后器械灭菌时，生物监测结果均为阳性。请问：首先应如何处理？',
    type: 'CASE', category: 'INFECTION_KNOWLEDGE', difficulty: 3,
    analysis: '生物监测阳性表明灭菌失败，应立即召回相关批次灭菌物品，查找原因（灭菌器故障、装载不当等），暂停使用该灭菌器。',
    options: [
      { optionKey: 'A', content: '立即召回相关批次灭菌物品并暂停使用灭菌器', isCorrect: true },
      { optionKey: 'B', content: '继续使用，加大灭菌剂量', isCorrect: false },
      { optionKey: 'C', content: '只召回部分物品', isCorrect: false },
      { optionKey: 'D', content: '不做处理，可能是假阳性', isCorrect: false },
    ],
  },
  {
    content: '患者，男性，72岁，因"糖尿病足"入院，伤口分泌物培养提示MRSA和铜绿假单胞菌混合感染。请问：该患者应采取的隔离措施是什么？',
    type: 'CASE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: 'MRSA感染患者应采取接触隔离；铜绿假单胞菌也主要通过接触传播。因此应优先采取接触隔离。',
    options: [
      { optionKey: 'A', content: '接触隔离', isCorrect: true },
      { optionKey: 'B', content: '飞沫隔离', isCorrect: false },
      { optionKey: 'C', content: '空气隔离', isCorrect: false },
      { optionKey: 'D', content: '不需隔离', isCorrect: false },
    ],
  },
  {
    content: '某社区卫生服务中心发现一例疑似COVID-19患者。请问：该中心院感管理的首要措施是什么？',
    type: 'CASE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: '首要措施是对患者进行隔离并转诊至定点医院，同时做好个人防护，对接触区域进行消毒，防止院内传播。',
    options: [
      { optionKey: 'A', content: '立即隔离患者并转诊至定点医院', isCorrect: true },
      { optionKey: 'B', content: '继续常规诊疗', isCorrect: false },
      { optionKey: 'C', content: '只给患者戴口罩', isCorrect: false },
      { optionKey: 'D', content: '请患者自行就医', isCorrect: false },
    ],
  },
  {
    content: '护士在配制含氯消毒剂时，不慎将消毒液溅入眼睛。请问：首先应采取的措施是什么？',
    type: 'CASE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: '化学物质溅入眼睛应立即用大量流动水或生理盐水持续冲洗至少15分钟，然后就医。',
    options: [
      { optionKey: 'A', content: '立即用大量流动水冲洗眼睛至少15分钟', isCorrect: true },
      { optionKey: 'B', content: '用纸巾擦拭', isCorrect: false },
      { optionKey: 'C', content: '滴眼药水', isCorrect: false },
      { optionKey: 'D', content: '闭眼休息', isCorrect: false },
    ],
  },
  {
    content: '患者，女性，78岁，因"重症肺炎"在ICU住院，行中心静脉置管第7天，突然出现高热（T 40℃）、寒战，血培养和外周血培养提示金黄色葡萄球菌。请问：该患者最可能发生了哪种感染？',
    type: 'CASE', category: 'INFECTION_KNOWLEDGE', difficulty: 3,
    analysis: '中心静脉置管后出现高热、寒战，血培养阳性，符合导管相关血流感染（CLABSI）的诊断。',
    options: [
      { optionKey: 'A', content: '导管相关血流感染', isCorrect: true },
      { optionKey: 'B', content: '呼吸机相关性肺炎', isCorrect: false },
      { optionKey: 'C', content: '导管相关尿路感染', isCorrect: false },
      { optionKey: 'D', content: '手术部位感染', isCorrect: false },
    ],
  },
  {
    content: '某医院感染管理科发现外科病房1周内出现3例手术切口感染，均为同一医生主刀。请问：感染管理科应首先采取什么措施？',
    type: 'CASE', category: 'INFECTION_KNOWLEDGE', difficulty: 3,
    analysis: '出现聚集性手术部位感染应首先暂停该医生的手术，同时进行流行病学调查，查找感染源和传播途径。',
    options: [
      { optionKey: 'A', content: '暂停该医生手术，进行流行病学调查', isCorrect: true },
      { optionKey: 'B', content: '继续手术，加强观察', isCorrect: false },
      { optionKey: 'C', content: '只报告不处理', isCorrect: false },
      { optionKey: 'D', content: '仅对患者进行治疗', isCorrect: false },
    ],
  },
  {
    content: '患者，男性，32岁，因"急性阑尾炎"行阑尾切除术，术后第3天出院。术后第7天因切口红肿、流脓返回医院。请问：该感染属于什么类型？',
    type: 'CASE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: '手术后30天内发生的切口感染（无植入物）或1年内（有植入物）都属于手术部位感染，属于医院感染。',
    options: [
      { optionKey: 'A', content: '手术部位感染（医院感染）', isCorrect: true },
      { optionKey: 'B', content: '社区感染', isCorrect: false },
      { optionKey: 'C', content: '不属于感染', isCorrect: false },
      { optionKey: 'D', content: '药物过敏', isCorrect: false },
    ],
  },
  {
    content: '内镜室使用戊二醛浸泡消毒胃镜，消毒时间为10分钟。请问：该消毒程序是否正确？',
    type: 'CASE', category: 'INFECTION_KNOWLEDGE', difficulty: 3,
    analysis: '根据规范，用戊二醛消毒内镜需要浸泡至少10分钟（消毒），如需灭菌则需浸泡10小时。但规范推荐使用邻苯二甲醛（OPA）等替代。',
    options: [
      { optionKey: 'A', content: '不正确，消毒时间不足', isCorrect: true },
      { optionKey: 'B', content: '正确，10分钟足够', isCorrect: false },
      { optionKey: 'C', content: '无需消毒', isCorrect: false },
      { optionKey: 'D', content: '时间过长，应缩短', isCorrect: false },
    ],
  },
  {
    content: '某科室护士长发现科室库存的碘伏消毒液已过期3个月。请问：应如何处理？',
    type: 'CASE', category: 'INFECTION_KNOWLEDGE', difficulty: 1,
    analysis: '过期消毒剂应立即停止使用，按医疗废物处理，不得继续使用。',
    options: [
      { optionKey: 'A', content: '立即停止使用，按医疗废物处理', isCorrect: true },
      { optionKey: 'B', content: '稀释后继续使用', isCorrect: false },
      { optionKey: 'C', content: '继续使用，不影响', isCorrect: false },
      { optionKey: 'D', content: '送检验科检测后使用', isCorrect: false },
    ],
  },
  {
    content: '患者，男性，80岁，因"中风"长期卧床，护士发现患者骶尾部皮肤出现3cm×4cm发红区，压之不褪色。请问：该患者发生了什么？',
    type: 'CASE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: '长期卧床患者骶尾部皮肤发红、压之不褪色，属于压力性损伤I期，需要及时采取措施防止发展。',
    options: [
      { optionKey: 'A', content: '压力性损伤I期', isCorrect: true },
      { optionKey: 'B', content: '皮肤过敏', isCorrect: false },
      { optionKey: 'C', content: '正常皮肤变化', isCorrect: false },
      { optionKey: 'D', content: '湿疹', isCorrect: false },
    ],
  },
  {
    content: '某透析中心发现1例患者在透析后出现发热、寒战，血培养阳性。同批次其他患者未见异常。请问：最可能的感染来源是什么？',
    type: 'CASE', category: 'INFECTION_KNOWLEDGE', difficulty: 3,
    analysis: '单个患者出现血流感染，同批次患者无异常，最可能的原因是患者自身血管通路感染或操作不当，而非透析液污染。',
    options: [
      { optionKey: 'A', content: '血管通路感染', isCorrect: true },
      { optionKey: 'B', content: '透析液污染', isCorrect: false },
      { optionKey: 'C', content: '透析器问题', isCorrect: false },
      { optionKey: 'D', content: '水处理系统问题', isCorrect: false },
    ],
  },
  {
    content: '检验科工作人员在操作HIV阳性血液标本时，标本管破裂，血液溅到面部。面部有少量痘痘破损。请问：该工作人员应如何处理？',
    type: 'CASE', category: 'INFECTION_KNOWLEDGE', difficulty: 3,
    analysis: 'HIV职业暴露后处理：①立即用大量流动水冲洗面部 → ②用肥皂水清洗 → ③评估暴露风险 → ④尽快（2小时内）开始预防用药 → ⑤血清学检测和随访。',
    options: [
      { optionKey: 'A', content: '立即用肥皂水和流动水冲洗面部，评估后尽快预防用药', isCorrect: true },
      { optionKey: 'B', content: '用酒精擦拭面部', isCorrect: false },
      { optionKey: 'C', content: '不做处理，观察', isCorrect: false },
      { optionKey: 'D', content: '只报告不处理', isCorrect: false },
    ],
  },
  {
    content: '某医院准备对一间长期未使用的ICU病房重新启用。请问：启用前应进行什么处理？',
    type: 'CASE', category: 'INFECTION_KNOWLEDGE', difficulty: 2,
    analysis: '长期未使用的病房重新启用前应进行彻底清洁消毒，包括空气、物体表面、通风系统等，并进行环境卫生学监测合格后方可启用。',
    options: [
      { optionKey: 'A', content: '彻底清洁消毒并进行环境卫生学监测', isCorrect: true },
      { optionKey: 'B', content: '简单打扫即可', isCorrect: false },
      { optionKey: 'C', content: '直接使用', isCorrect: false },
      { optionKey: 'D', content: '仅开窗通风', isCorrect: false },
    ],
  },
];

// ==================== 公共卫生 - 单选题 ====================
const publicSingle: SeedQuestion[] = [
  {
    content: '我国法定传染病分为几类？',
    type: 'SINGLE', category: 'PUBLIC', difficulty: 1,
    analysis: '根据《传染病防治法》，我国法定传染病分为甲类、乙类、丙类三类。',
    standardSource: '《中华人民共和国传染病防治法》',
    options: [
      { optionKey: 'A', content: '二类', isCorrect: false },
      { optionKey: 'B', content: '三类', isCorrect: true },
      { optionKey: 'C', content: '四类', isCorrect: false },
      { optionKey: 'D', content: '五类', isCorrect: false },
    ],
  },
  {
    content: '下列哪种传染病属于甲类传染病？',
    type: 'SINGLE', category: 'PUBLIC', difficulty: 1,
    analysis: '我国甲类传染病包括鼠疫和霍乱。COVID-19按甲类管理但属于乙类传染病。',
    standardSource: '《传染病防治法》',
    options: [
      { optionKey: 'A', content: '鼠疫', isCorrect: true },
      { optionKey: 'B', content: '艾滋病', isCorrect: false },
      { optionKey: 'C', content: 'COVID-19', isCorrect: false },
      { optionKey: 'D', content: '肺结核', isCorrect: false },
    ],
  },
  {
    content: '预防接种异常反应是指什么？',
    type: 'SINGLE', category: 'PUBLIC', difficulty: 2,
    analysis: '预防接种异常反应是指合格的疫苗在实施规范接种过程中或接种后造成受种者机体组织器官、功能损害，相关各方均无过错的药品不良反应。',
    options: [
      { optionKey: 'A', content: '接种后所有不良反应', isCorrect: false },
      { optionKey: 'B', content: '合格疫苗规范接种后发生的无过错药品不良反应', isCorrect: true },
      { optionKey: 'C', content: '疫苗质量不合格引起的反应', isCorrect: false },
      { optionKey: 'D', content: '接种操作失误引起的反应', isCorrect: false },
    ],
  },
  {
    content: '突发公共卫生事件应急响应的最高级别是？',
    type: 'SINGLE', category: 'PUBLIC', difficulty: 1,
    analysis: '突发公共卫生事件应急响应分为四级：Ⅰ级（特别重大）、Ⅱ级（重大）、Ⅲ级（较大）、Ⅳ级（一般），Ⅰ级为最高级别。',
    options: [
      { optionKey: 'A', content: 'Ⅰ级', isCorrect: true },
      { optionKey: 'B', content: 'Ⅱ级', isCorrect: false },
      { optionKey: 'C', content: 'Ⅲ级', isCorrect: false },
      { optionKey: 'D', content: 'Ⅳ级', isCorrect: false },
    ],
  },
  {
    content: '艾滋病的主要传播途径不包括？',
    type: 'SINGLE', category: 'PUBLIC', difficulty: 1,
    analysis: '艾滋病通过性传播、血液传播、母婴传播。日常接触（握手、拥抱、共餐）不会传播HIV。',
    options: [
      { optionKey: 'A', content: '性传播', isCorrect: false },
      { optionKey: 'B', content: '血液传播', isCorrect: false },
      { optionKey: 'C', content: '日常接触', isCorrect: true },
      { optionKey: 'D', content: '母婴传播', isCorrect: false },
    ],
  },
  {
    content: '肺结核的主要传播途径是？',
    type: 'SINGLE', category: 'PUBLIC', difficulty: 1,
    analysis: '肺结核主要通过呼吸道飞沫传播，当患者咳嗽、打喷嚏、大声说话时喷出含结核菌的飞沫。',
    options: [
      { optionKey: 'A', content: '血液传播', isCorrect: false },
      { optionKey: 'B', content: '呼吸道飞沫传播', isCorrect: true },
      { optionKey: 'C', content: '消化道传播', isCorrect: false },
      { optionKey: 'D', content: '接触传播', isCorrect: false },
    ],
  },
  {
    content: '国家基本公共卫生服务项目由谁免费提供？',
    type: 'SINGLE', category: 'PUBLIC', difficulty: 1,
    analysis: '国家基本公共卫生服务项目由基层医疗卫生机构（社区卫生服务中心、乡镇卫生院、村卫生室）免费向居民提供。',
    options: [
      { optionKey: 'A', content: '三甲医院', isCorrect: false },
      { optionKey: 'B', content: '基层医疗卫生机构', isCorrect: true },
      { optionKey: 'C', content: '疾控中心', isCorrect: false },
      { optionKey: 'D', content: '私人诊所', isCorrect: false },
    ],
  },
  {
    content: '乙肝疫苗的免疫程序是？',
    type: 'SINGLE', category: 'PUBLIC', difficulty: 1,
    analysis: '乙肝疫苗采用0-1-6月免疫程序，即出生后24小时内（第1针）、1月龄（第2针）、6月龄（第3针）。',
    options: [
      { optionKey: 'A', content: '0-1-2月', isCorrect: false },
      { optionKey: 'B', content: '0-1-6月', isCorrect: true },
      { optionKey: 'C', content: '0-3-6月', isCorrect: false },
      { optionKey: 'D', content: '1-2-3月', isCorrect: false },
    ],
  },
  {
    content: '我国法定报告传染病疫情报告时限，甲类传染病和按甲类管理的乙类传染病应在几小时内报告？',
    type: 'SINGLE', category: 'PUBLIC', difficulty: 2,
    analysis: '甲类传染病和按甲类管理的乙类传染病应在2小时内通过网络直报，其他乙类及丙类传染病应在24小时内报告。',
    options: [
      { optionKey: 'A', content: '2小时', isCorrect: true },
      { optionKey: 'B', content: '6小时', isCorrect: false },
      { optionKey: 'C', content: '12小时', isCorrect: false },
      { optionKey: 'D', content: '24小时', isCorrect: false },
    ],
  },
  {
    content: '下列哪种疾病属于自然疫源性疾病？',
    type: 'SINGLE', category: 'PUBLIC', difficulty: 2,
    analysis: '肾综合征出血热（流行性出血热）是由汉坦病毒引起的自然疫源性疾病，以鼠类为主要传染源。',
    options: [
      { optionKey: 'A', content: '肾综合征出血热', isCorrect: true },
      { optionKey: 'B', content: '细菌性痢疾', isCorrect: false },
      { optionKey: 'C', content: '流感', isCorrect: false },
      { optionKey: 'D', content: '手足口病', isCorrect: false },
    ],
  },
  {
    content: '健康中国行动提出，到2030年居民健康素养水平应达到？',
    type: 'SINGLE', category: 'PUBLIC', difficulty: 2,
    analysis: '健康中国行动（2019-2030）提出，到2030年居民健康素养水平达到30%。',
    options: [
      { optionKey: 'A', content: '20%', isCorrect: false },
      { optionKey: 'B', content: '25%', isCorrect: false },
      { optionKey: 'C', content: '30%', isCorrect: true },
      { optionKey: 'D', content: '35%', isCorrect: false },
    ],
  },
  {
    content: '饮用水消毒最常用的方法是？',
    type: 'SINGLE', category: 'PUBLIC', difficulty: 1,
    analysis: '氯化消毒（加氯消毒）是饮用水消毒最常用的方法，具有持续杀菌能力。',
    options: [
      { optionKey: 'A', content: '氯化消毒', isCorrect: true },
      { optionKey: 'B', content: '紫外线消毒', isCorrect: false },
      { optionKey: 'C', content: '臭氧消毒', isCorrect: false },
      { optionKey: 'D', content: '煮沸消毒', isCorrect: false },
    ],
  },
  {
    content: '手足口病的好发人群是？',
    type: 'SINGLE', category: 'PUBLIC', difficulty: 1,
    analysis: '手足口病好发于5岁以下儿童，尤其是3岁以下婴幼儿。',
    options: [
      { optionKey: 'A', content: '5岁以下儿童', isCorrect: true },
      { optionKey: 'B', content: '青少年', isCorrect: false },
      { optionKey: 'C', content: '成年人', isCorrect: false },
      { optionKey: 'D', content: '老年人', isCorrect: false },
    ],
  },
  {
    content: '健康教育的原则不包括？',
    type: 'SINGLE', category: 'PUBLIC', difficulty: 2,
    analysis: '健康教育的原则包括科学性、针对性、实用性、可及性、参与性等。强制性不是健康教育的原则。',
    options: [
      { optionKey: 'A', content: '科学性原则', isCorrect: false },
      { optionKey: 'B', content: '针对性原则', isCorrect: false },
      { optionKey: 'C', content: '强制性原则', isCorrect: true },
      { optionKey: 'D', content: '可及性原则', isCorrect: false },
    ],
  },
  {
    content: '省级突发公共卫生事件应急预案的制定主体是？',
    type: 'SINGLE', category: 'PUBLIC', difficulty: 2,
    analysis: '根据《突发公共卫生事件应急条例》，省级人民政府负责制定本行政区域的突发公共卫生事件应急预案。',
    options: [
      { optionKey: 'A', content: '省级人民政府', isCorrect: true },
      { optionKey: 'B', content: '省级卫健委', isCorrect: false },
      { optionKey: 'C', content: '省级疾控中心', isCorrect: false },
      { optionKey: 'D', content: '省级医院', isCorrect: false },
    ],
  },
  {
    content: '尘肺病的主要病因是？',
    type: 'SINGLE', category: 'PUBLIC', difficulty: 1,
    analysis: '尘肺病是由于长期吸入生产性粉尘（如矽尘、煤尘）并在肺内潴留而引起的肺组织弥漫性纤维化。',
    options: [
      { optionKey: 'A', content: '长期吸入生产性粉尘', isCorrect: true },
      { optionKey: 'B', content: '吸烟', isCorrect: false },
      { optionKey: 'C', content: '病毒感染', isCorrect: false },
      { optionKey: 'D', content: '遗传因素', isCorrect: false },
    ],
  },
  {
    content: '下列哪项不属于"健康四大基石"？',
    type: 'SINGLE', category: 'PUBLIC', difficulty: 1,
    analysis: '健康四大基石：合理膳食、适量运动、戒烟限酒、心理平衡。定期体检是健康管理手段，不属于四大基石。',
    options: [
      { optionKey: 'A', content: '合理膳食', isCorrect: false },
      { optionKey: 'B', content: '适量运动', isCorrect: false },
      { optionKey: 'C', content: '定期体检', isCorrect: true },
      { optionKey: 'D', content: '戒烟限酒', isCorrect: false },
    ],
  },
  {
    content: '流感疫苗需要每年接种的主要原因是？',
    type: 'SINGLE', category: 'PUBLIC', difficulty: 2,
    analysis: '流感病毒变异快，每年流行毒株可能不同，WHO每年根据监测结果推荐新的疫苗株，因此需要每年接种。',
    options: [
      { optionKey: 'A', content: '流感病毒容易变异', isCorrect: true },
      { optionKey: 'B', content: '疫苗质量差', isCorrect: false },
      { optionKey: 'C', content: '免疫力持续短', isCorrect: false },
      { optionKey: 'D', content: '接种技术问题', isCorrect: false },
    ],
  },
  {
    content: '食品安全标准的性质是？',
    type: 'SINGLE', category: 'PUBLIC', difficulty: 2,
    analysis: '根据《食品安全法》，食品安全标准是强制执行的标准，任何食品生产经营者必须遵守。',
    standardSource: '《中华人民共和国食品安全法》',
    options: [
      { optionKey: 'A', content: '推荐性标准', isCorrect: false },
      { optionKey: 'B', content: '强制执行标准', isCorrect: true },
      { optionKey: 'C', content: '行业标准', isCorrect: false },
      { optionKey: 'D', content: '企业标准', isCorrect: false },
    ],
  },
  {
    content: '下列关于"社区诊断"的说法，正确的是？',
    type: 'SINGLE', category: 'PUBLIC', difficulty: 3,
    analysis: '社区诊断是运用社会学和流行病学方法，对社区人群健康状况、主要健康问题及其影响因素进行调查研究的过程。',
    options: [
      { optionKey: 'A', content: '对社区人群健康状况和健康问题的综合评价', isCorrect: true },
      { optionKey: 'B', content: '对个体疾病的诊断', isCorrect: false },
      { optionKey: 'C', content: '仅对传染病的诊断', isCorrect: false },
      { optionKey: 'D', content: '仅对慢性病的诊断', isCorrect: false },
    ],
  },
];

// ==================== 公共卫生 - 多选题 ====================
const publicMultiple: SeedQuestion[] = [
  {
    content: '下列哪些属于我国法定乙类传染病？',
    type: 'MULTIPLE', category: 'PUBLIC', difficulty: 2,
    analysis: '艾滋、乙肝、肺结核、梅毒均为乙类传染病。鼠疫、霍乱为甲类。',
    options: [
      { optionKey: 'A', content: '艾滋病', isCorrect: true },
      { optionKey: 'B', content: '病毒性肝炎（乙肝）', isCorrect: true },
      { optionKey: 'C', content: '肺结核', isCorrect: true },
      { optionKey: 'D', content: '梅毒', isCorrect: true },
      { optionKey: 'E', content: '鼠疫', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于国家基本公共卫生服务项目？',
    type: 'MULTIPLE', category: 'PUBLIC', difficulty: 2,
    analysis: '国家基本公共卫生服务项目包括：居民健康档案管理、健康教育、预防接种、0-6岁儿童健康管理、孕产妇健康管理、老年人健康管理、慢性病患者健康管理、严重精神障碍患者管理等。',
    options: [
      { optionKey: 'A', content: '居民健康档案管理', isCorrect: true },
      { optionKey: 'B', content: '预防接种', isCorrect: true },
      { optionKey: 'C', content: '孕产妇健康管理', isCorrect: true },
      { optionKey: 'D', content: '老年人健康管理', isCorrect: true },
      { optionKey: 'E', content: '美容整形服务', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于突发公共卫生事件的特征？',
    type: 'MULTIPLE', category: 'PUBLIC', difficulty: 2,
    analysis: '突发公共卫生事件具有突发性、公共性、严重性、紧急性和复杂性等特征。',
    options: [
      { optionKey: 'A', content: '突发性', isCorrect: true },
      { optionKey: 'B', content: '公共性', isCorrect: true },
      { optionKey: 'C', content: '严重危害性', isCorrect: true },
      { optionKey: 'D', content: '可预测性', isCorrect: false },
      { optionKey: 'E', content: '需要紧急处置', isCorrect: true },
    ],
  },
  {
    content: '下列哪些措施可以有效预防流感？',
    type: 'MULTIPLE', category: 'PUBLIC', difficulty: 1,
    analysis: '预防流感措施包括：接种流感疫苗、勤洗手、戴口罩、保持社交距离、加强通风等。',
    options: [
      { optionKey: 'A', content: '接种流感疫苗', isCorrect: true },
      { optionKey: 'B', content: '勤洗手', isCorrect: true },
      { optionKey: 'C', content: '戴口罩', isCorrect: true },
      { optionKey: 'D', content: '保持室内通风', isCorrect: true },
      { optionKey: 'E', content: '自行服用抗生素', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于食源性疾病？',
    type: 'MULTIPLE', category: 'PUBLIC', difficulty: 2,
    analysis: '食源性疾病包括：细菌性食物中毒、化学性食物中毒、有毒动植物中毒、真菌毒素中毒等。',
    options: [
      { optionKey: 'A', content: '沙门氏菌食物中毒', isCorrect: true },
      { optionKey: 'B', content: '亚硝酸盐中毒', isCorrect: true },
      { optionKey: 'C', content: '河豚毒素中毒', isCorrect: true },
      { optionKey: 'D', content: '黄曲霉毒素中毒', isCorrect: true },
      { optionKey: 'E', content: '花粉过敏', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于环境污染对健康的影响？',
    type: 'MULTIPLE', category: 'PUBLIC', difficulty: 2,
    analysis: '环境污染可导致急慢性中毒、致癌、致畸、致突变、免疫功能下降等健康损害。',
    options: [
      { optionKey: 'A', content: '急性中毒', isCorrect: true },
      { optionKey: 'B', content: '致癌作用', isCorrect: true },
      { optionKey: 'C', content: '致畸作用', isCorrect: true },
      { optionKey: 'D', content: '免疫功能下降', isCorrect: true },
      { optionKey: 'E', content: '增强免疫力', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于慢性非传染性疾病的主要危险因素？',
    type: 'MULTIPLE', category: 'PUBLIC', difficulty: 2,
    analysis: '慢性病的主要危险因素包括：吸烟、不合理膳食、缺乏运动、过量饮酒、肥胖等。',
    options: [
      { optionKey: 'A', content: '吸烟', isCorrect: true },
      { optionKey: 'B', content: '不合理膳食', isCorrect: true },
      { optionKey: 'C', content: '缺乏运动', isCorrect: true },
      { optionKey: 'D', content: '过量饮酒', isCorrect: true },
      { optionKey: 'E', content: '遗传因素', isCorrect: true },
    ],
  },
  {
    content: '下列哪些属于艾滋病的高危行为？',
    type: 'MULTIPLE', category: 'PUBLIC', difficulty: 2,
    analysis: '艾滋病高危行为包括：无保护性行为、共用注射器吸毒、输入不安全血液、使用未经消毒的器械等。',
    options: [
      { optionKey: 'A', content: '无保护性行为', isCorrect: true },
      { optionKey: 'B', content: '共用注射器吸毒', isCorrect: true },
      { optionKey: 'C', content: '输入不安全血液制品', isCorrect: true },
      { optionKey: 'D', content: '握手拥抱', isCorrect: false },
      { optionKey: 'E', content: '共餐', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于突发公共卫生事件的类型？',
    type: 'MULTIPLE', category: 'PUBLIC', difficulty: 2,
    analysis: '突发公共卫生事件包括：重大传染病疫情、群体性不明原因疾病、重大食物中毒、职业中毒等。',
    options: [
      { optionKey: 'A', content: '重大传染病疫情', isCorrect: true },
      { optionKey: 'B', content: '群体性不明原因疾病', isCorrect: true },
      { optionKey: 'C', content: '重大食物中毒', isCorrect: true },
      { optionKey: 'D', content: '重大职业中毒', isCorrect: true },
      { optionKey: 'E', content: '普通感冒', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于健康教育的常用方法？',
    type: 'MULTIPLE', category: 'PUBLIC', difficulty: 2,
    analysis: '健康教育方法包括：讲座、咨询、宣传栏、发放宣传资料、同伴教育、新媒体传播等。',
    options: [
      { optionKey: 'A', content: '健康讲座', isCorrect: true },
      { optionKey: 'B', content: '个别咨询', isCorrect: true },
      { optionKey: 'C', content: '宣传栏', isCorrect: true },
      { optionKey: 'D', content: '发放宣传资料', isCorrect: true },
      { optionKey: 'E', content: '恐吓宣传', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于职业病的特征？',
    type: 'MULTIPLE', category: 'PUBLIC', difficulty: 2,
    analysis: '职业病具有明确的职业危害因素接触史、病因明确、群体发病、剂量-反应关系等特征。',
    options: [
      { optionKey: 'A', content: '病因明确', isCorrect: true },
      { optionKey: 'B', content: '有明确的职业危害因素接触史', isCorrect: true },
      { optionKey: 'C', content: '群体发病', isCorrect: true },
      { optionKey: 'D', content: '可预防', isCorrect: true },
      { optionKey: 'E', content: '与职业无关', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于预防接种的禁忌症？',
    type: 'MULTIPLE', category: 'PUBLIC', difficulty: 3,
    analysis: '疫苗接种禁忌症：严重过敏史、急性发热性疾病、严重慢性病急性发作期、免疫缺陷等。',
    options: [
      { optionKey: 'A', content: '既往接种同类疫苗有严重过敏反应', isCorrect: true },
      { optionKey: 'B', content: '急性发热性疾病', isCorrect: true },
      { optionKey: 'C', content: '严重免疫缺陷', isCorrect: true },
      { optionKey: 'D', content: '轻微感冒', isCorrect: false },
      { optionKey: 'E', content: '处于严重慢性病急性发作期', isCorrect: true },
    ],
  },
  {
    content: '下列哪些属于传染病流行的三个基本环节？',
    type: 'MULTIPLE', category: 'PUBLIC', difficulty: 1,
    analysis: '传染病流行三环节：传染源、传播途径、易感人群。缺少任何一个环节，流行就无法建立。',
    options: [
      { optionKey: 'A', content: '传染源', isCorrect: true },
      { optionKey: 'B', content: '传播途径', isCorrect: true },
      { optionKey: 'C', content: '易感人群', isCorrect: true },
      { optionKey: 'D', content: '病原体', isCorrect: false },
      { optionKey: 'E', content: '自然环境', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于计划免疫的"五苗防七病"中的疫苗？',
    type: 'MULTIPLE', category: 'PUBLIC', difficulty: 2,
    analysis: '国家免疫规划"五苗防七病"：卡介苗（结核）、脊灰疫苗（小儿麻痹）、百白破（百日咳、白喉、破伤风）、麻疹疫苗（麻疹）、乙肝疫苗（乙肝）。',
    options: [
      { optionKey: 'A', content: '卡介苗', isCorrect: true },
      { optionKey: 'B', content: '脊灰疫苗', isCorrect: true },
      { optionKey: 'C', content: '百白破疫苗', isCorrect: true },
      { optionKey: 'D', content: '麻疹疫苗', isCorrect: true },
      { optionKey: 'E', content: '乙肝疫苗', isCorrect: true },
    ],
  },
  {
    content: '下列哪些属于饮用水卫生标准中的微生物指标？',
    type: 'MULTIPLE', category: 'PUBLIC', difficulty: 3,
    analysis: '饮用水微生物指标包括：总大肠菌群、耐热大肠菌群、大肠埃希菌、菌落总数等。',
    options: [
      { optionKey: 'A', content: '总大肠菌群', isCorrect: true },
      { optionKey: 'B', content: '耐热大肠菌群', isCorrect: true },
      { optionKey: 'C', content: '大肠埃希菌', isCorrect: true },
      { optionKey: 'D', content: '菌落总数', isCorrect: true },
      { optionKey: 'E', content: '蛋白质含量', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于传染病报告的责任单位和责任人？',
    type: 'MULTIPLE', category: 'PUBLIC', difficulty: 2,
    analysis: '所有医疗机构及其执行职务的医务人员都是传染病报告的责任单位和责任人。',
    options: [
      { optionKey: 'A', content: '各级医疗机构', isCorrect: true },
      { optionKey: 'B', content: '疾控中心', isCorrect: true },
      { optionKey: 'C', content: '执行职务的医务人员', isCorrect: true },
      { optionKey: 'D', content: '普通居民', isCorrect: false },
      { optionKey: 'E', content: '社区卫生服务中心', isCorrect: true },
    ],
  },
  {
    content: '下列哪些属于职业健康监护的内容？',
    type: 'MULTIPLE', category: 'PUBLIC', difficulty: 2,
    analysis: '职业健康监护包括：上岗前体检、在岗期间定期体检、离岗时体检、应急体检、职业健康档案管理等。',
    options: [
      { optionKey: 'A', content: '上岗前职业健康检查', isCorrect: true },
      { optionKey: 'B', content: '在岗期间定期健康检查', isCorrect: true },
      { optionKey: 'C', content: '离岗时健康检查', isCorrect: true },
      { optionKey: 'D', content: '应急健康检查', isCorrect: true },
      { optionKey: 'E', content: '普通年度体检', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于控烟的有效措施？',
    type: 'MULTIPLE', category: 'PUBLIC', difficulty: 2,
    analysis: '控烟措施包括：提高烟草税、公共场所禁烟、健康警示标识、禁止烟草广告、戒烟服务等。',
    options: [
      { optionKey: 'A', content: '提高烟草税', isCorrect: true },
      { optionKey: 'B', content: '公共场所全面禁烟', isCorrect: true },
      { optionKey: 'C', content: '烟盒印制健康警示', isCorrect: true },
      { optionKey: 'D', content: '禁止烟草广告促销', isCorrect: true },
      { optionKey: 'E', content: '推广电子烟替代', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于公共卫生监测的内容？',
    type: 'MULTIPLE', category: 'PUBLIC', difficulty: 3,
    analysis: '公共卫生监测包括：传染病监测、慢性病监测、死因监测、食源性疾病监测、环境健康监测等。',
    options: [
      { optionKey: 'A', content: '传染病监测', isCorrect: true },
      { optionKey: 'B', content: '慢性病监测', isCorrect: true },
      { optionKey: 'C', content: '死因监测', isCorrect: true },
      { optionKey: 'D', content: '食源性疾病监测', isCorrect: true },
      { optionKey: 'E', content: '社交网络监测', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于健康素养的基本内容？',
    type: 'MULTIPLE', category: 'PUBLIC', difficulty: 2,
    analysis: '健康素养包括：基本健康知识和理念、健康生活方式与行为、基本健康技能三个方面。',
    options: [
      { optionKey: 'A', content: '基本健康知识和理念', isCorrect: true },
      { optionKey: 'B', content: '健康生活方式与行为', isCorrect: true },
      { optionKey: 'C', content: '基本健康技能', isCorrect: true },
      { optionKey: 'D', content: '高级医学知识', isCorrect: false },
      { optionKey: 'E', content: '手术操作技能', isCorrect: false },
    ],
  },
];

// ==================== 公共卫生 - 判断题 ====================
const publicJudge: SeedQuestion[] = [
  {
    content: 'COVID-19（新型冠状病毒肺炎）属于乙类传染病，按甲类管理。',
    type: 'JUDGE', category: 'PUBLIC', difficulty: 1,
    analysis: 'COVID-19被列为乙类传染病，但采取甲类传染病的预防、控制措施。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '高血压患者不需要终身服药。',
    type: 'JUDGE', category: 'PUBLIC', difficulty: 1,
    analysis: '原发性高血压患者通常需要终身服药控制血压，擅自停药可能导致血压反弹和并发症。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
  {
    content: '艾滋病可以通过蚊虫叮咬传播。',
    type: 'JUDGE', category: 'PUBLIC', difficulty: 1,
    analysis: 'HIV不能在蚊虫体内繁殖，蚊虫叮咬不会传播HIV。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
  {
    content: '吸烟是肺癌最主要的危险因素。',
    type: 'JUDGE', category: 'PUBLIC', difficulty: 1,
    analysis: '吸烟是肺癌最重要的危险因素，约80-90%的肺癌与吸烟相关。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '发现传染病疫情时，普通公民没有报告义务。',
    type: 'JUDGE', category: 'PUBLIC', difficulty: 1,
    analysis: '根据《传染病防治法》，任何单位和个人发现传染病病人或疑似传染病病人时，应及时向附近疾控机构或医疗机构报告。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
  {
    content: '糖尿病患者可以随意进食含糖食物。',
    type: 'JUDGE', category: 'PUBLIC', difficulty: 1,
    analysis: '糖尿病患者需要控制总热量摄入，限制含糖食物的摄入，以维持血糖稳定。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
  {
    content: '健康体检可以早期发现疾病，是疾病预防的重要手段。',
    type: 'JUDGE', category: 'PUBLIC', difficulty: 1,
    analysis: '健康体检可以早期发现无症状的疾病，实现早发现、早诊断、早治疗，是疾病预防的重要手段。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '乙肝病毒携带者不能从事餐饮行业。',
    type: 'JUDGE', category: 'PUBLIC', difficulty: 2,
    analysis: '根据国家规定，乙肝病毒携带者（肝功能正常）可以从事餐饮行业，但需遵守卫生规范。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
  {
    content: '突发公共卫生事件发生后，可以根据需要封锁疫区。',
    type: 'JUDGE', category: 'PUBLIC', difficulty: 2,
    analysis: '根据《传染病防治法》，甲类、乙类传染病暴发流行时，县级以上人民政府经批准可以封锁疫区。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '服用抗生素可以治疗病毒性感冒。',
    type: 'JUDGE', category: 'PUBLIC', difficulty: 1,
    analysis: '抗生素（抗菌药物）只能杀灭细菌，对病毒无效。病毒性感冒使用抗生素属于滥用。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
  {
    content: '适量的体育锻炼可以增强免疫力。',
    type: 'JUDGE', category: 'PUBLIC', difficulty: 1,
    analysis: '适量规律的体育锻炼可以增强免疫功能，降低感染风险，但过度运动反而可能抑制免疫功能。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '精神卫生问题不属于公共卫生范畴。',
    type: 'JUDGE', category: 'PUBLIC', difficulty: 2,
    analysis: '精神卫生是公共卫生的重要组成部分，国家基本公共卫生服务项目包含严重精神障碍患者管理。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
  {
    content: '食品添加剂都是有害的，应该完全避免。',
    type: 'JUDGE', category: 'PUBLIC', difficulty: 1,
    analysis: '食品添加剂在规定的使用范围和剂量内是安全的，不是所有食品添加剂都有害。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
  {
    content: '女性怀孕期间应该避免接触猫粪。',
    type: 'JUDGE', category: 'PUBLIC', difficulty: 2,
    analysis: '猫粪可能含有弓形虫，孕妇感染弓形虫可导致胎儿畸形，因此孕妇应避免接触猫粪。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '流行性腮腺炎主要通过血液传播。',
    type: 'JUDGE', category: 'PUBLIC', difficulty: 1,
    analysis: '流行性腮腺炎主要通过呼吸道飞沫传播，不是血液传播。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
  {
    content: '居民健康档案是居民健康状况的资料库，可以记录一生健康状况。',
    type: 'JUDGE', category: 'PUBLIC', difficulty: 1,
    analysis: '居民健康档案是记录居民健康状况的系统性文件，包括个人基本信息、健康体检、重点人群健康管理记录等。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '食物中毒事件发生后，只需要对患者进行治疗即可。',
    type: 'JUDGE', category: 'PUBLIC', difficulty: 1,
    analysis: '食物中毒事件发生后，除治疗患者外，还需要进行流行病学调查、查找中毒原因、封存可疑食品、防止事态扩大。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
  {
    content: '所有类型的病毒性肝炎都可以通过疫苗预防。',
    type: 'JUDGE', category: 'PUBLIC', difficulty: 2,
    analysis: '目前只有甲肝疫苗和乙肝疫苗，丙肝、丁肝、戊肝尚无疫苗。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
  {
    content: '老年人跌倒不是意外，是可以通过预防措施减少的。',
    type: 'JUDGE', category: 'PUBLIC', difficulty: 1,
    analysis: '老年人跌倒是可以预防的，通过改善居家环境、加强锻炼、合理用药、改善视力等措施可以降低跌倒风险。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '职业病一旦发生就无法治愈。',
    type: 'JUDGE', category: 'PUBLIC', difficulty: 2,
    analysis: '部分职业病（如职业性中毒、职业性皮肤病等）经过及时治疗可以痊愈，但部分职业病（如尘肺病）不可逆。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
];

// ==================== 公共卫生 - 案例分析 ====================
const publicCase: SeedQuestion[] = [
  {
    content: '某学校食堂午餐后，陆续有30多名学生出现恶心、呕吐、腹痛、腹泻症状。请问：首先应考虑哪种疾病？',
    type: 'CASE', category: 'PUBLIC', difficulty: 2,
    analysis: '集体就餐后短时间内多人出现胃肠道症状，首先应考虑食物中毒。',
    options: [
      { optionKey: 'A', content: '食物中毒', isCorrect: true },
      { optionKey: 'B', content: '流感', isCorrect: false },
      { optionKey: 'C', content: '手足口病', isCorrect: false },
      { optionKey: 'D', content: '水痘', isCorrect: false },
    ],
  },
  {
    content: '患者，男性，35岁，因反复咳嗽、咳痰、咯血就诊，胸部X线显示肺部有空洞，痰涂片抗酸杆菌阳性。请问：该患者最可能的诊断是？',
    type: 'CASE', category: 'PUBLIC', difficulty: 2,
    analysis: '咳嗽、咳痰、咯血、肺空洞、痰抗酸杆菌阳性，符合活动性肺结核的典型表现。',
    options: [
      { optionKey: 'A', content: '活动性肺结核', isCorrect: true },
      { optionKey: 'B', content: '肺癌', isCorrect: false },
      { optionKey: 'C', content: '肺炎', isCorrect: false },
      { optionKey: 'D', content: '支气管扩张', isCorrect: false },
    ],
  },
  {
    content: '某社区开展老年人健康管理，发现有大量老年人患有高血压但未规律服药。请问：社区医生最应该采取的措施是？',
    type: 'CASE', category: 'PUBLIC', difficulty: 2,
    analysis: '对未规律服药的高血压患者，应加强健康教育，说明规律服药的重要性，提高依从性。',
    options: [
      { optionKey: 'A', content: '加强健康教育，提高服药依从性', isCorrect: true },
      { optionKey: 'B', content: '放弃治疗', isCorrect: false },
      { optionKey: 'C', content: '仅测量血压', isCorrect: false },
      { optionKey: 'D', content: '建议住院', isCorrect: false },
    ],
  },
  {
    content: '患者，女性，6岁，因发热、口腔疱疹、手足皮疹就诊。查体：T 38.5℃，口腔黏膜可见散在疱疹，双手足可见红色斑丘疹。请问：该患者最可能的诊断是？',
    type: 'CASE', category: 'PUBLIC', difficulty: 2,
    analysis: '发热+口腔疱疹+手足皮疹，符合手足口病的典型表现。',
    options: [
      { optionKey: 'A', content: '手足口病', isCorrect: true },
      { optionKey: 'B', content: '麻疹', isCorrect: false },
      { optionKey: 'C', content: '水痘', isCorrect: false },
      { optionKey: 'D', content: '猩红热', isCorrect: false },
    ],
  },
  {
    content: '某工厂发生多名工人同时出现头晕、恶心、呕吐，现场空气中有刺激性气味。请问：首先应如何处理？',
    type: 'CASE', category: 'PUBLIC', difficulty: 2,
    analysis: '疑似职业中毒时，首先应立即将中毒者撤离中毒环境，移至空气新鲜处，再采取后续救治措施。',
    options: [
      { optionKey: 'A', content: '立即撤离中毒环境，移至空气新鲜处', isCorrect: true },
      { optionKey: 'B', content: '继续工作', isCorrect: false },
      { optionKey: 'C', content: '自行服药', isCorrect: false },
      { optionKey: 'D', content: '仅报告不处理', isCorrect: false },
    ],
  },
  {
    content: '患者，男性，42岁，有静脉吸毒史，近期出现不明原因发热、体重下降、口腔白斑。请问：首先应考虑的疾病是？',
    type: 'CASE', category: 'PUBLIC', difficulty: 2,
    analysis: '有静脉吸毒史（HIV高危行为），出现不明原因发热、体重下降、口腔白斑（机会性感染），应首先考虑艾滋病。',
    options: [
      { optionKey: 'A', content: '艾滋病', isCorrect: true },
      { optionKey: 'B', content: '普通感冒', isCorrect: false },
      { optionKey: 'C', content: '肺结核', isCorrect: false },
      { optionKey: 'D', content: '糖尿病', isCorrect: false },
    ],
  },
  {
    content: '某地区发生洪涝灾害后，灾民安置点出现多人腹泻，水样便。请问：最可能的原因是？',
    type: 'CASE', category: 'PUBLIC', difficulty: 2,
    analysis: '洪涝灾害后水源污染，容易导致水源性肠道传染病（如霍乱、细菌性痢疾等）的暴发。',
    options: [
      { optionKey: 'A', content: '水源污染导致的肠道传染病', isCorrect: true },
      { optionKey: 'B', content: '呼吸道感染', isCorrect: false },
      { optionKey: 'C', content: '食物过敏', isCorrect: false },
      { optionKey: 'D', content: '精神因素', isCorrect: false },
    ],
  },
  {
    content: '患者，男性，58岁，有吸烟史30年，每天1包。近期体检发现肺部有结节，医生建议戒烟并定期复查。请问：该患者肺癌的主要危险因素是？',
    type: 'CASE', category: 'PUBLIC', difficulty: 1,
    analysis: '长期吸烟是肺癌最重要的危险因素，约80-90%的肺癌与吸烟相关。',
    options: [
      { optionKey: 'A', content: '长期吸烟', isCorrect: true },
      { optionKey: 'B', content: '年龄', isCorrect: false },
      { optionKey: 'C', content: '遗传', isCorrect: false },
      { optionKey: 'D', content: '饮食', isCorrect: false },
    ],
  },
  {
    content: '某市疾控中心接到报告，某幼儿园出现5例手足口病病例。请问：疾控中心应采取的首要措施是？',
    type: 'CASE', category: 'PUBLIC', difficulty: 2,
    analysis: '出现聚集性手足口病疫情，首要措施是隔离患儿、消毒环境、指导晨检、追踪密切接触者。',
    options: [
      { optionKey: 'A', content: '隔离患儿，消毒环境，加强晨检', isCorrect: true },
      { optionKey: 'B', content: '关闭幼儿园', isCorrect: false },
      { optionKey: 'C', content: '无需处理', isCorrect: false },
      { optionKey: 'D', content: '仅通知家长', isCorrect: false },
    ],
  },
  {
    content: '患者，女性，28岁，孕28周，产检发现乙肝表面抗原阳性。请问：为预防母婴传播，新生儿出生后应如何处理？',
    type: 'CASE', category: 'PUBLIC', difficulty: 2,
    analysis: 'HBsAg阳性母亲的新生儿出生后应在24小时内（最好12小时内）注射乙肝免疫球蛋白和乙肝疫苗。',
    options: [
      { optionKey: 'A', content: '出生后24小时内注射乙肝免疫球蛋白和乙肝疫苗', isCorrect: true },
      { optionKey: 'B', content: '不需处理', isCorrect: false },
      { optionKey: 'C', content: '仅接种乙肝疫苗', isCorrect: false },
      { optionKey: 'D', content: '仅注射乙肝免疫球蛋白', isCorrect: false },
    ],
  },
  {
    content: '某居民反映家中自来水有异味。请问：首先应向哪个部门反映？',
    type: 'CASE', category: 'PUBLIC', difficulty: 1,
    analysis: '自来水水质问题应首先向当地供水单位或卫生监督部门反映，由专业部门检测处理。',
    options: [
      { optionKey: 'A', content: '当地供水单位或卫生监督部门', isCorrect: true },
      { optionKey: 'B', content: '物业管理', isCorrect: false },
      { optionKey: 'C', content: '消防部门', isCorrect: false },
      { optionKey: 'D', content: '公安部门', isCorrect: false },
    ],
  },
  {
    content: '患者，男性，70岁，既往有高血压、糖尿病史，近期出现一侧肢体无力、口角歪斜。请问：首先应考虑的疾病是？',
    type: 'CASE', category: 'PUBLIC', difficulty: 2,
    analysis: '老年人有高血压、糖尿病等脑血管病危险因素，突发一侧肢体无力、口角歪斜，应首先考虑脑卒中。',
    options: [
      { optionKey: 'A', content: '脑卒中', isCorrect: true },
      { optionKey: 'B', content: '面神经炎', isCorrect: false },
      { optionKey: 'C', content: '癫痫', isCorrect: false },
      { optionKey: 'D', content: '低血糖', isCorrect: false },
    ],
  },
  {
    content: '某社区医生发现辖区内糖尿病患者血糖控制率很低。请问：最有效的干预措施是？',
    type: 'CASE', category: 'PUBLIC', difficulty: 2,
    analysis: '提高血糖控制率需要综合干预：健康教育、饮食指导、运动指导、规律服药、定期随访等。',
    options: [
      { optionKey: 'A', content: '建立综合管理方案，包括健康教育、饮食运动指导和定期随访', isCorrect: true },
      { optionKey: 'B', content: '仅增加药物剂量', isCorrect: false },
      { optionKey: 'C', content: '建议住院', isCorrect: false },
      { optionKey: 'D', content: '不再管理', isCorrect: false },
    ],
  },
  {
    content: '某地发生地震后，面临的主要公共卫生问题不包括？',
    type: 'CASE', category: 'PUBLIC', difficulty: 2,
    analysis: '地震后主要公共卫生问题：饮水安全、食品安全、环境卫生、传染病防控、医疗救治等。美容需求不属于公共卫生问题。',
    options: [
      { optionKey: 'A', content: '饮水安全', isCorrect: false },
      { optionKey: 'B', content: '传染病防控', isCorrect: false },
      { optionKey: 'C', content: '美容需求', isCorrect: true },
      { optionKey: 'D', content: '环境卫生', isCorrect: false },
    ],
  },
  {
    content: '患者，男性，25岁，因发热、皮疹就诊。查体：T 39℃，面部及躯干出现红色斑丘疹，耳后淋巴结肿大。请问：最可能的诊断是？',
    type: 'CASE', category: 'PUBLIC', difficulty: 2,
    analysis: '发热+皮疹+耳后淋巴结肿大，符合风疹的典型表现。',
    options: [
      { optionKey: 'A', content: '风疹', isCorrect: true },
      { optionKey: 'B', content: '麻疹', isCorrect: false },
      { optionKey: 'C', content: '水痘', isCorrect: false },
      { optionKey: 'D', content: '猩红热', isCorrect: false },
    ],
  },
  {
    content: '某社区开展健康教育讲座，到场居民寥寥无几。请问：改善措施不包括？',
    type: 'CASE', category: 'PUBLIC', difficulty: 2,
    analysis: '提高居民参与度的措施：选择合适时间地点、内容贴近需求、多种形式宣传、提供小礼品等。强制参加不可取。',
    options: [
      { optionKey: 'A', content: '选择周末或晚上合适时间', isCorrect: false },
      { optionKey: 'B', content: '内容贴近居民需求', isCorrect: false },
      { optionKey: 'C', content: '强制要求居民参加', isCorrect: true },
      { optionKey: 'D', content: '多种形式宣传通知', isCorrect: false },
    ],
  },
  {
    content: '某工厂工人体检发现多名工人血铅水平超标。请问：首先应采取的预防措施是？',
    type: 'CASE', category: 'PUBLIC', difficulty: 3,
    analysis: '职业性铅中毒的预防，首先应控制作业环境中的铅浓度，加强通风排毒，同时加强个人防护。',
    options: [
      { optionKey: 'A', content: '改善作业环境通风排毒，加强个人防护', isCorrect: true },
      { optionKey: 'B', content: '仅给工人发口罩', isCorrect: false },
      { optionKey: 'C', content: '继续观察', isCorrect: false },
      { optionKey: 'D', content: '解雇所有工人', isCorrect: false },
    ],
  },
  {
    content: '患者，女性，45岁，因"咳嗽、胸痛2周"就诊，胸部CT显示右肺上叶有磨玻璃样阴影。患者有养鸽子爱好。请问：最可能的诊断是？',
    type: 'CASE', category: 'PUBLIC', difficulty: 3,
    analysis: '有鸽子接触史+肺部磨玻璃样阴影，应考虑隐球菌感染（鸽子粪中隐球菌）或过敏性肺炎。',
    options: [
      { optionKey: 'A', content: '肺隐球菌病', isCorrect: true },
      { optionKey: 'B', content: '肺结核', isCorrect: false },
      { optionKey: 'C', content: '肺癌', isCorrect: false },
      { optionKey: 'D', content: '普通肺炎', isCorrect: false },
    ],
  },
  {
    content: '某社区卫生服务中心接到上级通知，需对辖区内65岁以上老年人进行免费体检。请问：该服务属于？',
    type: 'CASE', category: 'PUBLIC', difficulty: 1,
    analysis: '65岁以上老年人健康管理是国家基本公共卫生服务项目之一，包括年度健康体检。',
    options: [
      { optionKey: 'A', content: '国家基本公共卫生服务项目', isCorrect: true },
      { optionKey: 'B', content: '有偿服务', isCorrect: false },
      { optionKey: 'C', content: '商业保险服务', isCorrect: false },
      { optionKey: 'D', content: '自愿项目', isCorrect: false },
    ],
  },
  {
    content: '某患者在接种疫苗后10分钟出现面色苍白、呼吸困难、血压下降。请问：该患者发生了？',
    type: 'CASE', category: 'PUBLIC', difficulty: 2,
    analysis: '接种疫苗后短时间内出现面色苍白、呼吸困难、血压下降，符合过敏性休克的典型表现，需立即抢救。',
    options: [
      { optionKey: 'A', content: '过敏性休克', isCorrect: true },
      { optionKey: 'B', content: '晕针', isCorrect: false },
      { optionKey: 'C', content: '普通过敏反应', isCorrect: false },
      { optionKey: 'D', content: '精神紧张', isCorrect: false },
    ],
  },
];

// ==================== 三基综合 - 单选题 ====================
const sanjiSingle: SeedQuestion[] = [
  {
    content: '正常成人安静状态下呼吸频率为？',
    type: 'SINGLE', category: 'SANJIZONGHE', difficulty: 1,
    analysis: '正常成人安静状态下呼吸频率为16-20次/分。',
    options: [
      { optionKey: 'A', content: '10-14次/分', isCorrect: false },
      { optionKey: 'B', content: '16-20次/分', isCorrect: true },
      { optionKey: 'C', content: '22-26次/分', isCorrect: false },
      { optionKey: 'D', content: '28-32次/分', isCorrect: false },
    ],
  },
  {
    content: '正常成人安静状态下心率范围为？',
    type: 'SINGLE', category: 'SANJIZONGHE', difficulty: 1,
    analysis: '正常成人安静状态下心率为60-100次/分。',
    options: [
      { optionKey: 'A', content: '40-60次/分', isCorrect: false },
      { optionKey: 'B', content: '60-100次/分', isCorrect: true },
      { optionKey: 'C', content: '100-120次/分', isCorrect: false },
      { optionKey: 'D', content: '120-140次/分', isCorrect: false },
    ],
  },
  {
    content: '正常成人血压范围是？',
    type: 'SINGLE', category: 'SANJIZONGHE', difficulty: 1,
    analysis: '正常成人血压：收缩压90-139mmHg，舒张压60-89mmHg。理想血压<120/80mmHg。',
    options: [
      { optionKey: 'A', content: '收缩压<140mmHg，舒张压<90mmHg', isCorrect: true },
      { optionKey: 'B', content: '收缩压<150mmHg，舒张压<100mmHg', isCorrect: false },
      { optionKey: 'C', content: '收缩压<120mmHg，舒张压<70mmHg', isCorrect: false },
      { optionKey: 'D', content: '收缩压<160mmHg，舒张压<110mmHg', isCorrect: false },
    ],
  },
  {
    content: '心肺复苏（CPR）胸外按压与人工呼吸的比例是？',
    type: 'SINGLE', category: 'SANJIZONGHE', difficulty: 1,
    analysis: '成人单人CPR按压与通气比为30:2，无论单人或双人操作。',
    options: [
      { optionKey: 'A', content: '15:2', isCorrect: false },
      { optionKey: 'B', content: '30:2', isCorrect: true },
      { optionKey: 'C', content: '15:1', isCorrect: false },
      { optionKey: 'D', content: '30:1', isCorrect: false },
    ],
  },
  {
    content: '正常成人每日尿量约为？',
    type: 'SINGLE', category: 'SANJIZONGHE', difficulty: 1,
    analysis: '正常成人每日尿量1000-2000ml，平均约1500ml。',
    options: [
      { optionKey: 'A', content: '500-800ml', isCorrect: false },
      { optionKey: 'B', content: '1000-2000ml', isCorrect: true },
      { optionKey: 'C', content: '2500-3000ml', isCorrect: false },
      { optionKey: 'D', content: '3000-4000ml', isCorrect: false },
    ],
  },
  {
    content: '高热患者体温超过多少度需要物理降温？',
    type: 'SINGLE', category: 'SANJIZONGHE', difficulty: 1,
    analysis: '体温超过39℃应采取物理降温措施，如冰敷、温水擦浴等。',
    options: [
      { optionKey: 'A', content: '37.5℃', isCorrect: false },
      { optionKey: 'B', content: '38℃', isCorrect: false },
      { optionKey: 'C', content: '39℃', isCorrect: true },
      { optionKey: 'D', content: '40℃', isCorrect: false },
    ],
  },
  {
    content: '输液反应的常见原因不包括？',
    type: 'SINGLE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '输液反应常见原因：药物不纯、液体污染、输液速度过快、患者过敏体质等。输液时间在合理范围内不会引起输液反应。',
    options: [
      { optionKey: 'A', content: '药物不纯', isCorrect: false },
      { optionKey: 'B', content: '液体污染', isCorrect: false },
      { optionKey: 'C', content: '输液速度过快', isCorrect: false },
      { optionKey: 'D', content: '输液时间在2小时内', isCorrect: true },
    ],
  },
  {
    content: '青霉素皮试阳性的判断标准是？',
    type: 'SINGLE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '青霉素皮试阳性：皮丘增大，直径>1cm，红晕直径>2cm，周围有伪足，伴痒感。',
    options: [
      { optionKey: 'A', content: '皮丘直径>1cm，红晕>2cm', isCorrect: true },
      { optionKey: 'B', content: '皮丘直径>0.5cm', isCorrect: false },
      { optionKey: 'C', content: '仅有红晕', isCorrect: false },
      { optionKey: 'D', content: '无任何反应', isCorrect: false },
    ],
  },
  {
    content: '无菌包打开后的有效期为？',
    type: 'SINGLE', category: 'SANJIZONGHE', difficulty: 1,
    analysis: '无菌包打开后有效期为24小时，超过24小时需重新灭菌。',
    options: [
      { optionKey: 'A', content: '4小时', isCorrect: false },
      { optionKey: 'B', content: '12小时', isCorrect: false },
      { optionKey: 'C', content: '24小时', isCorrect: true },
      { optionKey: 'D', content: '48小时', isCorrect: false },
    ],
  },
  {
    content: '肌肉注射时，臀大肌注射定位的十字法描述正确的是？',
    type: 'SINGLE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '十字法：从臀裂顶点向左（或右）划一水平线，从髂嵴最高点向下作一垂线，将臀部分为四个象限，外上象限为注射区。',
    options: [
      { optionKey: 'A', content: '外上象限', isCorrect: true },
      { optionKey: 'B', content: '外下象限', isCorrect: false },
      { optionKey: 'C', content: '内上象限', isCorrect: false },
      { optionKey: 'D', content: '内下象限', isCorrect: false },
    ],
  },
  {
    content: '下列哪项不属于生命体征？',
    type: 'SINGLE', category: 'SANJIZONGHE', difficulty: 1,
    analysis: '生命体征包括体温、脉搏、呼吸、血压。体重不属于生命体征。',
    options: [
      { optionKey: 'A', content: '体温', isCorrect: false },
      { optionKey: 'B', content: '体重', isCorrect: true },
      { optionKey: 'C', content: '脉搏', isCorrect: false },
      { optionKey: 'D', content: '血压', isCorrect: false },
    ],
  },
  {
    content: '静脉输液时，成人常用的滴速为？',
    type: 'SINGLE', category: 'SANJIZONGHE', difficulty: 1,
    analysis: '成人常规静脉输液滴速为40-60滴/分，老年人和心肺功能不全者应减慢。',
    options: [
      { optionKey: 'A', content: '20-30滴/分', isCorrect: false },
      { optionKey: 'B', content: '40-60滴/分', isCorrect: true },
      { optionKey: 'C', content: '80-100滴/分', isCorrect: false },
      { optionKey: 'D', content: '100-120滴/分', isCorrect: false },
    ],
  },
  {
    content: '导尿术时，女性患者导尿管插入深度为？',
    type: 'SINGLE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '女性患者导尿管插入4-6cm，见尿液流出后再插入1-2cm。男性患者插入20-22cm。',
    options: [
      { optionKey: 'A', content: '2-3cm', isCorrect: false },
      { optionKey: 'B', content: '4-6cm', isCorrect: true },
      { optionKey: 'C', content: '10-12cm', isCorrect: false },
      { optionKey: 'D', content: '20-22cm', isCorrect: false },
    ],
  },
  {
    content: '心电监护时，V1导联的安放位置是？',
    type: 'SINGLE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: 'V1导联安放在胸骨右缘第4肋间。',
    options: [
      { optionKey: 'A', content: '胸骨右缘第4肋间', isCorrect: true },
      { optionKey: 'B', content: '胸骨左缘第4肋间', isCorrect: false },
      { optionKey: 'C', content: '左锁骨中线第5肋间', isCorrect: false },
      { optionKey: 'D', content: '左腋前线第5肋间', isCorrect: false },
    ],
  },
  {
    content: '休克患者应采取的体位是？',
    type: 'SINGLE', category: 'SANJIZONGHE', difficulty: 1,
    analysis: '休克患者应采取中凹卧位（休克卧位），即头和躯干抬高20-30°，下肢抬高15-20°，以增加回心血量。',
    options: [
      { optionKey: 'A', content: '中凹卧位（头抬高20-30°，下肢抬高15-20°）', isCorrect: true },
      { optionKey: 'B', content: '平卧位', isCorrect: false },
      { optionKey: 'C', content: '半卧位', isCorrect: false },
      { optionKey: 'D', content: '端坐位', isCorrect: false },
    ],
  },
  {
    content: '下列哪项属于无菌技术操作原则？',
    type: 'SINGLE', category: 'SANJIZONGHE', difficulty: 1,
    analysis: '无菌技术操作原则包括：操作环境清洁、无菌物品与非无菌物品分开放置、操作中手臂不可跨越无菌区等。',
    options: [
      { optionKey: 'A', content: '无菌物品与非无菌物品分开放置', isCorrect: true },
      { optionKey: 'B', content: '无菌物品和非无菌物品可混放', isCorrect: false },
      { optionKey: 'C', content: '取用无菌物品时可用手直接接触', isCorrect: false },
      { optionKey: 'D', content: '无菌操作可在任何环境下进行', isCorrect: false },
    ],
  },
  {
    content: '下列哪项不属于急救"五定"的内容？',
    type: 'SINGLE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '急救物品管理"五定"：定数量品种、定点安置、定人保管、定期消毒灭菌、定期检查维修。',
    options: [
      { optionKey: 'A', content: '定数量品种', isCorrect: false },
      { optionKey: 'B', content: '定人保管', isCorrect: false },
      { optionKey: 'C', content: '定期消毒灭菌', isCorrect: false },
      { optionKey: 'D', content: '定期更换品牌', isCorrect: true },
    ],
  },
  {
    content: '护士在给患者做口腔护理时，发现口腔黏膜有白色膜状物，最可能是？',
    type: 'SINGLE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '口腔黏膜白色膜状物（不易擦去），最常见于真菌感染（鹅口疮），常见于长期使用抗生素或免疫低下患者。',
    options: [
      { optionKey: 'A', content: '真菌感染（鹅口疮）', isCorrect: true },
      { optionKey: 'B', content: '食物残渣', isCorrect: false },
      { optionKey: 'C', content: '口腔溃疡', isCorrect: false },
      { optionKey: 'D', content: '正常现象', isCorrect: false },
    ],
  },
  {
    content: '鼻饲法的禁忌症不包括？',
    type: 'SINGLE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '鼻饲禁忌症：食管胃底静脉曲张、食管梗阻、严重颌面部外伤等。普通昏迷患者不是禁忌症。',
    options: [
      { optionKey: 'A', content: '食管胃底静脉曲张', isCorrect: false },
      { optionKey: 'B', content: '食管梗阻', isCorrect: false },
      { optionKey: 'C', content: '普通昏迷', isCorrect: true },
      { optionKey: 'D', content: '严重颌面部外伤', isCorrect: false },
    ],
  },
  {
    content: '压疮的好发部位不包括？',
    type: 'SINGLE', category: 'SANJIZONGHE', difficulty: 1,
    analysis: '压疮好发于骨隆突处，如骶尾部、髋部、足跟、肘部等。腹部不是压疮好发部位。',
    options: [
      { optionKey: 'A', content: '骶尾部', isCorrect: false },
      { optionKey: 'B', content: '足跟', isCorrect: false },
      { optionKey: 'C', content: '腹部', isCorrect: true },
      { optionKey: 'D', content: '肘部', isCorrect: false },
    ],
  },
];

// ==================== 三基综合 - 多选题 ====================
const sanjiMultiple: SeedQuestion[] = [
  {
    content: '下列哪些属于生命体征？',
    type: 'MULTIPLE', category: 'SANJIZONGHE', difficulty: 1,
    analysis: '生命体征包括体温、脉搏、呼吸、血压。',
    options: [
      { optionKey: 'A', content: '体温', isCorrect: true },
      { optionKey: 'B', content: '脉搏', isCorrect: true },
      { optionKey: 'C', content: '呼吸', isCorrect: true },
      { optionKey: 'D', content: '血压', isCorrect: true },
      { optionKey: 'E', content: '体重', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于无菌技术操作的基本原则？',
    type: 'MULTIPLE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '无菌技术操作原则：环境清洁、操作中手臂不可跨越无菌区、无菌物品一经取出不得放回、无菌物品疑有污染不得使用。',
    options: [
      { optionKey: 'A', content: '操作环境应清洁', isCorrect: true },
      { optionKey: 'B', content: '手臂不可跨越无菌区', isCorrect: true },
      { optionKey: 'C', content: '无菌物品取出后不得放回', isCorrect: true },
      { optionKey: 'D', content: '疑似污染的物品不得使用', isCorrect: true },
      { optionKey: 'E', content: '无菌物品可以随意放置', isCorrect: false },
    ],
  },
  {
    content: '下列哪些是给药的"三查七对"中的"三查"？',
    type: 'MULTIPLE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '三查：操作前查、操作中查、操作后查。七对：对床号、姓名、药名、剂量、浓度、时间、用法。',
    options: [
      { optionKey: 'A', content: '操作前查', isCorrect: true },
      { optionKey: 'B', content: '操作中查', isCorrect: true },
      { optionKey: 'C', content: '操作后查', isCorrect: true },
      { optionKey: 'D', content: '发药前查', isCorrect: false },
      { optionKey: 'E', content: '发药后查', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于压疮发生的原因？',
    type: 'MULTIPLE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '压疮发生原因：压力、剪切力、摩擦力、潮湿、营养不良等。',
    options: [
      { optionKey: 'A', content: '局部持续受压', isCorrect: true },
      { optionKey: 'B', content: '剪切力', isCorrect: true },
      { optionKey: 'C', content: '皮肤潮湿', isCorrect: true },
      { optionKey: 'D', content: '营养不良', isCorrect: true },
      { optionKey: 'E', content: '适当翻身', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于输液反应的种类？',
    type: 'MULTIPLE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '输液反应包括：发热反应、过敏反应、肺水肿、静脉炎、空气栓塞等。',
    options: [
      { optionKey: 'A', content: '发热反应', isCorrect: true },
      { optionKey: 'B', content: '过敏反应', isCorrect: true },
      { optionKey: 'C', content: '急性肺水肿', isCorrect: true },
      { optionKey: 'D', content: '静脉炎', isCorrect: true },
      { optionKey: 'E', content: '正常反应', isCorrect: false },
    ],
  },
  {
    content: '下列哪些是心肺复苏的有效指征？',
    type: 'MULTIPLE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: 'CPR有效指征：大动脉搏动恢复、面色口唇转红润、瞳孔缩小、自主呼吸恢复、意识恢复。',
    options: [
      { optionKey: 'A', content: '大动脉搏动可触及', isCorrect: true },
      { optionKey: 'B', content: '面色口唇转红润', isCorrect: true },
      { optionKey: 'C', content: '瞳孔缩小', isCorrect: true },
      { optionKey: 'D', content: '自主呼吸恢复', isCorrect: true },
      { optionKey: 'E', content: '瞳孔散大', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于疼痛评估的内容？',
    type: 'MULTIPLE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '疼痛评估包括：疼痛部位、性质、程度（评分）、持续时间、诱发和缓解因素、伴随症状等。',
    options: [
      { optionKey: 'A', content: '疼痛部位', isCorrect: true },
      { optionKey: 'B', content: '疼痛性质', isCorrect: true },
      { optionKey: 'C', content: '疼痛程度', isCorrect: true },
      { optionKey: 'D', content: '疼痛持续时间', isCorrect: true },
      { optionKey: 'E', content: '疼痛诱发因素', isCorrect: true },
    ],
  },
  {
    content: '下列哪些属于手术前患者的护理措施？',
    type: 'MULTIPLE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '术前护理包括：心理护理、皮肤准备、胃肠道准备、术前用药、禁食禁饮等。',
    options: [
      { optionKey: 'A', content: '心理护理', isCorrect: true },
      { optionKey: 'B', content: '皮肤准备', isCorrect: true },
      { optionKey: 'C', content: '胃肠道准备', isCorrect: true },
      { optionKey: 'D', content: '术前禁食禁饮', isCorrect: true },
      { optionKey: 'E', content: '术后立即进食', isCorrect: false },
    ],
  },
  {
    content: '下列哪些是预防跌倒的护理措施？',
    type: 'MULTIPLE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '预防跌倒措施：使用床栏、保持地面干燥、穿着合适鞋袜、呼叫铃放在可及处、夜间留灯等。',
    options: [
      { optionKey: 'A', content: '使用床栏', isCorrect: true },
      { optionKey: 'B', content: '保持地面干燥', isCorrect: true },
      { optionKey: 'C', content: '穿着合适的鞋袜', isCorrect: true },
      { optionKey: 'D', content: '呼叫铃放在患者可及处', isCorrect: true },
      { optionKey: 'E', content: '夜间保持黑暗', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于临床护理记录的要求？',
    type: 'MULTIPLE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '护理记录要求：及时、准确、完整、客观、规范。',
    options: [
      { optionKey: 'A', content: '及时', isCorrect: true },
      { optionKey: 'B', content: '准确', isCorrect: true },
      { optionKey: 'C', content: '完整', isCorrect: true },
      { optionKey: 'D', content: '客观', isCorrect: true },
      { optionKey: 'E', content: '主观臆断', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于给药途径？',
    type: 'MULTIPLE', category: 'SANJIZONGHE', difficulty: 1,
    analysis: '给药途径包括：口服、舌下含服、皮下注射、肌肉注射、静脉注射、吸入等。',
    options: [
      { optionKey: 'A', content: '口服', isCorrect: true },
      { optionKey: 'B', content: '皮下注射', isCorrect: true },
      { optionKey: 'C', content: '舌下含服', isCorrect: true },
      { optionKey: 'D', content: '静脉注射', isCorrect: true },
      { optionKey: 'E', content: '外用', isCorrect: true },
    ],
  },
  {
    content: '下列哪些属于高热患者的护理措施？',
    type: 'MULTIPLE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '高热护理措施：物理降温、多饮水、观察体温变化、口腔护理、保持皮肤干燥等。',
    options: [
      { optionKey: 'A', content: '物理降温', isCorrect: true },
      { optionKey: 'B', content: '多饮水', isCorrect: true },
      { optionKey: 'C', content: '密切观察体温变化', isCorrect: true },
      { optionKey: 'D', content: '口腔护理', isCorrect: true },
      { optionKey: 'E', content: '加盖厚被', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于导尿术的适应症？',
    type: 'MULTIPLE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '导尿术适应症：尿潴留、记录尿量、留取无菌尿标本、术前准备、尿失禁护理等。',
    options: [
      { optionKey: 'A', content: '尿潴留', isCorrect: true },
      { optionKey: 'B', content: '准确记录24小时尿量', isCorrect: true },
      { optionKey: 'C', content: '留取无菌尿标本', isCorrect: true },
      { optionKey: 'D', content: '盆腔手术前准备', isCorrect: true },
      { optionKey: 'E', content: '患者自行要求', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于口腔护理的目的？',
    type: 'MULTIPLE', category: 'SANJIZONGHE', difficulty: 1,
    analysis: '口腔护理目的：保持口腔清洁、去除口臭、预防口腔感染、观察口腔黏膜变化、增进舒适。',
    options: [
      { optionKey: 'A', content: '保持口腔清洁', isCorrect: true },
      { optionKey: 'B', content: '去除口臭', isCorrect: true },
      { optionKey: 'C', content: '预防口腔感染', isCorrect: true },
      { optionKey: 'D', content: '观察口腔黏膜变化', isCorrect: true },
      { optionKey: 'E', content: '治疗口腔溃疡', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于隔离区域的划分？',
    type: 'MULTIPLE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '隔离区域分为：清洁区、半污染区、污染区。',
    options: [
      { optionKey: 'A', content: '清洁区', isCorrect: true },
      { optionKey: 'B', content: '半污染区', isCorrect: true },
      { optionKey: 'C', content: '污染区', isCorrect: true },
      { optionKey: 'D', content: '无菌区', isCorrect: false },
      { optionKey: 'E', content: '手术区', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于肌内注射的常用部位？',
    type: 'MULTIPLE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '常用肌内注射部位：臀大肌、臀中肌、臀小肌、股外侧肌、上臂三角肌。',
    options: [
      { optionKey: 'A', content: '臀大肌', isCorrect: true },
      { optionKey: 'B', content: '臀中肌', isCorrect: true },
      { optionKey: 'C', content: '股外侧肌', isCorrect: true },
      { optionKey: 'D', content: '上臂三角肌', isCorrect: true },
      { optionKey: 'E', content: '前臂', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于护理程序的基本步骤？',
    type: 'MULTIPLE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '护理程序包括：护理评估、护理诊断、护理计划、护理实施、护理评价五个步骤。',
    options: [
      { optionKey: 'A', content: '护理评估', isCorrect: true },
      { optionKey: 'B', content: '护理诊断', isCorrect: true },
      { optionKey: 'C', content: '护理计划', isCorrect: true },
      { optionKey: 'D', content: '护理实施', isCorrect: true },
      { optionKey: 'E', content: '护理评价', isCorrect: true },
    ],
  },
  {
    content: '下列哪些属于输液速度的调节因素？',
    type: 'MULTIPLE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '输液速度调节需考虑：患者年龄、病情、药物性质、心肺功能、输液目的等。',
    options: [
      { optionKey: 'A', content: '患者年龄', isCorrect: true },
      { optionKey: 'B', content: '病情', isCorrect: true },
      { optionKey: 'C', content: '药物性质', isCorrect: true },
      { optionKey: 'D', content: '心肺功能', isCorrect: true },
      { optionKey: 'E', content: '皮肤颜色', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于静脉采血的注意事项？',
    type: 'MULTIPLE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '静脉采血注意事项：严格执行无菌操作、选择合适的血管、止血带绑扎时间不超过1分钟、采血后按压穿刺点、标本及时送检。',
    options: [
      { optionKey: 'A', content: '严格执行无菌操作', isCorrect: true },
      { optionKey: 'B', content: '止血带绑扎时间不超过1分钟', isCorrect: true },
      { optionKey: 'C', content: '采血后按压穿刺点', isCorrect: true },
      { optionKey: 'D', content: '标本及时送检', isCorrect: true },
      { optionKey: 'E', content: '可以反复穿刺同一血管', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于分级护理的内容？',
    type: 'MULTIPLE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '分级护理分为：特级护理、一级护理、二级护理、三级护理，根据病情轻重确定护理级别。',
    options: [
      { optionKey: 'A', content: '特级护理', isCorrect: true },
      { optionKey: 'B', content: '一级护理', isCorrect: true },
      { optionKey: 'C', content: '二级护理', isCorrect: true },
      { optionKey: 'D', content: '三级护理', isCorrect: true },
      { optionKey: 'E', content: 'VIP护理', isCorrect: false },
    ],
  },
];

// ==================== 三基综合 - 判断题 ====================
const sanjiJudge: SeedQuestion[] = [
  {
    content: '正常成人安静状态下呼吸频率为16-20次/分。',
    type: 'JUDGE', category: 'SANJIZONGHE', difficulty: 1,
    analysis: '正常成人安静状态下呼吸频率为16-20次/分，该说法正确。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '测量血压时袖带过松会导致测得血压值偏高。',
    type: 'JUDGE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '袖带过松使有效宽度变窄，需要更高的压力才能阻断血流，导致测得血压值偏高。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '无菌物品一经取出无菌包后，即使未使用也不可放回。',
    type: 'JUDGE', category: 'SANJIZONGHE', difficulty: 1,
    analysis: '无菌物品取出后视为已被污染，不得放回无菌容器内，该说法正确。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '心肺复苏时胸外按压与人工呼吸的比例为15:2。',
    type: 'JUDGE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '最新CPR指南推荐按压与通气比例为30:2，而非15:2，该说法错误。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
  {
    content: '患者发生青霉素过敏性休克时，首选药物是肾上腺素。',
    type: 'JUDGE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '青霉素过敏性休克时首选肾上腺素0.5-1mg皮下或肌肉注射，该说法正确。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '为患者进行口腔护理时，昏迷患者应使用漱口水漱口。',
    type: 'JUDGE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '昏迷患者禁止漱口，以防止误吸和窒息，应使用棉球蘸漱口水进行擦拭。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
  {
    content: '输液速度应根据患者年龄、病情、药物性质等因素进行调节。',
    type: 'JUDGE', category: 'SANJIZONGHE', difficulty: 1,
    analysis: '输液速度需要根据多种因素综合调节，包括年龄、病情、药物性质和心肺功能等。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '氧气吸入时，急性肺水肿患者应给予高流量吸氧。',
    type: 'JUDGE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '急性肺水肿患者需高流量吸氧（6-8L/min），并可经20%-30%乙醇湿化以降低肺泡泡沫表面张力。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '皮内注射时，针头与皮肤呈5°角刺入。',
    type: 'JUDGE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '皮内注射时针头斜面向上，与皮肤呈5°角刺入皮内，注入药液0.1ml形成皮丘。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '导尿术操作中，女性患者初次消毒应从上到下、由外向内进行。',
    type: 'JUDGE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '女性导尿初次消毒应从上到下、由外向内；再次消毒应从上到下、由内向外。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '糖尿病患者发生低血糖时，应立即给予胰岛素注射。',
    type: 'JUDGE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '低血糖时应立即补充糖分（如口服葡萄糖或含糖饮料），而非注射胰岛素，胰岛素会加重低血糖。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
  {
    content: '为预防压疮，卧床患者应每2小时翻身一次。',
    type: 'JUDGE', category: 'SANJIZONGHE', difficulty: 1,
    analysis: '预防压疮的常规措施包括每2小时协助患者翻身一次，减轻局部组织长期受压。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '鼻饲患者每次灌注食物前应先检查胃管是否在胃内。',
    type: 'JUDGE', category: 'SANJIZONGHE', difficulty: 1,
    analysis: '鼻饲前必须确认胃管在胃内，可通过抽吸胃液、听诊气过水声或将胃管末端放入水中观察有无气泡等方法确认。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '肌肉注射时，进针的深度应越深越好。',
    type: 'JUDGE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '肌肉注射进针深度约为针头的2/3，不宜过深以防针头折断或伤及神经血管，应留置少许在外以便处理意外。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
  {
    content: '护理记录应遵循客观、真实、准确、及时、完整的原则。',
    type: 'JUDGE', category: 'SANJIZONGHE', difficulty: 1,
    analysis: '护理记录的书写原则要求客观、真实、准确、及时、完整，具有法律效力。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '静脉输液中发现空气栓塞时，应立即让患者取右侧卧位。',
    type: 'JUDGE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '发生空气栓塞时应立即让患者取左侧卧位并头低足高位，使空气聚集于右心房顶部，避免阻塞肺动脉入口。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
  {
    content: '为患者测量体温时，腋下测温需将体温计夹紧并放置5分钟。',
    type: 'JUDGE', category: 'SANJIZONGHE', difficulty: 1,
    analysis: '腋下测温需擦干腋窝汗液，将体温计汞端放于腋窝深处并夹紧，测量时间5-10分钟。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '为患者进行物理降温时，酒精擦浴时酒精浓度为25%-35%。',
    type: 'JUDGE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '酒精擦浴时酒精浓度为25%-35%，温度为32-34℃，该说法正确。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '气管切开患者的吸痰操作中，每次吸痰时间应不超过15秒。',
    type: 'JUDGE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '每次吸痰时间应不超过15秒，以免导致缺氧，连续吸痰间隔应不少于3分钟。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '输血前必须由两名医护人员共同核对患者信息和血液制品信息。',
    type: 'JUDGE', category: 'SANJIZONGHE', difficulty: 1,
    analysis: '输血安全要求必须双人核对：患者姓名、床号、住院号、血型、交叉配血结果、血液有效期等。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
];

// ==================== 三基综合 - 案例分析 ====================
const sanjiCase: SeedQuestion[] = [
  {
    content: '患者，男性，68岁，因"突发胸痛2小时"入院。查体：血压90/60mmHg，心率110次/分，心电图显示ST段抬高。请问：该患者最可能的诊断是什么？',
    type: 'CASE', category: 'SANJIZONGHE', difficulty: 3,
    analysis: '老年男性，突发胸痛+心电图ST段抬高+低血压休克表现，最可能的诊断为急性心肌梗死合并心源性休克。',
    options: [
      { optionKey: 'A', content: '急性心肌梗死', isCorrect: true },
      { optionKey: 'B', content: '主动脉夹层', isCorrect: false },
      { optionKey: 'C', content: '急性肺栓塞', isCorrect: false },
      { optionKey: 'D', content: '急性心包炎', isCorrect: false },
    ],
  },
  {
    content: '患者，女，25岁，青霉素皮试后5分钟出现全身皮疹、喉头水肿、呼吸困难，血压70/40mmHg。护士应首先采取的措施是？',
    type: 'CASE', category: 'SANJIZONGHE', difficulty: 3,
    analysis: '青霉素过敏性休克的首选抢救措施是立即注射肾上腺素0.5-1mg，同时吸氧、建立静脉通路、观察生命体征。',
    options: [
      { optionKey: 'A', content: '立即注射肾上腺素', isCorrect: true },
      { optionKey: 'B', content: '立即注射地塞米松', isCorrect: false },
      { optionKey: 'C', content: '先吸氧观察', isCorrect: false },
      { optionKey: 'D', content: '立即转送ICU', isCorrect: false },
    ],
  },
  {
    content: '患者，男性，76岁，长期卧床，骶尾部出现3cm×4cm皮肤破溃，深达皮下组织，有少量渗液。该压疮属于第几期？',
    type: 'CASE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '根据NPUAP分期，深达皮下组织、有破溃和渗液但未达筋膜和骨，属于Ⅲ期压疮（全层皮肤缺损）。',
    options: [
      { optionKey: 'A', content: 'Ⅰ期', isCorrect: false },
      { optionKey: 'B', content: 'Ⅱ期', isCorrect: false },
      { optionKey: 'C', content: 'Ⅲ期', isCorrect: true },
      { optionKey: 'D', content: 'Ⅳ期', isCorrect: false },
    ],
  },
  {
    content: '患者，女，58岁，2型糖尿病病史10年，晨起出现心慌、出冷汗、手抖，血糖2.8mmol/L。护士应给予的处理是？',
    type: 'CASE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '低血糖（血糖≤3.9mmol/L）且有症状时，轻者口服糖水或含糖食物；该患者血糖2.8mmol/L且有交感神经症状，应立即补充葡萄糖。',
    options: [
      { optionKey: 'A', content: '立即口服葡萄糖或含糖饮料', isCorrect: true },
      { optionKey: 'B', content: '立即皮下注射胰岛素', isCorrect: false },
      { optionKey: 'C', content: '嘱患者卧床休息', isCorrect: false },
      { optionKey: 'D', content: '立即给予抗生素', isCorrect: false },
    ],
  },
  {
    content: '患者，男，30岁，因溺水导致心跳呼吸骤停被救起。现场急救时，胸外按压的频率应为？',
    type: 'CASE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '最新CPR指南推荐胸外按压频率为100-120次/分，按压深度5-6cm。',
    options: [
      { optionKey: 'A', content: '60-80次/分', isCorrect: false },
      { optionKey: 'B', content: '80-100次/分', isCorrect: false },
      { optionKey: 'C', content: '100-120次/分', isCorrect: true },
      { optionKey: 'D', content: '120-140次/分', isCorrect: false },
    ],
  },
  {
    content: '患者，女性，45岁，因"急性阑尾炎"行阑尾切除术后第1天。患者主诉伤口疼痛，疼痛评分6分。护士应首先采取的措施是？',
    type: 'CASE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '术后疼痛首先应评估疼痛性质、部位、程度（已评估为6分），然后遵医嘱给予镇痛药物，同时可辅以心理疏导和舒适体位。',
    options: [
      { optionKey: 'A', content: '评估疼痛后遵医嘱给予镇痛药', isCorrect: true },
      { optionKey: 'B', content: '告知患者忍耐', isCorrect: false },
      { optionKey: 'C', content: '立即通知手术医生', isCorrect: false },
      { optionKey: 'D', content: '给予氧气吸入', isCorrect: false },
    ],
  },
  {
    content: '患者，男，80岁，因慢性心力衰竭住院，护士发现患者昨晚尿量仅300ml，双下肢水肿明显加重。护士应首先采取的措施是？',
    type: 'CASE', category: 'SANJIZONGHE', difficulty: 3,
    analysis: '心衰患者尿量减少+水肿加重提示病情加重，首先应评估生命体征并立即报告医生，遵医嘱调整利尿剂等治疗。',
    options: [
      { optionKey: 'A', content: '评估生命体征并立即报告医生', isCorrect: true },
      { optionKey: 'B', content: '立即给予利尿剂', isCorrect: false },
      { optionKey: 'C', content: '嘱患者多饮水', isCorrect: false },
      { optionKey: 'D', content: '继续观察', isCorrect: false },
    ],
  },
  {
    content: '患者，女，55岁，脑卒中后左侧偏瘫，长期卧床。护士在护理过程中发现患者左侧小腿肿胀、疼痛、皮温增高。最可能的诊断是？',
    type: 'CASE', category: 'SANJIZONGHE', difficulty: 3,
    analysis: '长期卧床+单侧下肢肿胀、疼痛、皮温增高，为下肢深静脉血栓（DVT）的典型表现。',
    options: [
      { optionKey: 'A', content: '下肢深静脉血栓', isCorrect: true },
      { optionKey: 'B', content: '下肢动脉栓塞', isCorrect: false },
      { optionKey: 'C', content: '压疮', isCorrect: false },
      { optionKey: 'D', content: '蜂窝织炎', isCorrect: false },
    ],
  },
  {
    content: '患者，男，3岁，因"肺炎"住院，输液过程中突然出现呼吸困难、发绀、剧烈咳嗽，咳粉红色泡沫痰。护士判断该患儿发生了什么？',
    type: 'CASE', category: 'SANJIZONGHE', difficulty: 3,
    analysis: '输液过程中出现呼吸困难+发绀+咳粉红色泡沫痰，为急性肺水肿（输液反应之一）的典型表现。',
    options: [
      { optionKey: 'A', content: '急性肺水肿', isCorrect: true },
      { optionKey: 'B', content: '空气栓塞', isCorrect: false },
      { optionKey: 'C', content: '过敏反应', isCorrect: false },
      { optionKey: 'D', content: '发热反应', isCorrect: false },
    ],
  },
  {
    content: '患者，女，28岁，产后第2天，护士查房发现患者情绪低落、哭泣，不愿抱婴儿。护士首先应做什么？',
    type: 'CASE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '产后2天情绪低落可能为产后抑郁症，护士首先应与患者进行沟通和心理疏导，评估情绪状态并报告医生。',
    options: [
      { optionKey: 'A', content: '主动沟通并进行心理疏导', isCorrect: true },
      { optionKey: 'B', content: '立即给予抗抑郁药物', isCorrect: false },
      { optionKey: 'C', content: '报告护士长即可', isCorrect: false },
      { optionKey: 'D', content: '通知家属带走婴儿', isCorrect: false },
    ],
  },
  {
    content: '患者，男，65岁，慢性阻塞性肺疾病（COPD）急性加重期，医嘱予低流量吸氧。护士应选择的氧流量是多少？',
    type: 'CASE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: 'COPD患者应给予持续低流量吸氧（1-2L/min），避免高流量吸氧导致呼吸中枢抑制。',
    options: [
      { optionKey: 'A', content: '1-2L/min', isCorrect: true },
      { optionKey: 'B', content: '4-6L/min', isCorrect: false },
      { optionKey: 'C', content: '6-8L/min', isCorrect: false },
      { optionKey: 'D', content: '8-10L/min', isCorrect: false },
    ],
  },
  {
    content: '患者，女，40岁，腹部手术后第二天，患者未排气，主诉腹胀。护士应建议患者采取何种措施？',
    type: 'CASE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '术后未排气腹胀可鼓励早期下床活动促进肠蠕动恢复，腹部热敷或按摩也有帮助。',
    options: [
      { optionKey: 'A', content: '鼓励早期下床活动', isCorrect: true },
      { optionKey: 'B', content: '立刻进食', isCorrect: false },
      { optionKey: 'C', content: '给予止痛剂', isCorrect: false },
      { optionKey: 'D', content: '绝对卧床休息', isCorrect: false },
    ],
  },
  {
    content: '患者，男，72岁，高血压病史20年，晨起如厕时突然晕倒，呼之不应。护士首先应怎么做？',
    type: 'CASE', category: 'SANJIZONGHE', difficulty: 3,
    analysis: '发现患者突然晕倒，首先应评估意识和呼吸，判断是否需要CPR，同时呼叫援助。',
    options: [
      { optionKey: 'A', content: '评估意识、呼吸并呼叫帮助', isCorrect: true },
      { optionKey: 'B', content: '立即给予降压药', isCorrect: false },
      { optionKey: 'C', content: '立即扶起患者', isCorrect: false },
      { optionKey: 'D', content: '立即通知家属', isCorrect: false },
    ],
  },
  {
    content: '患者，女，18岁，因急性支气管哮喘入院，使用沙丁胺醇气雾剂吸入。护士应指导患者正确的吸入方法是？',
    type: 'CASE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '使用气雾剂时应先呼气，然后含住吸嘴、深吸气的同时按压药罐、屏气10秒后缓慢呼气。',
    options: [
      { optionKey: 'A', content: '深呼气后深吸气时同步按压药罐并屏气', isCorrect: true },
      { optionKey: 'B', content: '正常呼吸时按压药罐', isCorrect: false },
      { optionKey: 'C', content: '浅吸气后按压药罐', isCorrect: false },
      { optionKey: 'D', content: '连续快速按压多次', isCorrect: false },
    ],
  },
  {
    content: '患者，男，50岁，乙状结肠癌术后留置腹腔引流管。护士发现引流液突然增多，且呈鲜红色。护士应首先？',
    type: 'CASE', category: 'SANJIZONGHE', difficulty: 3,
    analysis: '术后引流液突然增多呈鲜红色提示腹腔内活动性出血，应立即报告医生并监测生命体征。',
    options: [
      { optionKey: 'A', content: '立即报告医生并监测生命体征', isCorrect: true },
      { optionKey: 'B', content: '拔除引流管', isCorrect: false },
      { optionKey: 'C', content: '加快输液速度', isCorrect: false },
      { optionKey: 'D', content: '继续观察', isCorrect: false },
    ],
  },
  {
    content: '患者，女，35岁，因口服有机磷农药中毒急诊入院。护士应首先采取的护理措施是？',
    type: 'CASE', category: 'SANJIZONGHE', difficulty: 3,
    analysis: '有机磷中毒的首要处理是迅速清除毒物：脱去污染衣物、清洗皮肤，口服中毒者应尽快洗胃。同时建立静脉通路使用阿托品等解毒药。',
    options: [
      { optionKey: 'A', content: '脱去污染衣物并进行洗胃', isCorrect: true },
      { optionKey: 'B', content: '立即给予镇静剂', isCorrect: false },
      { optionKey: 'C', content: '等待医生开医嘱', isCorrect: false },
      { optionKey: 'D', content: '仅监测生命体征', isCorrect: false },
    ],
  },
  {
    content: '患者，男，4岁，因高热惊厥入院。护士在患儿发生惊厥时应首先处置什么？',
    type: 'CASE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '高热惊厥时首先应保持呼吸道通畅（头偏一侧，防止舌咬伤和误吸），同时使用止惊药物和降温措施。',
    options: [
      { optionKey: 'A', content: '保持呼吸道通畅', isCorrect: true },
      { optionKey: 'B', content: '立即给予抗生素', isCorrect: false },
      { optionKey: 'C', content: '立即喂水', isCorrect: false },
      { optionKey: 'D', content: '用力按压患儿肢体', isCorrect: false },
    ],
  },
  {
    content: '患者，女，42岁，乳癌根治术后。护士发现患者术侧手臂淋巴水肿明显。正确的护理措施是？',
    type: 'CASE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '乳癌术后淋巴水肿应将患肢抬高以利淋巴回流，并禁止在术侧肢体测量血压、抽血或注射。',
    options: [
      { optionKey: 'A', content: '抬高术侧肢体', isCorrect: true },
      { optionKey: 'B', content: '在术侧手臂加压包扎', isCorrect: false },
      { optionKey: 'C', content: '让患者下垂术侧手臂', isCorrect: false },
      { optionKey: 'D', content: '在术侧测量血压', isCorrect: false },
    ],
  },
  {
    content: '患者，男，60岁，肝硬化腹水患者。护士在护理过程中应注意限制患者什么？',
    type: 'CASE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '肝硬化腹水患者应限制水钠摄入（限盐、限水），准确记录出入量，定期测量腹围和体重。',
    options: [
      { optionKey: 'A', content: '限制水钠摄入', isCorrect: true },
      { optionKey: 'B', content: '限制蛋白质摄入', isCorrect: false },
      { optionKey: 'C', content: '限制维生素摄入', isCorrect: false },
      { optionKey: 'D', content: '限制脂肪摄入', isCorrect: false },
    ],
  },
  {
    content: '患者，女，55岁，脑出血昏迷患者。护士为患者进行鼻饲时，每次鼻饲量不应超过多少？',
    type: 'CASE', category: 'SANJIZONGHE', difficulty: 2,
    analysis: '鼻饲每次量不超过200ml，间隔时间不少于2小时，温度38-40℃，推注速度不宜过快。',
    options: [
      { optionKey: 'A', content: '100ml', isCorrect: false },
      { optionKey: 'B', content: '200ml', isCorrect: true },
      { optionKey: 'C', content: '300ml', isCorrect: false },
      { optionKey: 'D', content: '500ml', isCorrect: false },
    ],
  },
];

// ==================== 中医药学 - 单选题 ====================
const tcmSingle: SeedQuestion[] = [
  {
    content: '中医理论体系的主要特点是？',
    type: 'SINGLE', category: 'TRADITIONAL_CHINESE', difficulty: 1,
    analysis: '中医理论体系的基本特点是整体观念和辨证论治，这是中医区别于西医的最核心特征。',
    options: [
      { optionKey: 'A', content: '整体观念和辨证论治', isCorrect: true },
      { optionKey: 'B', content: '解剖和实验', isCorrect: false },
      { optionKey: 'C', content: '局部治疗', isCorrect: false },
      { optionKey: 'D', content: '单纯对症治疗', isCorrect: false },
    ],
  },
  {
    content: '五行中，"木"的特性是？',
    type: 'SINGLE', category: 'TRADITIONAL_CHINESE', difficulty: 1,
    analysis: '木曰曲直，具有生长、升发、条达、舒畅的特性。《尚书·洪范》曰："木曰曲直"。',
    options: [
      { optionKey: 'A', content: '生长、升发、条达、舒畅', isCorrect: true },
      { optionKey: 'B', content: '温热、上升', isCorrect: false },
      { optionKey: 'C', content: '承载、受纳', isCorrect: false },
      { optionKey: 'D', content: '肃杀、收敛', isCorrect: false },
    ],
  },
  {
    content: '根据五行相生规律，木生什么？',
    type: 'SINGLE', category: 'TRADITIONAL_CHINESE', difficulty: 1,
    analysis: '五行相生顺序为：木生火、火生土、土生金、金生水、水生木。木生火。',
    options: [
      { optionKey: 'A', content: '火', isCorrect: true },
      { optionKey: 'B', content: '土', isCorrect: false },
      { optionKey: 'C', content: '金', isCorrect: false },
      { optionKey: 'D', content: '水', isCorrect: false },
    ],
  },
  {
    content: '五脏中属于"君主之官"的是？',
    type: 'SINGLE', category: 'TRADITIONAL_CHINESE', difficulty: 1,
    analysis: '《素问·灵兰秘典论》云："心者，君主之官也，神明出焉。"心为五脏六腑之大主。',
    options: [
      { optionKey: 'A', content: '心', isCorrect: true },
      { optionKey: 'B', content: '肝', isCorrect: false },
      { optionKey: 'C', content: '脾', isCorrect: false },
      { optionKey: 'D', content: '肺', isCorrect: false },
    ],
  },
  {
    content: '六淫邪气中，具有"收引、凝滞"特性的是？',
    type: 'SINGLE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '寒为阴邪，易伤阳气；寒性凝滞，主痛；寒性收引，故寒邪致病多见收引、凝滞之象。',
    options: [
      { optionKey: 'A', content: '风', isCorrect: false },
      { optionKey: 'B', content: '寒', isCorrect: true },
      { optionKey: 'C', content: '暑', isCorrect: false },
      { optionKey: 'D', content: '湿', isCorrect: false },
    ],
  },
  {
    content: '四诊中，"望诊"的首要内容是？',
    type: 'SINGLE', category: 'TRADITIONAL_CHINESE', difficulty: 1,
    analysis: '望诊包括望神、望色、望形态等，其中望神为望诊之首，是判断疾病轻重与预后的重要依据。',
    options: [
      { optionKey: 'A', content: '望神', isCorrect: true },
      { optionKey: 'B', content: '望面色', isCorrect: false },
      { optionKey: 'C', content: '望舌', isCorrect: false },
      { optionKey: 'D', content: '望形体', isCorrect: false },
    ],
  },
  {
    content: '正常舌象的特点是什么？',
    type: 'SINGLE', category: 'TRADITIONAL_CHINESE', difficulty: 1,
    analysis: '正常舌象为"淡红舌、薄白苔"，即舌质淡红、舌苔薄白。',
    options: [
      { optionKey: 'A', content: '淡红舌、薄白苔', isCorrect: true },
      { optionKey: 'B', content: '红舌、黄苔', isCorrect: false },
      { optionKey: 'C', content: '淡白舌、白厚苔', isCorrect: false },
      { optionKey: 'D', content: '紫暗舌、无苔', isCorrect: false },
    ],
  },
  {
    content: '脉诊中，"浮脉"的主病是？',
    type: 'SINGLE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '浮脉主表证，脉象特点是轻取即得、重按稍减而不空。',
    options: [
      { optionKey: 'A', content: '表证', isCorrect: true },
      { optionKey: 'B', content: '里证', isCorrect: false },
      { optionKey: 'C', content: '虚证', isCorrect: false },
      { optionKey: 'D', content: '寒证', isCorrect: false },
    ],
  },
  {
    content: '八纲辨证中，辨明疾病部位的是？',
    type: 'SINGLE', category: 'TRADITIONAL_CHINESE', difficulty: 1,
    analysis: '八纲辨证中，表里是辨别疾病病位浅深的一对纲领。表证病浅而轻，里证病深而重。',
    options: [
      { optionKey: 'A', content: '表里', isCorrect: true },
      { optionKey: 'B', content: '寒热', isCorrect: false },
      { optionKey: 'C', content: '虚实', isCorrect: false },
      { optionKey: 'D', content: '阴阳', isCorrect: false },
    ],
  },
  {
    content: '中药四气是指哪四种药性？',
    type: 'SINGLE', category: 'TRADITIONAL_CHINESE', difficulty: 1,
    analysis: '中药四气指寒、热、温、凉四种药性，是从药物作用于机体所发生的反应概括出来的。',
    options: [
      { optionKey: 'A', content: '寒、热、温、凉', isCorrect: true },
      { optionKey: 'B', content: '辛、甘、苦、咸', isCorrect: false },
      { optionKey: 'C', content: '酸、苦、甘、辛', isCorrect: false },
      { optionKey: 'D', content: '升、降、浮、沉', isCorrect: false },
    ],
  },
  {
    content: '"大椎穴"位于人体的哪条经脉上？',
    type: 'SINGLE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '大椎穴为督脉要穴，位于第7颈椎棘突下凹陷中，是手足三阳经与督脉的交会穴。',
    options: [
      { optionKey: 'A', content: '督脉', isCorrect: true },
      { optionKey: 'B', content: '任脉', isCorrect: false },
      { optionKey: 'C', content: '膀胱经', isCorrect: false },
      { optionKey: 'D', content: '胃经', isCorrect: false },
    ],
  },
  {
    content: '足三里穴的主要功效是？',
    type: 'SINGLE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '足三里为足阳明胃经合穴，具有健脾和胃、扶正培元、通经活络的功效，是常用的保健要穴。',
    options: [
      { optionKey: 'A', content: '健脾和胃', isCorrect: true },
      { optionKey: 'B', content: '清肝明目', isCorrect: false },
      { optionKey: 'C', content: '补肾壮阳', isCorrect: false },
      { optionKey: 'D', content: '宣肺平喘', isCorrect: false },
    ],
  },
  {
    content: '方剂君、臣、佐、使中，"君药"的作用是？',
    type: 'SINGLE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '君药是针对主病或主证起主要治疗作用的药物，是方剂中不可或缺的核心药物。',
    options: [
      { optionKey: 'A', content: '针对主病或主证起主要治疗作用', isCorrect: true },
      { optionKey: 'B', content: '辅助君药加强治疗作用', isCorrect: false },
      { optionKey: 'C', content: '减少方剂的毒副作用', isCorrect: false },
      { optionKey: 'D', content: '引经报使', isCorrect: false },
    ],
  },
  {
    content: '下列哪种中药具有解表散寒、行气和胃的功效？',
    type: 'SINGLE', category: 'TRADITIONAL_CHINESE', difficulty: 3,
    analysis: '紫苏叶性温味辛，归肺、脾经，能解表散寒、行气和胃，适用于风寒感冒兼脾胃气滞者。',
    options: [
      { optionKey: 'A', content: '紫苏', isCorrect: true },
      { optionKey: 'B', content: '黄连', isCorrect: false },
      { optionKey: 'C', content: '生地', isCorrect: false },
      { optionKey: 'D', content: '附子', isCorrect: false },
    ],
  },
  {
    content: '中医"治未病"的理论核心是？',
    type: 'SINGLE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '"治未病"包括未病先防、既病防变、瘥后防复三个层面，核心思想是预防为主。',
    options: [
      { optionKey: 'A', content: '未病先防、既病防变', isCorrect: true },
      { optionKey: 'B', content: '有病早治', isCorrect: false },
      { optionKey: 'C', content: '对症下药', isCorrect: false },
      { optionKey: 'D', content: '以毒攻毒', isCorrect: false },
    ],
  },
  {
    content: '针灸中"得气"的含义是？',
    type: 'SINGLE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '"得气"是指针刺入腧穴后产生的经气感应，医者感觉针下沉紧涩，患者感觉酸、麻、胀、重等。',
    options: [
      { optionKey: 'A', content: '针刺部位产生酸麻胀重等感觉', isCorrect: true },
      { optionKey: 'B', content: '患者呼吸顺畅', isCorrect: false },
      { optionKey: 'C', content: '针刺部位出血', isCorrect: false },
      { optionKey: 'D', content: '患者入睡', isCorrect: false },
    ],
  },
  {
    content: '经络系统中，"阴脉之海"指的是？',
    type: 'SINGLE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '任脉行于腹面正中线，总任一身之阴经，故称"阴脉之海"。督脉称"阳脉之海"。',
    options: [
      { optionKey: 'A', content: '任脉', isCorrect: true },
      { optionKey: 'B', content: '督脉', isCorrect: false },
      { optionKey: 'C', content: '冲脉', isCorrect: false },
      { optionKey: 'D', content: '带脉', isCorrect: false },
    ],
  },
  {
    content: '舌苔黄腻多反映什么证候？',
    type: 'SINGLE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '黄苔主热证、里证；腻苔主湿浊、痰饮、食积。黄腻苔多反映湿热内蕴或痰热互结。',
    options: [
      { optionKey: 'A', content: '湿热内蕴', isCorrect: true },
      { optionKey: 'B', content: '阴虚内热', isCorrect: false },
      { optionKey: 'C', content: '阳虚寒盛', isCorrect: false },
      { optionKey: 'D', content: '气滞血瘀', isCorrect: false },
    ],
  },
  {
    content: '"同病异治"的理论依据是什么？',
    type: 'SINGLE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '同病异治是指同一种疾病，由于发病时间、地区及患者体质或疾病发展阶段不同，表现的证候不同，治法也不同。其依据是辨证论治。',
    options: [
      { optionKey: 'A', content: '证候不同则治法不同', isCorrect: true },
      { optionKey: 'B', content: '病因相同则治法相同', isCorrect: false },
      { optionKey: 'C', content: '所有患者都用相同治疗方法', isCorrect: false },
      { optionKey: 'D', content: '不需要辨证直接治疗', isCorrect: false },
    ],
  },
  {
    content: '黄芪的主要功效是？',
    type: 'SINGLE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '黄芪性温味甘，归脾、肺经，功效为补气升阳、固表止汗、利水消肿、托毒生肌。',
    options: [
      { optionKey: 'A', content: '补气升阳', isCorrect: true },
      { optionKey: 'B', content: '清热泻火', isCorrect: false },
      { optionKey: 'C', content: '活血化瘀', isCorrect: false },
      { optionKey: 'D', content: '祛风除湿', isCorrect: false },
    ],
  },
];

// ==================== 中医药学 - 多选题 ====================
const tcmMultiple: SeedQuestion[] = [
  {
    content: '下列哪些属于气的生理功能？',
    type: 'MULTIPLE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '气的生理功能包括：推动作用、温煦作用、防御作用、固摄作用、气化作用。',
    options: [
      { optionKey: 'A', content: '推动作用', isCorrect: true },
      { optionKey: 'B', content: '温煦作用', isCorrect: true },
      { optionKey: 'C', content: '防御作用', isCorrect: true },
      { optionKey: 'D', content: '固摄作用', isCorrect: true },
      { optionKey: 'E', content: '分解作用', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于五脏的生理功能配对（脏腑相表里）？',
    type: 'MULTIPLE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '脏与腑的表里关系：心与小肠、肺与大肠、脾与胃、肝与胆、肾与膀胱相表里。',
    options: [
      { optionKey: 'A', content: '心与小肠', isCorrect: true },
      { optionKey: 'B', content: '肺与大肠', isCorrect: true },
      { optionKey: 'C', content: '肝与胆', isCorrect: true },
      { optionKey: 'D', content: '肾与膀胱', isCorrect: true },
      { optionKey: 'E', content: '脾与三焦', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于艾灸的主要作用？',
    type: 'MULTIPLE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '艾灸具有温经散寒、扶阳固脱、消瘀散结、防病保健的作用。',
    options: [
      { optionKey: 'A', content: '温经散寒', isCorrect: true },
      { optionKey: 'B', content: '扶阳固脱', isCorrect: true },
      { optionKey: 'C', content: '消瘀散结', isCorrect: true },
      { optionKey: 'D', content: '防病保健', isCorrect: true },
      { optionKey: 'E', content: '清热泻火', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于中药的剂型？',
    type: 'MULTIPLE', category: 'TRADITIONAL_CHINESE', difficulty: 1,
    analysis: '中药常见剂型包括：汤剂、丸剂、散剂、膏剂、丹剂、酒剂等。',
    options: [
      { optionKey: 'A', content: '汤剂', isCorrect: true },
      { optionKey: 'B', content: '丸剂', isCorrect: true },
      { optionKey: 'C', content: '散剂', isCorrect: true },
      { optionKey: 'D', content: '膏剂', isCorrect: true },
      { optionKey: 'E', content: '注射剂', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于中医病因中的外感六淫？',
    type: 'MULTIPLE', category: 'TRADITIONAL_CHINESE', difficulty: 1,
    analysis: '六淫即风、寒、暑、湿、燥、火六种外感病邪的总称。',
    options: [
      { optionKey: 'A', content: '风', isCorrect: true },
      { optionKey: 'B', content: '寒', isCorrect: true },
      { optionKey: 'C', content: '暑', isCorrect: true },
      { optionKey: 'D', content: '湿', isCorrect: true },
      { optionKey: 'E', content: '毒', isCorrect: false },
    ],
  },
  {
    content: '下列哪些是常用的保健要穴？',
    type: 'MULTIPLE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '常用保健要穴包括：足三里（"长寿穴"）、关元、气海、涌泉、三阴交等。',
    options: [
      { optionKey: 'A', content: '足三里', isCorrect: true },
      { optionKey: 'B', content: '关元', isCorrect: true },
      { optionKey: 'C', content: '气海', isCorrect: true },
      { optionKey: 'D', content: '三阴交', isCorrect: true },
      { optionKey: 'E', content: '合谷', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于望舌的内容？',
    type: 'MULTIPLE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '舌诊包括望舌质（舌色、舌形、舌态）和望舌苔（苔色、苔质）。',
    options: [
      { optionKey: 'A', content: '舌色', isCorrect: true },
      { optionKey: 'B', content: '舌形', isCorrect: true },
      { optionKey: 'C', content: '舌态', isCorrect: true },
      { optionKey: 'D', content: '苔色', isCorrect: true },
      { optionKey: 'E', content: '舌下温度', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于中医内治法中的"八法"？',
    type: 'MULTIPLE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '中医八法：汗法、吐法、下法、和法、温法、清法、消法、补法。',
    options: [
      { optionKey: 'A', content: '汗法', isCorrect: true },
      { optionKey: 'B', content: '吐法', isCorrect: true },
      { optionKey: 'C', content: '和法', isCorrect: true },
      { optionKey: 'D', content: '清法', isCorrect: true },
      { optionKey: 'E', content: '注法', isCorrect: false },
    ],
  },
  {
    content: '下列哪些是活血化瘀类中药？',
    type: 'MULTIPLE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '活血化瘀类中药包括：丹参、红花、川芎、桃仁、赤芍、三七等。',
    options: [
      { optionKey: 'A', content: '丹参', isCorrect: true },
      { optionKey: 'B', content: '红花', isCorrect: true },
      { optionKey: 'C', content: '川芎', isCorrect: true },
      { optionKey: 'D', content: '桃仁', isCorrect: true },
      { optionKey: 'E', content: '党参', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于肝的生理功能？',
    type: 'MULTIPLE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '肝的主要生理功能：主疏泄（调畅气机）、主藏血。',
    options: [
      { optionKey: 'A', content: '主疏泄', isCorrect: true },
      { optionKey: 'B', content: '主藏血', isCorrect: true },
      { optionKey: 'C', content: '主运化', isCorrect: false },
      { optionKey: 'D', content: '主血脉', isCorrect: false },
      { optionKey: 'E', content: '主纳气', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于中药配伍中的"七情"？',
    type: 'MULTIPLE', category: 'TRADITIONAL_CHINESE', difficulty: 3,
    analysis: '中药七情：单行、相须、相使、相畏、相杀、相恶、相反。',
    options: [
      { optionKey: 'A', content: '相须', isCorrect: true },
      { optionKey: 'B', content: '相使', isCorrect: true },
      { optionKey: 'C', content: '相畏', isCorrect: true },
      { optionKey: 'D', content: '相杀', isCorrect: true },
      { optionKey: 'E', content: '相敬', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于拔罐疗法的作用？',
    type: 'MULTIPLE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '拔罐具有通经活络、行气活血、消肿止痛、祛风散寒等作用。',
    options: [
      { optionKey: 'A', content: '通经活络', isCorrect: true },
      { optionKey: 'B', content: '行气活血', isCorrect: true },
      { optionKey: 'C', content: '消肿止痛', isCorrect: true },
      { optionKey: 'D', content: '祛风散寒', isCorrect: true },
      { optionKey: 'E', content: '补血安神', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于中医体质类型？',
    type: 'MULTIPLE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '中华中医药学会标准将体质分为九种：平和质、气虚质、阳虚质、阴虚质、痰湿质、湿热质、血瘀质、气郁质、特禀质。',
    options: [
      { optionKey: 'A', content: '平和质', isCorrect: true },
      { optionKey: 'B', content: '气虚质', isCorrect: true },
      { optionKey: 'C', content: '阳虚质', isCorrect: true },
      { optionKey: 'D', content: '痰湿质', isCorrect: true },
      { optionKey: 'E', content: '完美质', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于十二经脉中手三阳经？',
    type: 'MULTIPLE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '手三阳经：手阳明大肠经、手太阳小肠经、手少阳三焦经。',
    options: [
      { optionKey: 'A', content: '手阳明大肠经', isCorrect: true },
      { optionKey: 'B', content: '手太阳小肠经', isCorrect: true },
      { optionKey: 'C', content: '手少阳三焦经', isCorrect: true },
      { optionKey: 'D', content: '手太阴肺经', isCorrect: false },
      { optionKey: 'E', content: '手少阴心经', isCorrect: false },
    ],
  },
  {
    content: '下列哪些是脾的生理功能？',
    type: 'MULTIPLE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '脾的主要生理功能：主运化（运化水谷精微和水液）、主统血（统摄血液在脉内运行）。',
    options: [
      { optionKey: 'A', content: '主运化', isCorrect: true },
      { optionKey: 'B', content: '主统血', isCorrect: true },
      { optionKey: 'C', content: '主呼吸', isCorrect: false },
      { optionKey: 'D', content: '主藏精', isCorrect: false },
      { optionKey: 'E', content: '主神明', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于辨证论治中常用的辨证方法？',
    type: 'MULTIPLE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '常用辨证方法：八纲辨证、脏腑辨证、六经辨证、卫气营血辨证、三焦辨证、气血津液辨证等。',
    options: [
      { optionKey: 'A', content: '八纲辨证', isCorrect: true },
      { optionKey: 'B', content: '脏腑辨证', isCorrect: true },
      { optionKey: 'C', content: '六经辨证', isCorrect: true },
      { optionKey: 'D', content: '卫气营血辨证', isCorrect: true },
      { optionKey: 'E', content: '影像辨证', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于拔火罐时的注意事项？',
    type: 'MULTIPLE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '拔罐应注意：勿灼伤皮肤、时间适当（10-15分钟）、皮肤过敏者忌用、大血管处忌用、孕妇腹部腰骶部忌用。',
    options: [
      { optionKey: 'A', content: '防止灼伤皮肤', isCorrect: true },
      { optionKey: 'B', content: '留罐时间不超过15分钟', isCorrect: true },
      { optionKey: 'C', content: '皮肤过敏处忌拔', isCorrect: true },
      { optionKey: 'D', content: '大血管分布处忌拔', isCorrect: true },
      { optionKey: 'E', content: '任何部位均可拔罐', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于补气类中药？',
    type: 'MULTIPLE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '补气类中药：人参、党参、黄芪、白术、甘草、山药等。',
    options: [
      { optionKey: 'A', content: '人参', isCorrect: true },
      { optionKey: 'B', content: '黄芪', isCorrect: true },
      { optionKey: 'C', content: '白术', isCorrect: true },
      { optionKey: 'D', content: '甘草', isCorrect: true },
      { optionKey: 'E', content: '大黄', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于中药炮制的目的？',
    type: 'MULTIPLE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '炮制目的：降低或消除药物毒副作用、改变或缓和药性、增强药物疗效、便于调剂和制剂、矫臭矫味便于服用。',
    options: [
      { optionKey: 'A', content: '降低毒副作用', isCorrect: true },
      { optionKey: 'B', content: '改变或缓和药性', isCorrect: true },
      { optionKey: 'C', content: '增强药物疗效', isCorrect: true },
      { optionKey: 'D', content: '便于调剂和制剂', isCorrect: true },
      { optionKey: 'E', content: '增加药物毒性', isCorrect: false },
    ],
  },
  {
    content: '下列哪些属于情志致病中的"七情"？',
    type: 'MULTIPLE', category: 'TRADITIONAL_CHINESE', difficulty: 1,
    analysis: '七情：喜、怒、忧、思、悲、恐、惊七种情志变化，是内伤的主要致病因素。',
    options: [
      { optionKey: 'A', content: '喜', isCorrect: true },
      { optionKey: 'B', content: '怒', isCorrect: true },
      { optionKey: 'C', content: '思', isCorrect: true },
      { optionKey: 'D', content: '恐', isCorrect: true },
      { optionKey: 'E', content: '爱', isCorrect: false },
    ],
  },
];

// ==================== 中医药学 - 判断题 ====================
const tcmJudge: SeedQuestion[] = [
  {
    content: '五行相克顺序为：木克土、土克水、水克火、火克金、金克木。',
    type: 'JUDGE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '五行相克顺序：木克土、土克水、水克火、火克金、金克木，该说法正确。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '中医认为"肝开窍于舌"。',
    type: 'JUDGE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '肝开窍于目，心开窍于舌。该说法错误。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
  {
    content: '四诊合参是指望、闻、问、切四种诊断方法综合运用。',
    type: 'JUDGE', category: 'TRADITIONAL_CHINESE', difficulty: 1,
    analysis: '四诊即望诊、闻诊（包括听声音和嗅气味）、问诊、切诊（包括脉诊和按诊），四诊合参才能全面了解病情。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '中药"十八反"中，甘草反甘遂。',
    type: 'JUDGE', category: 'TRADITIONAL_CHINESE', difficulty: 3,
    analysis: '十八反歌诀："本草明言十八反，半蒌贝蔹及攻乌，藻戟遂芫俱战草，诸参辛芍叛藜芦。"甘草反甘遂、大戟、海藻、芫花。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '针灸治疗中，"阿是穴"是指有固定位置和名称的腧穴。',
    type: 'JUDGE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '阿是穴又称压痛点、天应穴，无固定位置和名称，是以压痛点或其他反应点作为针灸施术部位的腧穴。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
  {
    content: '五脏中肾主骨生髓，其华在发。',
    type: 'JUDGE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '肾藏精，精生髓，髓养骨，其华在发。肾精充足则骨骼坚固、毛发润泽。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '中医的"辨证论治"就是根据西医检查结果进行治疗。',
    type: 'JUDGE', category: 'TRADITIONAL_CHINESE', difficulty: 1,
    analysis: '辨证论治是根据中医四诊所收集的病情资料，判断证候，确定相应的治疗原则和方法，而非根据西医检查结果。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
  {
    content: '金银花具有清热解毒的功效，常用于治疗风热感冒。',
    type: 'JUDGE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '金银花性寒味甘，归肺、心、胃经，具有清热解毒、疏散风热的功效，是治疗风热感冒的常用药。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '脉诊中"迟脉"是指一息脉来四至以下（每分钟不足60次）。',
    type: 'JUDGE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '迟脉脉来迟缓，一息不足四至（相当于每分钟60次以下），主寒证。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '"气为血之帅，血为气之母"是中医气血关系的重要理论。',
    type: 'JUDGE', category: 'TRADITIONAL_CHINESE', difficulty: 1,
    analysis: '气能生血、行血、摄血（气为血之帅）；血能载气、养气（血为气之母），此为气血关系。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '督脉被称为"阴脉之海"。',
    type: 'JUDGE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '督脉总督一身之阳经，为"阳脉之海"；任脉总任一身之阴经，为"阴脉之海"。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
  {
    content: '中药汤剂一般宜温服，但解表药宜热服。',
    type: 'JUDGE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '汤剂一般温服；解表药宜热服以助发汗；清热药宜凉服。服药温度需根据病情和药性而定。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '舌诊中，舌质淡白多反映气血两虚或阳虚。',
    type: 'JUDGE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '淡白舌主虚证、寒证或气血两虚。舌色淡白无华多为气血两虚；淡白而胖嫩多为阳虚寒盛。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '中药"十九畏"中的"畏"与配伍关系"相畏"的含义完全相同。',
    type: 'JUDGE', category: 'TRADITIONAL_CHINESE', difficulty: 3,
    analysis: '"十九畏"中的"畏"属配伍禁忌，指一种药物可被另一种药物抑制或减低毒性；而配伍中的"相畏"是指一种药物的毒性能被另一种药物减轻或消除，两者含义不同。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
  {
    content: '望诊中的"望面色"，青色主寒证、痛证、瘀血和惊风。',
    type: 'JUDGE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '青色主寒证、痛证、瘀血、惊风和小儿惊风，多因气血运行不畅所致。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '腧穴定位中，"同身寸"是指以患者本人手指尺寸作为度量标准。',
    type: 'JUDGE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '同身寸是以患者手指的宽度或长度作为标准来测量取穴的方法，包括中指同身寸、拇指同身寸和一夫法等。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '中医认为"恐则气消"。',
    type: 'JUDGE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '恐则气下（恐伤肾，使肾气不固，气陷于下）；悲则气消。该说法错误。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
  {
    content: '感冒可分为风寒感冒和风热感冒两种证型。',
    type: 'JUDGE', category: 'TRADITIONAL_CHINESE', difficulty: 1,
    analysis: '感冒主要分为风寒感冒、风热感冒，此外还有暑湿感冒、体虚感冒等分型。最基本的分类是风寒与风热。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
  {
    content: '艾灸疗法适用于一切热证患者。',
    type: 'JUDGE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '艾灸属温热疗法，适用于寒证、虚证；实热证、阴虚发热者一般不宜用灸。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: false },
      { optionKey: 'B', content: '错误', isCorrect: true },
    ],
  },
  {
    content: '中医强调"人与天地相参，与日月相应"，体现了整体观念中的天人合一思想。',
    type: 'JUDGE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '天人合一是中医整体观念的重要内容，强调人是一个有机整体，同时人与自然环境也是一个统一整体。',
    options: [
      { optionKey: 'A', content: '正确', isCorrect: true },
      { optionKey: 'B', content: '错误', isCorrect: false },
    ],
  },
];

// ==================== 中医药学 - 案例分析 ====================
const tcmCase: SeedQuestion[] = [
  {
    content: '患者，男，45岁，近一月来常感头晕目眩、腰膝酸软、失眠多梦，舌红少苔，脉细数。中医辨证属？',
    type: 'CASE', category: 'TRADITIONAL_CHINESE', difficulty: 3,
    analysis: '头晕目眩+腰膝酸软（肾虚）+失眠多梦+舌红少苔脉细数（阴虚内热表现），为肝肾阴虚证。',
    options: [
      { optionKey: 'A', content: '肝肾阴虚', isCorrect: true },
      { optionKey: 'B', content: '肝阳上亢', isCorrect: false },
      { optionKey: 'C', content: '气虚血弱', isCorrect: false },
      { optionKey: 'D', content: '痰湿中阻', isCorrect: false },
    ],
  },
  {
    content: '患者，女，30岁，产后一周，恶露不尽，色淡质稀，面色萎黄，神疲乏力，舌淡苔薄白，脉细弱。治疗原则是？',
    type: 'CASE', category: 'TRADITIONAL_CHINESE', difficulty: 3,
    analysis: '产后恶露不尽+色淡质稀+面色萎黄神疲乏力+舌淡脉细弱，为气血两虚证，治以补气养血。',
    options: [
      { optionKey: 'A', content: '补气养血', isCorrect: true },
      { optionKey: 'B', content: '活血化瘀', isCorrect: false },
      { optionKey: 'C', content: '清热解毒', isCorrect: false },
      { optionKey: 'D', content: '疏肝理气', isCorrect: false },
    ],
  },
  {
    content: '患者，男，8岁，发热2天，体温39℃，咳嗽，咽喉肿痛，舌尖红，苔薄黄，脉浮数。中医辨证属于？',
    type: 'CASE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '发热+咽喉肿痛+舌尖红苔薄黄+脉浮数，为风热犯肺证（风热感冒）。',
    options: [
      { optionKey: 'A', content: '风热犯肺', isCorrect: true },
      { optionKey: 'B', content: '风寒束表', isCorrect: false },
      { optionKey: 'C', content: '痰热壅肺', isCorrect: false },
      { optionKey: 'D', content: '阴虚肺燥', isCorrect: false },
    ],
  },
  {
    content: '患者，女，50岁，胃脘隐痛反复发作，喜温喜按，空腹时加重，食后减轻，伴有神疲乏力，舌淡苔白，脉弱。宜选用何法？',
    type: 'CASE', category: 'TRADITIONAL_CHINESE', difficulty: 3,
    analysis: '胃脘隐痛+喜温喜按（虚寒表现）+神疲乏力舌淡脉弱（气虚），证属脾胃虚寒，宜温中健脾。',
    options: [
      { optionKey: 'A', content: '温中健脾', isCorrect: true },
      { optionKey: 'B', content: '清热利湿', isCorrect: false },
      { optionKey: 'C', content: '疏肝理气', isCorrect: false },
      { optionKey: 'D', content: '活血化瘀', isCorrect: false },
    ],
  },
  {
    content: '患者，男，65岁，咳嗽反复发作20年，冬季加重，痰白黏稠，胸闷气短，舌淡胖苔白腻，脉滑。证属？',
    type: 'CASE', category: 'TRADITIONAL_CHINESE', difficulty: 3,
    analysis: '慢性咳嗽+痰白黏稠+胸闷气短+舌淡胖苔白腻脉滑，为痰湿蕴肺证。',
    options: [
      { optionKey: 'A', content: '痰湿蕴肺', isCorrect: true },
      { optionKey: 'B', content: '风寒袭肺', isCorrect: false },
      { optionKey: 'C', content: '肺阴亏虚', isCorrect: false },
      { optionKey: 'D', content: '肝火犯肺', isCorrect: false },
    ],
  },
  {
    content: '患者，女，28岁，经前乳房胀痛、烦躁易怒，月经量少色暗有血块，舌暗红苔薄白，脉弦。辨证属？',
    type: 'CASE', category: 'TRADITIONAL_CHINESE', difficulty: 3,
    analysis: '经前乳房胀痛+烦躁易怒（肝气郁结）+经色暗有血块舌暗（瘀血征），为肝郁气滞血瘀证。',
    options: [
      { optionKey: 'A', content: '肝郁气滞血瘀', isCorrect: true },
      { optionKey: 'B', content: '气血两虚', isCorrect: false },
      { optionKey: 'C', content: '肾虚肝旺', isCorrect: false },
      { optionKey: 'D', content: '脾虚湿盛', isCorrect: false },
    ],
  },
  {
    content: '患者，男，55岁，突发右侧口眼歪斜，右侧额纹消失、鼻唇沟变浅、口角向左侧歪斜。舌淡红苔薄白，脉浮。针灸治疗首选穴位？',
    type: 'CASE', category: 'TRADITIONAL_CHINESE', difficulty: 3,
    analysis: '面瘫（口眼歪斜）属风中经络，针灸取穴以面部局部穴位为主，如地仓、颊车、阳白、四白、合谷等。',
    options: [
      { optionKey: 'A', content: '地仓、颊车、合谷', isCorrect: true },
      { optionKey: 'B', content: '足三里、关元', isCorrect: false },
      { optionKey: 'C', content: '大椎、曲池', isCorrect: false },
      { optionKey: 'D', content: '三阴交、血海', isCorrect: false },
    ],
  },
  {
    content: '患者，女，60岁，腰膝酸痛、畏寒肢冷、夜尿频多，舌淡胖苔白，脉沉弱。辨证为肾阳虚。首选方剂是？',
    type: 'CASE', category: 'TRADITIONAL_CHINESE', difficulty: 3,
    analysis: '腰膝酸痛+畏寒肢冷+夜尿频多+舌淡胖脉沉弱，为肾阳虚证，金匮肾气丸为主治方剂。',
    options: [
      { optionKey: 'A', content: '金匮肾气丸', isCorrect: true },
      { optionKey: 'B', content: '六味地黄丸', isCorrect: false },
      { optionKey: 'C', content: '逍遥散', isCorrect: false },
      { optionKey: 'D', content: '四君子汤', isCorrect: false },
    ],
  },
  {
    content: '患者，女，35岁，失眠多梦、心烦易怒、口干口苦，舌红苔黄，脉弦数。辨证属？',
    type: 'CASE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '失眠多梦+心烦易怒+口干口苦+舌红苔黄脉弦数，为肝火扰心证。',
    options: [
      { optionKey: 'A', content: '肝火扰心', isCorrect: true },
      { optionKey: 'B', content: '心脾两虚', isCorrect: false },
      { optionKey: 'C', content: '阴虚火旺', isCorrect: false },
      { optionKey: 'D', content: '心胆气虚', isCorrect: false },
    ],
  },
  {
    content: '患者，男，72岁，胸闷胸痛反复发作，痛有定处，入夜尤甚，舌紫暗有瘀斑，脉涩。辨证属？',
    type: 'CASE', category: 'TRADITIONAL_CHINESE', difficulty: 3,
    analysis: '胸痛有定处+入夜尤甚+舌紫暗瘀斑+脉涩，为心血瘀阻证（胸痹心痛）。',
    options: [
      { optionKey: 'A', content: '心血瘀阻', isCorrect: true },
      { optionKey: 'B', content: '痰浊闭阻', isCorrect: false },
      { optionKey: 'C', content: '寒凝心脉', isCorrect: false },
      { optionKey: 'D', content: '气阴两虚', isCorrect: false },
    ],
  },
  {
    content: '患者，女，15岁，痛经2年，经期小腹冷痛，得热痛减，经量少色暗，舌暗苔白，脉沉紧。治法是？',
    type: 'CASE', category: 'TRADITIONAL_CHINESE', difficulty: 3,
    analysis: '经期小腹冷痛+得热痛减+色暗脉沉紧，为寒凝血瘀痛经，治以温经散寒、化瘀止痛。',
    options: [
      { optionKey: 'A', content: '温经散寒，化瘀止痛', isCorrect: true },
      { optionKey: 'B', content: '清热利湿，化瘀止痛', isCorrect: false },
      { optionKey: 'C', content: '疏肝理气，活血止痛', isCorrect: false },
      { optionKey: 'D', content: '补气养血，调经止痛', isCorrect: false },
    ],
  },
  {
    content: '患者，男，40岁，感冒后咳嗽持续三周未愈，干咳少痰、咽喉干痒、声音嘶哑，舌红少苔，脉细数。辨证属于？',
    type: 'CASE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '外感后久咳不愈+干咳少痰+咽喉干痒+舌红少苔脉细数，为肺阴亏虚证（阴虚咳嗽）。',
    options: [
      { optionKey: 'A', content: '肺阴亏虚', isCorrect: true },
      { optionKey: 'B', content: '风寒束肺', isCorrect: false },
      { optionKey: 'C', content: '痰湿阻肺', isCorrect: false },
      { optionKey: 'D', content: '风热犯肺', isCorrect: false },
    ],
  },
  {
    content: '患者，男，58岁，肥胖，眩晕，头重如裹，胸脘痞闷，恶心欲呕，舌淡胖苔白腻，脉滑。最可能的病机是？',
    type: 'CASE', category: 'TRADITIONAL_CHINESE', difficulty: 3,
    analysis: '肥胖+眩晕头重如裹+胸脘痞闷恶心+舌胖苔白腻脉滑，为痰湿中阻、清阳不升。',
    options: [
      { optionKey: 'A', content: '痰湿中阻', isCorrect: true },
      { optionKey: 'B', content: '肝阳上亢', isCorrect: false },
      { optionKey: 'C', content: '气血亏虚', isCorrect: false },
      { optionKey: 'D', content: '肾精不足', isCorrect: false },
    ],
  },
  {
    content: '患者，女，48岁，潮热盗汗、五心烦热、颧红口干，舌红少苔，脉细数。中医辨证为？',
    type: 'CASE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '潮热盗汗+五心烦热+颧红口干+舌红少苔脉细数，为阴虚火旺的典型表现。',
    options: [
      { optionKey: 'A', content: '阴虚火旺', isCorrect: true },
      { optionKey: 'B', content: '阳虚寒盛', isCorrect: false },
      { optionKey: 'C', content: '湿热内蕴', isCorrect: false },
      { optionKey: 'D', content: '气血两虚', isCorrect: false },
    ],
  },
  {
    content: '患者，男，20岁，鼻塞流清涕、恶寒发热、头痛身痛、无汗，舌淡苔薄白，脉浮紧。辨证属？',
    type: 'CASE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '恶寒发热+无汗+流清涕+苔薄白脉浮紧，为风寒感冒（风寒束表证）。',
    options: [
      { optionKey: 'A', content: '风寒束表', isCorrect: true },
      { optionKey: 'B', content: '风热犯表', isCorrect: false },
      { optionKey: 'C', content: '暑湿袭表', isCorrect: false },
      { optionKey: 'D', content: '气虚感冒', isCorrect: false },
    ],
  },
  {
    content: '患者，女，70岁，大便干结，排便困难，面色苍白，头晕心悸，舌淡苔白，脉细。辨证属？',
    type: 'CASE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '大便干结+面色苍白+头晕心悸+舌淡脉细，为血虚便秘证。',
    options: [
      { optionKey: 'A', content: '血虚便秘', isCorrect: true },
      { optionKey: 'B', content: '热结便秘', isCorrect: false },
      { optionKey: 'C', content: '气滞便秘', isCorrect: false },
      { optionKey: 'D', content: '阳虚便秘', isCorrect: false },
    ],
  },
  {
    content: '患者，男，6岁，食欲不振、面色萎黄、形体消瘦、大便溏稀，舌淡苔白，脉弱。辨证属？',
    type: 'CASE', category: 'TRADITIONAL_CHINESE', difficulty: 2,
    analysis: '食欲不振+面色萎黄+形体消瘦+大便溏稀+舌淡脉弱，为脾胃虚弱（脾气虚）证。',
    options: [
      { optionKey: 'A', content: '脾胃虚弱', isCorrect: true },
      { optionKey: 'B', content: '食积内停', isCorrect: false },
      { optionKey: 'C', content: '肝胆湿热', isCorrect: false },
      { optionKey: 'D', content: '肺脾气虚', isCorrect: false },
    ],
  },
  {
    content: '患者，女，38岁，急躁易怒、头痛目赤、耳鸣耳聋、口干口苦，舌红苔黄，脉弦数有力。治法是？',
    type: 'CASE', category: 'TRADITIONAL_CHINESE', difficulty: 3,
    analysis: '急躁易怒+头痛目赤+口干口苦+舌红苔黄脉弦数，为肝火上炎证，治以清肝泻火。',
    options: [
      { optionKey: 'A', content: '清肝泻火', isCorrect: true },
      { optionKey: 'B', content: '滋阴潜阳', isCorrect: false },
      { optionKey: 'C', content: '疏肝理气', isCorrect: false },
      { optionKey: 'D', content: '活血化瘀', isCorrect: false },
    ],
  },
  {
    content: '患者，男，50岁，腰部冷痛重着，转侧不利，阴雨天加重，舌淡苔白腻，脉沉缓。辨证属？',
    type: 'CASE', category: 'TRADITIONAL_CHINESE', difficulty: 3,
    analysis: '腰部冷痛重着+阴雨天加重+苔白腻脉沉缓，为寒湿腰痛证。',
    options: [
      { optionKey: 'A', content: '寒湿腰痛', isCorrect: true },
      { optionKey: 'B', content: '肾虚腰痛', isCorrect: false },
      { optionKey: 'C', content: '瘀血腰痛', isCorrect: false },
      { optionKey: 'D', content: '湿热腰痛', isCorrect: false },
    ],
  },
  {
    content: '患者，女，56岁，心悸怔忡、胸闷气短、面色苍白、畏寒肢冷，舌淡胖苔白滑，脉沉弱。治法是？',
    type: 'CASE', category: 'TRADITIONAL_CHINESE', difficulty: 3,
    analysis: '心悸+胸闷气短+畏寒肢冷+舌淡胖脉沉弱，为心阳虚证，治以温补心阳。',
    options: [
      { optionKey: 'A', content: '温补心阳', isCorrect: true },
      { optionKey: 'B', content: '滋阴养血', isCorrect: false },
      { optionKey: 'C', content: '活血化瘀', isCorrect: false },
      { optionKey: 'D', content: '清热化痰', isCorrect: false },
    ],
  },
];

// ==================== 种子数据导入函数 ====================
async function main() {
  console.log('🌱 开始导入题库种子数据...\n');

  const allQuestionArrays: { name: string; data: SeedQuestion[] }[] = [
    { name: '院感知识-单选题', data: infectionSingle },
    { name: '院感知识-多选题', data: infectionMultiple },
    { name: '院感知识-判断题', data: infectionJudge },
    { name: '院感知识-案例分析', data: infectionCase },
    { name: '公共卫生-单选题', data: publicSingle },
    { name: '公共卫生-多选题', data: publicMultiple },
    { name: '公共卫生-判断题', data: publicJudge },
    { name: '公共卫生-案例分析', data: publicCase },
    { name: '三基综合-单选题', data: sanjiSingle },
    { name: '三基综合-多选题', data: sanjiMultiple },
    { name: '三基综合-判断题', data: sanjiJudge },
    { name: '三基综合-案例分析', data: sanjiCase },
    { name: '中医药学-单选题', data: tcmSingle },
    { name: '中医药学-多选题', data: tcmMultiple },
    { name: '中医药学-判断题', data: tcmJudge },
    { name: '中医药学-案例分析', data: tcmCase },
  ];

  let totalCreated = 0;

  for (const { name, data } of allQuestionArrays) {
    console.log(`📝 正在导入 ${name} (${data.length} 题)...`);

    for (let i = 0; i < data.length; i++) {
      const q = data[i];
      await prisma.question.create({
        data: {
          content: q.content,
          type: q.type,
          category: q.category,
          difficulty: q.difficulty,
          analysis: q.analysis,
          standardSource: q.standardSource || null,
          options: {
            create: q.options.map((opt) => ({
              optionKey: opt.optionKey,
              content: opt.content,
              isCorrect: opt.isCorrect,
            })),
          },
        },
      });
    }

    totalCreated += data.length;
    console.log(`✅ ${name} 导入完成`);
  }

  console.log(`\n🎉 种子数据导入完成！共导入 ${totalCreated} 道题目。`);
}

main()
  .catch((e) => {
    console.error('❌ 导入种子数据失败：', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });