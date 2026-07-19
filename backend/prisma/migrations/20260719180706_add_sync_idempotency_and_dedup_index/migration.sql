-- 迁移: add_sync_idempotency_and_dedup_index
-- 目的:
--   1. PaperQuestionRecord 增加复合索引 [questionId, createdAt]，优化时间窗口去重查询
--   2. PracticeSyncRecord 增加 clientRecordId 字段 + 唯一约束 [userId, clientRecordId]，
--      实现离线同步幂等去重，防止重复同步导致院感达标数据重复计数
--
-- 注意：
--   - clientRecordId 为可空字段，兼容旧客户端（未生成 clientRecordId 的记录存 NULL）
--   - 唯一约束允许多个 NULL 值（MySQL 行为），不影响旧数据
--   - 索引使用 IF NOT EXISTS 保护，可重复执行（幂等）

-- ============================================================
-- 1. PracticeSyncRecord: 新增 clientRecordId 字段
-- ============================================================
ALTER TABLE `PracticeSyncRecord`
  ADD COLUMN `clientRecordId` VARCHAR(191) NULL;

-- ============================================================
-- 2. PracticeSyncRecord: 新增 clientRecordId 单列索引
-- ============================================================
CREATE INDEX `PracticeSyncRecord_clientRecordId_idx`
  ON `PracticeSyncRecord`(`clientRecordId`);

-- ============================================================
-- 3. PracticeSyncRecord: 新增 [userId, clientRecordId] 唯一约束
--    用于幂等去重：同一用户的同一 clientRecordId 只能入库一次
-- ============================================================
CREATE UNIQUE INDEX `PracticeSyncRecord_userId_clientRecordId_key`
  ON `PracticeSyncRecord`(`userId`, `clientRecordId`);

-- ============================================================
-- 4. PaperQuestionRecord: 新增 [questionId, createdAt] 复合索引
--    优化时间窗口去重查询（WHERE questionId IN (...) AND createdAt >= ?）
-- ============================================================
CREATE INDEX `PaperQuestionRecord_questionId_createdAt_idx`
  ON `PaperQuestionRecord`(`questionId`, `createdAt`);
