-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "statusQuestionEnd" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "statusVideoEnd" INTEGER NOT NULL DEFAULT 0;
