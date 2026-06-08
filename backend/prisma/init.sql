-- 院感培训系统数据库初始化脚本

-- 创建默认管理员用户
-- 注意：实际密码哈希是通过bcrypt生成的，这里使用 admin123 的哈希
-- 实际部署时建议通过种子数据创建

-- 创建测试医院数据
INSERT INTO `hospital` (`id`, `name`, `level`) VALUES
(1, '测试医院', 'COMMUNITY'),
(2, '社区服务中心', 'TOWNSHIP'),
(3, '村卫生室', 'VILLAGE')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 注意：这个脚本会在容器首次启动时自动执行
-- 实际的用户创建应该通过后端API或种子数据完成

-- 示例：创建一个测试用户（可选，取消注释即可使用）
-- INSERT INTO `user` (`username`, `password`, `realName`, `role`, `department`, `hospitalId`)
-- VALUES ('test', '$2a$10$...', '测试用户', 'DOCTOR', '内科', 1);
