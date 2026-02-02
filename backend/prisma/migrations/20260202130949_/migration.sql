-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('NONE', 'PENDING', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "verificationCardPath" TEXT,
ADD COLUMN     "verificationRejectReason" TEXT,
ADD COLUMN     "verificationRejectedAt" TIMESTAMP(3),
ADD COLUMN     "verificationSelfiePath" TEXT,
ADD COLUMN     "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "verificationSubmittedAt" TIMESTAMP(3),
ADD COLUMN     "verificationVerifiedAt" TIMESTAMP(3);
