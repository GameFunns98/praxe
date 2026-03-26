-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'COMMAND_STAFF', 'TRAINING_OFFICER', 'TRAINEE');
CREATE TYPE "PracticeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'LATE_PENDING', 'LATE_APPROVED', 'CANCELLED');
CREATE TYPE "NoteType" AS ENUM ('EXCUSE', 'WARNING', 'SANCTION', 'INTERNAL_NOTE');

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "callsign" TEXT NOT NULL,
    "rankTitle" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PracticeRequirement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requiredMinutes" INTEGER NOT NULL DEFAULT 900,
    "remainingMinutes" INTEGER NOT NULL DEFAULT 900,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PracticeRequirement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PracticeRecord" (
    "id" TEXT NOT NULL,
    "traineeId" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedWithinOneHour" BOOLEAN NOT NULL,
    "status" "PracticeStatus" NOT NULL,
    "traineeSignature" TEXT NOT NULL,
    "supervisorSignature" TEXT,
    "supervisorComment" TEXT,
    "adminNote" TEXT,
    "deductedMinutes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PracticeRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExcuseOrNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NoteType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExcuseOrNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "PracticeRequirement_userId_key" ON "PracticeRequirement"("userId");
CREATE INDEX "PracticeRecord_traineeId_startAt_endAt_idx" ON "PracticeRecord"("traineeId", "startAt", "endAt");
CREATE INDEX "PracticeRecord_supervisorId_status_idx" ON "PracticeRecord"("supervisorId", "status");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

ALTER TABLE "PracticeRequirement" ADD CONSTRAINT "PracticeRequirement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PracticeRecord" ADD CONSTRAINT "PracticeRecord_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PracticeRecord" ADD CONSTRAINT "PracticeRecord_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExcuseOrNote" ADD CONSTRAINT "ExcuseOrNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExcuseOrNote" ADD CONSTRAINT "ExcuseOrNote_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
