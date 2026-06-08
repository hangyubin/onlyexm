-- CreateTable
CREATE TABLE `Hospital` (
    `id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `level` ENUM('TOWNSHIP', 'COMMUNITY', 'VILLAGE') NOT NULL,

    INDEX `Hospital_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `realName` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'INFECTION_OFFICER', 'DEPT_HEAD', 'DOCTOR') NOT NULL,
    `department` VARCHAR(191) NOT NULL,
    `hospitalId` INTEGER NOT NULL,
    `isLocked` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_username_key`(`username`),
    INDEX `User_hospitalId_idx`(`hospitalId`),
    INDEX `User_role_idx`(`role`),
    INDEX `User_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Question` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `content` TEXT NOT NULL,
    `type` ENUM('SINGLE', 'MULTIPLE', 'JUDGE', 'CASE') NOT NULL,
    `category` ENUM('BASIC_THEORY', 'BASIC_KNOWLEDGE', 'BASIC_SKILL') NOT NULL,
    `infectionTag` ENUM('HAND_HYGIENE', 'MEDICAL_WASTE', 'EXPOSURE', 'DISINFECTION', 'MDRO', 'AIR_QUALITY') NULL,
    `difficulty` INTEGER NOT NULL DEFAULT 1,
    `analysis` TEXT NOT NULL,
    `standardSource` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `Question_type_idx`(`type`),
    INDEX `Question_category_idx`(`category`),
    INDEX `Question_infectionTag_idx`(`infectionTag`),
    INDEX `Question_createdAt_idx`(`createdAt`),
    INDEX `Question_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuestionOption` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `questionId` INTEGER NOT NULL,
    `optionKey` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `isCorrect` BOOLEAN NOT NULL,

    INDEX `QuestionOption_questionId_idx`(`questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Paper` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `totalScore` INTEGER NOT NULL,
    `passingScore` INTEGER NOT NULL DEFAULT 60,
    `durationMinutes` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Paper_isActive_idx`(`isActive`),
    INDEX `Paper_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaperQuestion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `paperId` INTEGER NOT NULL,
    `questionId` INTEGER NOT NULL,
    `score` INTEGER NOT NULL,

    INDEX `PaperQuestion_paperId_idx`(`paperId`),
    INDEX `PaperQuestion_questionId_idx`(`questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExamRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `paperId` INTEGER NOT NULL,
    `startTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endTime` DATETIME(3) NULL,
    `durationSeconds` INTEGER NULL,
    `score` INTEGER NULL,
    `infectionScore` INTEGER NULL,
    `isPassed` BOOLEAN NULL,
    `tabSwitchCount` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMIT', 'FORCE_SUBMIT') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ExamRecord_userId_idx`(`userId`),
    INDEX `ExamRecord_paperId_idx`(`paperId`),
    INDEX `ExamRecord_status_idx`(`status`),
    INDEX `ExamRecord_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AnswerDetail` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `examRecordId` INTEGER NOT NULL,
    `questionId` INTEGER NOT NULL,
    `userAnswer` TEXT NOT NULL,
    `isCorrect` BOOLEAN NOT NULL,
    `scoreObtained` INTEGER NOT NULL,

    INDEX `AnswerDetail_examRecordId_idx`(`examRecordId`),
    INDEX `AnswerDetail_questionId_idx`(`questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LearningRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `contentId` INTEGER NOT NULL,
    `contentTitle` VARCHAR(191) NOT NULL,
    `studyDurationSeconds` INTEGER NOT NULL,
    `completedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LearningRecord_userId_idx`(`userId`),
    INDEX `LearningRecord_contentId_idx`(`contentId`),
    INDEX `LearningRecord_completedAt_idx`(`completedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InfectionRequirement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `month` VARCHAR(191) NOT NULL,
    `requiredCount` INTEGER NOT NULL DEFAULT 20,
    `completedCount` INTEGER NOT NULL DEFAULT 0,
    `accuracyRate` DECIMAL(5, 2) NULL,
    `isLocked` BOOLEAN NOT NULL DEFAULT false,

    INDEX `InfectionRequirement_userId_idx`(`userId`),
    INDEX `InfectionRequirement_month_idx`(`month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OfflineSync` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `syncData` JSON NOT NULL,
    `syncStatus` ENUM('PENDING', 'SUCCESS', 'FAILED') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OfflineSync_userId_idx`(`userId`),
    INDEX `OfflineSync_syncStatus_idx`(`syncStatus`),
    INDEX `OfflineSync_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaperGenerationLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `paperId` INTEGER NOT NULL,
    `paperName` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PaperGenerationLog_userId_idx`(`userId`),
    INDEX `PaperGenerationLog_paperId_idx`(`paperId`),
    INDEX `PaperGenerationLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InfectionScenario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `expertAdvice` TEXT NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `InfectionScenario_isActive_idx`(`isActive`),
    INDEX `InfectionScenario_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScenarioRisk` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `scenarioId` INTEGER NOT NULL,
    `text` VARCHAR(191) NOT NULL,
    `isCorrect` BOOLEAN NOT NULL,

    INDEX `ScenarioRisk_scenarioId_idx`(`scenarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScenarioAction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `scenarioId` INTEGER NOT NULL,
    `text` VARCHAR(191) NOT NULL,
    `isCorrect` BOOLEAN NOT NULL,

    INDEX `ScenarioAction_scenarioId_idx`(`scenarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScenarioRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `scenarioId` INTEGER NOT NULL,
    `riskAnswers` TEXT NOT NULL,
    `actionAnswer` INTEGER NOT NULL,
    `riskScore` INTEGER NOT NULL,
    `actionScore` INTEGER NOT NULL,
    `riskLevel` VARCHAR(191) NOT NULL,
    `completedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ScenarioRecord_userId_idx`(`userId`),
    INDEX `ScenarioRecord_scenarioId_idx`(`scenarioId`),
    INDEX `ScenarioRecord_completedAt_idx`(`completedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OutbreakDrill` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OutbreakDrill_isActive_idx`(`isActive`),
    INDEX `OutbreakDrill_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OutbreakDrillRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `drillId` INTEGER NOT NULL,
    `stepsResult` JSON NOT NULL,
    `score` INTEGER NOT NULL,
    `reportText` TEXT NOT NULL,
    `completedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OutbreakDrillRecord_userId_idx`(`userId`),
    INDEX `OutbreakDrillRecord_drillId_idx`(`drillId`),
    INDEX `OutbreakDrillRecord_completedAt_idx`(`completedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WrongQuestion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `questionId` INTEGER NOT NULL,
    `wrongCount` INTEGER NOT NULL DEFAULT 1,
    `correctCount` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WrongQuestion_userId_idx`(`userId`),
    INDEX `WrongQuestion_questionId_idx`(`questionId`),
    INDEX `WrongQuestion_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DailyPractice` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `date` VARCHAR(191) NOT NULL,
    `questions` JSON NOT NULL,
    `answers` JSON NOT NULL,
    `score` INTEGER NOT NULL DEFAULT 0,
    `isCompleted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DailyPractice_userId_idx`(`userId`),
    INDEX `DailyPractice_date_idx`(`date`),
    INDEX `DailyPractice_isCompleted_idx`(`isCompleted`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PracticeSyncRecord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `questionId` INTEGER NOT NULL,
    `userAnswer` TEXT NOT NULL,
    `isCorrect` BOOLEAN NOT NULL,
    `syncTime` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PracticeSyncRecord_userId_idx`(`userId`),
    INDEX `PracticeSyncRecord_questionId_idx`(`questionId`),
    INDEX `PracticeSyncRecord_syncTime_idx`(`syncTime`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SystemConfig` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `configKey` VARCHAR(191) NOT NULL,
    `configValue` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SystemConfig_configKey_key`(`configKey`),
    INDEX `SystemConfig_configKey_idx`(`configKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConfigLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `configKey` VARCHAR(191) NOT NULL,
    `oldValue` VARCHAR(191) NULL,
    `newValue` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ConfigLog_userId_idx`(`userId`),
    INDEX `ConfigLog_configKey_idx`(`configKey`),
    INDEX `ConfigLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuestionOption` ADD CONSTRAINT `QuestionOption_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaperQuestion` ADD CONSTRAINT `PaperQuestion_paperId_fkey` FOREIGN KEY (`paperId`) REFERENCES `Paper`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaperQuestion` ADD CONSTRAINT `PaperQuestion_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamRecord` ADD CONSTRAINT `ExamRecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamRecord` ADD CONSTRAINT `ExamRecord_paperId_fkey` FOREIGN KEY (`paperId`) REFERENCES `Paper`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AnswerDetail` ADD CONSTRAINT `AnswerDetail_examRecordId_fkey` FOREIGN KEY (`examRecordId`) REFERENCES `ExamRecord`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AnswerDetail` ADD CONSTRAINT `AnswerDetail_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LearningRecord` ADD CONSTRAINT `LearningRecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InfectionRequirement` ADD CONSTRAINT `InfectionRequirement_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OfflineSync` ADD CONSTRAINT `OfflineSync_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaperGenerationLog` ADD CONSTRAINT `PaperGenerationLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaperGenerationLog` ADD CONSTRAINT `PaperGenerationLog_paperId_fkey` FOREIGN KEY (`paperId`) REFERENCES `Paper`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScenarioRisk` ADD CONSTRAINT `ScenarioRisk_scenarioId_fkey` FOREIGN KEY (`scenarioId`) REFERENCES `InfectionScenario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScenarioAction` ADD CONSTRAINT `ScenarioAction_scenarioId_fkey` FOREIGN KEY (`scenarioId`) REFERENCES `InfectionScenario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScenarioRecord` ADD CONSTRAINT `ScenarioRecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScenarioRecord` ADD CONSTRAINT `ScenarioRecord_scenarioId_fkey` FOREIGN KEY (`scenarioId`) REFERENCES `InfectionScenario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OutbreakDrillRecord` ADD CONSTRAINT `OutbreakDrillRecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OutbreakDrillRecord` ADD CONSTRAINT `OutbreakDrillRecord_drillId_fkey` FOREIGN KEY (`drillId`) REFERENCES `OutbreakDrill`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WrongQuestion` ADD CONSTRAINT `WrongQuestion_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WrongQuestion` ADD CONSTRAINT `WrongQuestion_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DailyPractice` ADD CONSTRAINT `DailyPractice_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PracticeSyncRecord` ADD CONSTRAINT `PracticeSyncRecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PracticeSyncRecord` ADD CONSTRAINT `PracticeSyncRecord_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConfigLog` ADD CONSTRAINT `ConfigLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
