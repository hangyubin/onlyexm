import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('⚠️ 开始清除所有数据...');
  console.log('');

  // 只清除实际存在的表
  console.log('删除题目选项...');
  await prisma.questionOption.deleteMany();

  console.log('删除题目...');
  await prisma.question.deleteMany();

  console.log('删除错题本...');
  await prisma.wrongQuestion.deleteMany();

  console.log('删除每日练习记录...');
  await prisma.dailyPractice.deleteMany();

  console.log('删除院感学习要求...');
  await prisma.infectionRequirement.deleteMany();

  console.log('删除用户...');
  await prisma.user.deleteMany();

  console.log('删除医院...');
  await prisma.hospital.deleteMany();

  console.log('');
  console.log('✅ 所有数据已清除！');
}

main()
  .catch((e) => {
    console.error('清除数据失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
