-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RequestChannel" AS ENUM ('DIRECT', 'GUIDED');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('NEW', 'QUALIFIED', 'IN_DISCUSSION', 'WON', 'LOST');

-- CreateTable
CREATE TABLE "ClientRequest" (
    "id" TEXT NOT NULL,
    "channel" "RequestChannel" NOT NULL,
    "locale" VARCHAR(2) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "email" VARCHAR(254),
    "whatsapp" VARCHAR(30),
    "message" VARCHAR(2000),
    "projectType" VARCHAR(20),
    "goal" VARCHAR(600),
    "problem" VARCHAR(600),
    "audience" VARCHAR(400),
    "context" VARCHAR(400),
    "constraints" VARCHAR(400),
    "budgetRange" VARCHAR(20),
    "deadline" VARCHAR(20),
    "successCriterion" VARCHAR(400),
    "qualificationScore" INTEGER,
    "status" "RequestStatus" NOT NULL DEFAULT 'NEW',
    "ipHash" CHAR(64),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientRequest_ipHash_createdAt_idx" ON "ClientRequest"("ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "ClientRequest_status_createdAt_idx" ON "ClientRequest"("status", "createdAt");

