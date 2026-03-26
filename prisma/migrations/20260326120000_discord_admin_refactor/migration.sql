-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'DISCORD', 'HYBRID');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "isSuperadmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "forcePasswordReset" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "lastLoginAt" TIMESTAMP(3),
ADD COLUMN "authProvider" "AuthProvider" NOT NULL DEFAULT 'DISCORD',
ADD COLUMN "discordUserId" TEXT,
ADD COLUMN "discordUsername" TEXT,
ADD COLUMN "discordGlobalName" TEXT,
ADD COLUMN "discordAvatar" TEXT;

-- CreateTable
CREATE TABLE "DiscordSettings" (
  "id" TEXT NOT NULL,
  "guildId" TEXT,
  "guildName" TEXT,
  "approvalChannelId" TEXT,
  "approvalChannelName" TEXT,
  "rejectionChannelId" TEXT,
  "rejectionChannelName" TEXT,
  "updatedByUserId" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DiscordSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_discordUserId_key" ON "User"("discordUserId");

-- Seed/auth defaults for existing users
UPDATE "User"
SET "authProvider" = CASE WHEN "role" = 'ADMIN' THEN 'LOCAL' ELSE 'DISCORD' END,
    "isSuperadmin" = CASE WHEN "role" = 'ADMIN' THEN true ELSE false END;
