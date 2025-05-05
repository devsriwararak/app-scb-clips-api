-- CreateTable
CREATE TABLE "QuestionEnd" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAT" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionEnd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionEndList" (
    "id" SERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,
    "questionEndId" INTEGER NOT NULL,
    "createdAT" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionEndList_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuestionEnd_name_key" ON "QuestionEnd"("name");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionEndList_question_key" ON "QuestionEndList"("question");

-- AddForeignKey
ALTER TABLE "QuestionEndList" ADD CONSTRAINT "QuestionEndList_questionEndId_fkey" FOREIGN KEY ("questionEndId") REFERENCES "QuestionEnd"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
