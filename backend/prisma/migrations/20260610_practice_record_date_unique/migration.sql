-- DropIndex
ALTER TABLE `PracticeQuestionRecord` DROP INDEX `PracticeQuestionRecord_userId_questionId_key`;

-- CreateIndex
CREATE UNIQUE INDEX `PracticeQuestionRecord_userId_questionId_date_key` ON `PracticeQuestionRecord`(`userId`, `questionId`, `date`);