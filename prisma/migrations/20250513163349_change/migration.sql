/*
  Warnings:

  - You are about to drop the column `oldCompany` on the `MemberChangeCompany` table. All the data in the column will be lost.
  - Added the required column `oldCompanyId` to the `MemberChangeCompany` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MemberChangeCompany" DROP COLUMN "oldCompany",
ADD COLUMN     "oldCompanyId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "MemberChangeCompany" ADD CONSTRAINT "MemberChangeCompany_oldCompanyId_fkey" FOREIGN KEY ("oldCompanyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
