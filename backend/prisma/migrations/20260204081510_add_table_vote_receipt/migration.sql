-- CreateTable
CREATE TABLE "VoteReceipt" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "electionId" BIGINT NOT NULL,
    "candidateId" BIGINT NOT NULL,
    "txHash" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoteReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VoteReceipt_studentId_electionId_key" ON "VoteReceipt"("studentId", "electionId");

-- AddForeignKey
ALTER TABLE "VoteReceipt" ADD CONSTRAINT "VoteReceipt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
