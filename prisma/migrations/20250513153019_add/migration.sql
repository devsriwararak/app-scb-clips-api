-- CreateTable
CREATE TABLE "MemberChangeCompany" (
    "id" SERIAL NOT NULL,
    "oldCompany" TEXT NOT NULL,
    "memberId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberChangeCompany_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MemberChangeCompany" ADD CONSTRAINT "MemberChangeCompany_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
