-- CreateTable
CREATE TABLE "VideoToken" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "idCard" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VideoToken_token_key" ON "VideoToken"("token");
