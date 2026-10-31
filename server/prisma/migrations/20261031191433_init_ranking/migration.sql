-- CreateTable
CREATE TABLE "SnakeScore" (
    "id" UUID NOT NULL,
    "runId" UUID NOT NULL,
    "nickname" VARCHAR(24) NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SnakeScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SnakeScore_runId_key" ON "SnakeScore"("runId");

-- CreateIndex
CREATE INDEX "SnakeScore_score_createdAt_idx" ON "SnakeScore"("score" DESC, "createdAt");
