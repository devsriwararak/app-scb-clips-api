/*
  Warnings:

  - Added the required column `newCompany` to the `MemberChangeCompany` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MemberChangeCompany" ADD COLUMN     "newCompany" TEXT NOT NULL;
