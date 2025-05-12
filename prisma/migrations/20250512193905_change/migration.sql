/*
  Warnings:

  - A unique constraint covering the columns `[idCard]` on the table `Member` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Member_idCard_key" ON "Member"("idCard");
