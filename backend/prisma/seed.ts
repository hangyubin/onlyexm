/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始创建种子数据...');
  console.log('');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const hospital1 = await prisma.hospital.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: '测试医院',
      level: 'COMMUNITY',
    },
  });
  console.log('🏥 创建医院:', hospital1.name);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      realName: '系统管理员',
      role: 'ADMIN',
      department: '院感科',
      hospitalId: 1,
      isLocked: false,
    },
  });
  console.log('👤 创建管理员:', admin.username);

  const officer = await prisma.user.upsert({
    where: { username: 'officer' },
    update: {},
    create: {
      username: 'officer',
      password: hashedPassword,
      realName: '院感专员',
      role: 'INFECTION_OFFICER',
      department: '院感科',
      hospitalId: 1,
      isLocked: false,
    },
  });
  console.log('👤 创建院感专员:', officer.username);

  const deptHead = await prisma.user.upsert({
    where: { username: 'depthead' },
    update: {},
    create: {
      username: 'depthead',
      password: hashedPassword,
      realName: '内科主任',
      role: 'DEPT_HEAD',
      department: '内科',
      hospitalId: 1,
      isLocked: false,
    },
  });
  console.log('👤 创建科室主任:', deptHead.username);

  const medicalAffairs = await prisma.user.upsert({
    where: { username: 'medical' },
    update: {},
    create: {
      username: 'medical',
      password: hashedPassword,
      realName: '医务科科长',
      role: 'MEDICAL_AFFAIRS',
      department: '医务科',
      hospitalId: 1,
      isLocked: false,
    },
  });
  console.log('👤 创建医务科:', medicalAffairs.username);

  const viceDean = await prisma.user.upsert({
    where: { username: 'vicedean' },
    update: {},
    create: {
      username: 'vicedean',
      password: hashedPassword,
      realName: '业务院长',
      role: 'VICE_DEAN',
      department: '院办',
      hospitalId: 1,
      isLocked: false,
    },
  });
  console.log('👤 创建业务院长:', viceDean.username);

  const doctor = await prisma.user.upsert({
    where: { username: 'doctor' },
    update: {},
    create: {
      username: 'doctor',
      password: hashedPassword,
      realName: '张医生',
      role: 'DOCTOR',
      department: '内科',
      hospitalId: 1,
      isLocked: false,
    },
  });
  console.log('👤 创建医生:', doctor.username);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const users = [admin, officer, deptHead, medicalAffairs, viceDean, doctor];

  for (const user of users) {
    const existing = await prisma.infectionRequirement.findFirst({
      where: { userId: user.id, month: currentMonth },
    });

    if (!existing) {
      await prisma.infectionRequirement.create({
        data: {
          userId: user.id,
          month: currentMonth,
          requiredCount: 20,
          completedCount: 0,
          accuracyRate: 0,
          isLocked: false,
        },
      });
      console.log(`📋 创建院感要求 for ${user.username}:`, currentMonth);
    } else {
      console.log(`📋 院感要求已存在 for ${user.username}`);
    }
  }

  console.log('');
  console.log('📝 开始创建字典数据...');

  const dictData = [
    {
      category: 'ROLE',
      items: [
        { code: 'ADMIN', name: '系统管理员', sortOrder: 1 },
        { code: 'INFECTION_OFFICER', name: '院感专员', sortOrder: 2 },
        { code: 'MEDICAL_AFFAIRS', name: '医务科', sortOrder: 3 },
        { code: 'VICE_DEAN', name: '业务院长', sortOrder: 4 },
        { code: 'DEPT_HEAD', name: '科室主任', sortOrder: 5 },
        { code: 'DOCTOR', name: '医生', sortOrder: 6 },
        { code: 'NURSE', name: '护士', sortOrder: 7 },
      ],
    },
    {
      category: 'DEPARTMENT',
      items: [
        { code: 'INFECTION_DEPT', name: '院感科', sortOrder: 1 },
        { code: 'INTERNAL', name: '内科', sortOrder: 2 },
        { code: 'SURGERY', name: '外科', sortOrder: 3 },
        { code: 'ICU', name: 'ICU', sortOrder: 4 },
        { code: 'EMERGENCY', name: '急诊科', sortOrder: 5 },
        { code: 'PEDIATRICS', name: '儿科', sortOrder: 6 },
        { code: 'GYNECOLOGY', name: '妇产科', sortOrder: 7 },
        { code: 'ONCOLOGY', name: '肿瘤科', sortOrder: 8 },
      ],
    },
    {
      category: 'HOSPITAL_LEVEL',
      items: [
        { code: 'COMMUNITY', name: '社区医院', sortOrder: 1 },
        { code: 'TOWN', name: '乡镇卫生院', sortOrder: 2 },
        { code: 'COUNTY', name: '县级医院', sortOrder: 3 },
        { code: 'CITY', name: '市级医院', sortOrder: 4 },
        { code: 'PROVINCIAL', name: '省级医院', sortOrder: 5 },
      ],
    },
    {
      category: 'QUESTION_TYPE',
      items: [
        { code: 'SINGLE', name: '单选题', sortOrder: 1 },
        { code: 'MULTIPLE', name: '多选题', sortOrder: 2 },
        { code: 'JUDGE', name: '判断题', sortOrder: 3 },
        { code: 'CASE', name: '案例分析', sortOrder: 4 },
      ],
    },
    {
      // 合并后的 QUESTION_CATEGORY：一级分类 + INFECTION_TAG 作为院感知识的子分类
      category: 'QUESTION_CATEGORY',
      items: [
        { code: 'BASIC_THEORY', name: '基础理论', sortOrder: 1, children: [] },
        { code: 'BASIC_KNOWLEDGE', name: '基础知识', sortOrder: 2, children: [] },
        { code: 'BASIC_SKILL', name: '基本技能', sortOrder: 3, children: [] },
        {
          code: 'INFECTION_KNOWLEDGE', name: '院感知识', sortOrder: 4,
          children: [
            { code: 'HAND_HYGIENE', name: '手卫生', sortOrder: 1 },
            { code: 'MEDICAL_WASTE', name: '医疗废物', sortOrder: 2 },
            { code: 'EXPOSURE', name: '职业暴露', sortOrder: 3 },
            { code: 'DISINFECTION', name: '消毒隔离', sortOrder: 4 },
            { code: 'ISOLATION', name: '隔离防护', sortOrder: 5 },
            { code: 'STERILIZATION', name: '无菌操作', sortOrder: 6 },
            { code: 'MDRO', name: '多重耐药菌', sortOrder: 7 },
            { code: 'AIR_QUALITY', name: '空气质量', sortOrder: 8 },
          ],
        },
        { code: 'PUBLIC', name: '公共卫生', sortOrder: 5, children: [] },
        { code: 'TRADITIONAL_CHINESE', name: '中医药学', sortOrder: 6, children: [] },
      ],
    },
    {
      category: 'EXAM_STATUS',
      items: [
        { code: 'IN_PROGRESS', name: '进行中', sortOrder: 1 },
        { code: 'SUBMITTED', name: '已提交', sortOrder: 2 },
        { code: 'AUTO_SUBMIT', name: '自动提交', sortOrder: 3 },
        { code: 'FORCE_SUBMIT', name: '强制提交', sortOrder: 4 },
      ],
    },
  ];

  for (const dict of dictData) {
    for (const item of dict.items) {
      const existing = await prisma.systemDict.findUnique({
        where: { category_code: { category: dict.category, code: item.code } },
      });

      let parentId: number | null = null;

      if (existing) {
        parentId = (existing as any).parentId;
        await prisma.systemDict.update({
          where: { id: existing.id },
          data: { name: item.name, sortOrder: item.sortOrder },
        });
      } else {
        const created = await prisma.systemDict.create({
          data: {
            category: dict.category,
            code: item.code,
            name: item.name,
            sortOrder: item.sortOrder,
            isActive: true,
            parentId: null,
          },
        });
        parentId = created.id;
      }

      // 创建子分类
      if ((item as any).children && (item as any).children.length > 0) {
        for (const child of (item as any).children) {
          const childExisting = await prisma.systemDict.findUnique({
            where: { category_code: { category: dict.category, code: child.code } },
          });
          if (childExisting) {
            await prisma.systemDict.update({
              where: { id: childExisting.id },
              data: { name: child.name, sortOrder: child.sortOrder, parentId },
            });
          } else {
            await prisma.systemDict.create({
              data: {
                category: dict.category,
                code: child.code,
                name: child.name,
                sortOrder: child.sortOrder,
                isActive: true,
                parentId,
              },
            });
          }
        }
      }
    }
    console.log(`📖 创建字典: ${dict.category} (${dict.items.length}项)`);
  }

  console.log('');
  console.log('📝 开始创建题库...');

  await prisma.questionOption.deleteMany();
  await prisma.question.deleteMany({ where: { deletedAt: null } });
  console.log('🗑️ 清空现有题目...');

  const questions = [
    {
      content: '医学基础理论中，人体最大的器官是？',
      type: 'SINGLE',
      category: 'BASIC_THEORY',
      difficulty: 1,
      analysis: '皮肤是人体最大的器官，成人皮肤总面积约1.5-2平方米，重量约占体重的16%。',
      options: [
        { key: 'A', content: '肝脏', isCorrect: false },
        { key: 'B', content: '皮肤', isCorrect: true },
        { key: 'C', content: '心脏', isCorrect: false },
        { key: 'D', content: '大脑', isCorrect: false },
      ],
    },
    {
      content: '细胞的基本结构包括？',
      type: 'MULTIPLE',
      category: 'BASIC_THEORY',
      difficulty: 1,
      analysis: '细胞基本结构包括细胞膜、细胞质、细胞核三部分。',
      options: [
        { key: 'A', content: '细胞膜', isCorrect: true },
        { key: 'B', content: '细胞质', isCorrect: true },
        { key: 'C', content: '细胞核', isCorrect: true },
        { key: 'D', content: '细胞壁', isCorrect: false },
      ],
    },
    {
      content: '正常人体体温的平均值是？',
      type: 'SINGLE',
      category: 'BASIC_THEORY',
      difficulty: 1,
      analysis: '正常人体腋下体温平均值为36-37℃，口腔体温为36.3-37.5℃，直肠体温为36.5-37.7℃。',
      options: [
        { key: 'A', content: '35℃', isCorrect: false },
        { key: 'B', content: '36-37℃', isCorrect: true },
        { key: 'C', content: '37-38℃', isCorrect: false },
        { key: 'D', content: '38-39℃', isCorrect: false },
      ],
    },
    {
      content: '人体血液循环分为体循环和肺循环。',
      type: 'JUDGE',
      category: 'BASIC_THEORY',
      difficulty: 1,
      analysis: '人体血液循环包括体循环（大循环）和肺循环（小循环）两部分。',
      options: [
        { key: 'A', content: '正确', isCorrect: true },
        { key: 'B', content: '错误', isCorrect: false },
      ],
    },
    {
      content: '人体有多少对脑神经？',
      type: 'SINGLE',
      category: 'BASIC_THEORY',
      difficulty: 2,
      analysis: '人体有12对脑神经，分别负责不同的感觉和运动功能。',
      options: [
        { key: 'A', content: '8对', isCorrect: false },
        { key: 'B', content: '10对', isCorrect: false },
        { key: 'C', content: '12对', isCorrect: true },
        { key: 'D', content: '14对', isCorrect: false },
      ],
    },
    {
      content: '以下哪些属于生命体征？',
      type: 'MULTIPLE',
      category: 'BASIC_KNOWLEDGE',
      difficulty: 1,
      analysis: '生命体征包括体温、脉搏，呼吸、血压，是评估生命状态的基本指标。',
      options: [
        { key: 'A', content: '体温', isCorrect: true },
        { key: 'B', content: '脉搏', isCorrect: true },
        { key: 'C', content: '呼吸', isCorrect: true },
        { key: 'D', content: '血压', isCorrect: true },
      ],
    },
    {
      content: '正常成年人的心率范围是？',
      type: 'SINGLE',
      category: 'BASIC_KNOWLEDGE',
      difficulty: 1,
      analysis: '正常成年人静息心率为60-100次/分钟，运动员可能偏低。',
      options: [
        { key: 'A', content: '40-60次/分钟', isCorrect: false },
        { key: 'B', content: '60-100次/分钟', isCorrect: true },
        { key: 'C', content: '100-120次/分钟', isCorrect: false },
        { key: 'D', content: '120-140次/分钟', isCorrect: false },
      ],
    },
    {
      content: '测量血压时，袖带松紧度以能伸入几指为宜？',
      type: 'SINGLE',
      category: 'BASIC_KNOWLEDGE',
      difficulty: 1,
      analysis: '测量血压时，袖带松紧度以能伸入一指缝隙为宜，过紧会使血压值偏低，过松会使血压值偏高。',
      options: [
        { key: 'A', content: '半指', isCorrect: false },
        { key: 'B', content: '一指', isCorrect: true },
        { key: 'C', content: '两指', isCorrect: false },
        { key: 'D', content: '三指', isCorrect: false },
      ],
    },
    {
      content: '意识障碍分为嗜睡、昏睡、昏迷三个等级。',
      type: 'JUDGE',
      category: 'BASIC_KNOWLEDGE',
      difficulty: 2,
      analysis: '意识障碍分为嗜睡、昏睡、浅昏迷、深昏迷等不同程度。',
      options: [
        { key: 'A', content: '正确', isCorrect: false },
        { key: 'B', content: '错误', isCorrect: true },
      ],
    },
    {
      content: '以下哪种颜色的痰液提示可能有细菌感染？',
      type: 'SINGLE',
      category: 'BASIC_KNOWLEDGE',
      difficulty: 2,
      analysis: '黄脓痰通常提示细菌感染，白痰可能为病毒感染或正常情况。',
      options: [
        { key: 'A', content: '白色', isCorrect: false },
        { key: 'B', content: '黄色', isCorrect: true },
        { key: 'C', content: '绿色', isCorrect: false },
        { key: 'D', content: '粉红色', isCorrect: false },
      ],
    },
    {
      content: '七步洗手法的正确顺序是？',
      type: 'SINGLE',
      category: 'BASIC_SKILL',
      difficulty: 1,
      analysis: '七步洗手法顺序：内-外-夹-弓-大-立-腕。',
      options: [
        { key: 'A', content: '内-外-夹-弓-大-立-腕', isCorrect: true },
        { key: 'B', content: '内-夹-外-弓-大-立-腕', isCorrect: false },
        { key: 'C', content: '外-内-夹-弓-大-立-腕', isCorrect: false },
        { key: 'D', content: '内-外-大-夹-弓-立-腕', isCorrect: false },
      ],
    },
    {
      content: '无菌操作时，无菌物品应放置在？',
      type: 'SINGLE',
      category: 'BASIC_SKILL',
      difficulty: 1,
      analysis: '无菌物品应放置在无菌区域内，避免跨越无菌区。',
      options: [
        { key: 'A', content: '无菌区域内', isCorrect: true },
        { key: 'B', content: '无菌区域边缘', isCorrect: false },
        { key: 'C', content: '非无菌区域', isCorrect: false },
        { key: 'D', content: '操作者身后', isCorrect: false },
      ],
    },
    {
      content: '静脉输液时，穿刺部位选择应注意？',
      type: 'MULTIPLE',
      category: 'BASIC_SKILL',
      difficulty: 2,
      analysis: '静脉输液穿刺部位应选择粗直、弹性好、避开关节和静脉瓣的血管。',
      options: [
        { key: 'A', content: '选择粗直的血管', isCorrect: true },
        { key: 'B', content: '选择弹性好的血管', isCorrect: true },
        { key: 'C', content: '避开关节部位', isCorrect: true },
        { key: 'D', content: '避开静脉瓣', isCorrect: true },
      ],
    },
    {
      content: '体温计测量时间至少需要5分钟。',
      type: 'JUDGE',
      category: 'BASIC_SKILL',
      difficulty: 1,
      analysis: '腋下体温计测量时间至少需要5-10分钟，以确保测量准确。',
      options: [
        { key: 'A', content: '正确', isCorrect: true },
        { key: 'B', content: '错误', isCorrect: false },
      ],
    },
    {
      content: '心肺复苏胸外按压的频率是？',
      type: 'SINGLE',
      category: 'BASIC_SKILL',
      difficulty: 2,
      analysis: '心肺复苏胸外按压频率为100-120次/分钟。',
      options: [
        { key: 'A', content: '60-80次/分钟', isCorrect: false },
        { key: 'B', content: '80-100次/分钟', isCorrect: false },
        { key: 'C', content: '100-120次/分钟', isCorrect: true },
        { key: 'D', content: '120-140次/分钟', isCorrect: false },
      ],
    },
    {
      content: '医疗废物应放置在什么颜色的容器中？',
      type: 'SINGLE',
      category: 'INFECTION_KNOWLEDGE',
      infectionTag: 'MEDICAL_WASTE',
      difficulty: 1,
      analysis: '医疗废物应放置在黄色专用医疗废物容器中。',
      options: [
        { key: 'A', content: '黄色', isCorrect: true },
        { key: 'B', content: '红色', isCorrect: false },
        { key: 'C', content: '蓝色', isCorrect: false },
        { key: 'D', content: '绿色', isCorrect: false },
      ],
    },
    {
      content: '手卫生的五个时刻包括？',
      type: 'MULTIPLE',
      category: 'INFECTION_KNOWLEDGE',
      infectionTag: 'HAND_HYGIENE',
      difficulty: 1,
      analysis: 'WHO手卫生五个时刻：接触患者前、无菌操作前、接触患者血液体液后、接触患者后、接触患者周围环境后。',
      options: [
        { key: 'A', content: '接触患者前', isCorrect: true },
        { key: 'B', content: '无菌操作前', isCorrect: true },
        { key: 'C', content: '接触患者后', isCorrect: true },
        { key: 'D', content: '接触患者周围环境后', isCorrect: true },
      ],
    },
    {
      content: '发生锐器伤后的紧急处理流程是？',
      type: 'SINGLE',
      category: 'INFECTION_KNOWLEDGE',
      infectionTag: 'EXPOSURE',
      difficulty: 1,
      analysis: '锐器伤紧急处理：一挤二冲三消四报告。',
      options: [
        { key: 'A', content: '挤压→冲洗→消毒→报告', isCorrect: true },
        { key: 'B', content: '包扎→报告→消毒', isCorrect: false },
        { key: 'C', content: '消毒→报告→包扎', isCorrect: false },
        { key: 'D', content: '报告→消毒→包扎', isCorrect: false },
      ],
    },
    {
      content: '多重耐药菌患者应采取接触隔离。',
      type: 'JUDGE',
      category: 'INFECTION_KNOWLEDGE',
      infectionTag: 'MDRO',
      difficulty: 1,
      analysis: '多重耐药菌感染患者应采取接触隔离措施，防止交叉感染。',
      options: [
        { key: 'A', content: '正确', isCorrect: true },
        { key: 'B', content: '错误', isCorrect: false },
      ],
    },
    {
      content: '紫外线消毒灯的有效使用时间是？',
      type: 'SINGLE',
      category: 'INFECTION_KNOWLEDGE',
      infectionTag: 'DISINFECTION',
      difficulty: 2,
      analysis: '紫外线消毒灯的有效使用时间为1000小时，超过后应及时更换。',
      options: [
        { key: 'A', content: '500小时', isCorrect: false },
        { key: 'B', content: '1000小时', isCorrect: true },
        { key: 'C', content: '2000小时', isCorrect: false },
        { key: 'D', content: '5000小时', isCorrect: false },
      ],
    },
    {
      content: '我国法定传染病分为几类？',
      type: 'SINGLE',
      category: 'PUBLIC',
      difficulty: 1,
      analysis: '我国法定传染病分为甲、乙、丙三类，共40种。',
      options: [
        { key: 'A', content: '两类', isCorrect: false },
        { key: 'B', content: '三类', isCorrect: true },
        { key: 'C', content: '四类', isCorrect: false },
        { key: 'D', content: '五类', isCorrect: false },
      ],
    },
    {
      content: '以下哪些属于甲类传染病？',
      type: 'MULTIPLE',
      category: 'PUBLIC',
      difficulty: 2,
      analysis: '甲类传染病包括鼠疫和霍乱，是需要强制管理的烈性传染病。',
      options: [
        { key: 'A', content: '鼠疫', isCorrect: true },
        { key: 'B', content: '霍乱', isCorrect: true },
        { key: 'C', content: '流感', isCorrect: false },
        { key: 'D', content: '手足口病', isCorrect: false },
      ],
    },
    {
      content: '传染病的传播途径包括？',
      type: 'MULTIPLE',
      category: 'PUBLIC',
      difficulty: 1,
      analysis: '传染病常见传播途径包括呼吸道传播、消化道传播、接触传播、血液传播、虫媒传播等。',
      options: [
        { key: 'A', content: '呼吸道传播', isCorrect: true },
        { key: 'B', content: '消化道传播', isCorrect: true },
        { key: 'C', content: '接触传播', isCorrect: true },
        { key: 'D', content: '血液传播', isCorrect: true },
      ],
    },
    {
      content: '接种疫苗是预防传染病最有效的手段。',
      type: 'JUDGE',
      category: 'PUBLIC',
      difficulty: 1,
      analysis: '接种疫苗是预防传染病最经济、最有效的手段。',
      options: [
        { key: 'A', content: '正确', isCorrect: true },
        { key: 'B', content: '错误', isCorrect: false },
      ],
    },
    {
      content: '突发公共卫生事件的预警级别分为几级？',
      type: 'SINGLE',
      category: 'PUBLIC',
      difficulty: 2,
      analysis: '突发公共卫生事件预警级别分为四级：特别重大(I级)、重大(II级)、较大(III级)、一般(IV级)。',
      options: [
        { key: 'A', content: '三级', isCorrect: false },
        { key: 'B', content: '四级', isCorrect: true },
        { key: 'C', content: '五级', isCorrect: false },
        { key: 'D', content: '六级', isCorrect: false },
      ],
    },
    {
      content: '中医的基本理论包括？',
      type: 'MULTIPLE',
      category: 'TRADITIONAL_CHINESE',
      difficulty: 1,
      analysis: '中医基本理论包括阴阳学说、五行学说、脏腑学说、经络学说等。',
      options: [
        { key: 'A', content: '阴阳学说', isCorrect: true },
        { key: 'B', content: '五行学说', isCorrect: true },
        { key: 'C', content: '脏腑学说', isCorrect: true },
        { key: 'D', content: '经络学说', isCorrect: true },
      ],
    },
    {
      content: '中医四诊包括？',
      type: 'SINGLE',
      category: 'TRADITIONAL_CHINESE',
      difficulty: 1,
      analysis: '中医四诊包括望、闻、问、切四种诊断方法。',
      options: [
        { key: 'A', content: '望、闻、问、切', isCorrect: true },
        { key: 'B', content: '望、闻、问、听', isCorrect: false },
        { key: 'C', content: '看、闻、问、切', isCorrect: false },
        { key: 'D', content: '望、听、问、切', isCorrect: false },
      ],
    },
    {
      content: '中药的四气是指？',
      type: 'MULTIPLE',
      category: 'TRADITIONAL_CHINESE',
      difficulty: 2,
      analysis: '中药的四气指寒、热、温、凉四种药性。',
      options: [
        { key: 'A', content: '寒', isCorrect: true },
        { key: 'B', content: '热', isCorrect: true },
        { key: 'C', content: '温', isCorrect: true },
        { key: 'D', content: '凉', isCorrect: true },
      ],
    },
    {
      content: '中医认为"脾主运化"。',
      type: 'JUDGE',
      category: 'TRADITIONAL_CHINESE',
      difficulty: 1,
      analysis: '中医认为脾主运化，包括运化水谷和运化水液两个方面。',
      options: [
        { key: 'A', content: '正确', isCorrect: true },
        { key: 'B', content: '错误', isCorrect: false },
      ],
    },
    {
      content: '针灸治疗的基本原则是？',
      type: 'SINGLE',
      category: 'TRADITIONAL_CHINESE',
      difficulty: 2,
      analysis: '针灸治疗的基本原则包括补虚泻实、清热温寒、治病求本、三因制宜。',
      options: [
        { key: 'A', content: '补虚泻实', isCorrect: true },
        { key: 'B', content: '活血化瘀', isCorrect: false },
        { key: 'C', content: '清热解毒', isCorrect: false },
        { key: 'D', content: '健脾养胃', isCorrect: false },
      ],
    },
  ];

  for (const q of questions) {
    const { options, ...questionData } = q;

    // 如果有 infectionTag，同时设置 subCategory
    const dataWithSubCategory: any = { ...questionData };
    if ((questionData as any).infectionTag) {
      dataWithSubCategory.subCategory = (questionData as any).infectionTag;
    }

    const question = await prisma.question.create({
      data: {
        ...dataWithSubCategory,
        options: {
          create: options.map(opt => ({
            optionKey: opt.key,
            content: opt.content,
            isCorrect: opt.isCorrect,
          })),
        },
      },
    });
    console.log('📝 创建题目:', question.content.substring(0, 30) + '...');
  }

  console.log('');
  console.log('✅ 种子数据创建完成！');
  console.log('');
  console.log('📊 数据统计：');
  console.log(`  - 医院: 1家`);
  console.log(`  - 用户: ${users.length}个`);
  console.log(`  - 题目: ${questions.length}道`);
  console.log(`  - 字典: ${dictData.length}类`);
  console.log('');
  console.log('🔐 默认账号信息（密码均为: admin123）：');
  console.log('  【管理后台】');
  console.log('  - 系统管理员: admin');
  console.log('  - 院感专员: officer');
  console.log('  - 医务科: medical');
  console.log('  - 业务院长: vicedean');
  console.log('  - 科室主任: depthead');
  console.log('  【普通用户】');
  console.log('  - 医生: doctor');
}

main()
  .catch((e) => {
    console.error('创建种子数据失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });