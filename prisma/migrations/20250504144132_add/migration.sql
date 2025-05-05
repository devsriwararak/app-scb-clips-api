-- CreateTable
CREATE TABLE "Lecturer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAT" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lecturer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lecturer_name_key" ON "Lecturer"("name");
