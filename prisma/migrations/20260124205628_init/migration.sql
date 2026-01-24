-- CreateEnum
CREATE TYPE "AuthRole" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255),
    "email" VARCHAR(255),
    "emailVerified" TIMESTAMPTZ,
    "image" TEXT,
    "role" "AuthRole" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" VARCHAR(255) NOT NULL,
    "provider" VARCHAR(255) NOT NULL,
    "providerAccountId" VARCHAR(255) NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_token" (
    "identifier" TEXT NOT NULL,
    "expires" TIMESTAMPTZ NOT NULL,
    "token" TEXT NOT NULL,

    CONSTRAINT "verification_token_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "topic_xp_config" (
    "id" SERIAL NOT NULL,
    "topic_slug" VARCHAR(255) NOT NULL,
    "topic_title" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100) NOT NULL DEFAULT 'math',
    "description" TEXT,
    "difficulty" VARCHAR(50),
    "max_xp" INTEGER NOT NULL DEFAULT 1000,
    "base_task_xp" INTEGER NOT NULL DEFAULT 100,
    "daily_full_tasks" INTEGER NOT NULL DEFAULT 10,
    "daily_half_tasks" INTEGER NOT NULL DEFAULT 10,
    "multiplier_full" DECIMAL(4,2) NOT NULL DEFAULT 1.0,
    "multiplier_half" DECIMAL(4,2) NOT NULL DEFAULT 0.5,
    "multiplier_low" DECIMAL(4,2) NOT NULL DEFAULT 0.1,
    "multiplier_early" DECIMAL(4,2) NOT NULL DEFAULT 0.1,
    "level_thresholds" INTEGER[] DEFAULT ARRAY[1000, 2500, 4500, 7000, 10000]::INTEGER[],
    "daily_xp_decay" DECIMAL(3,2) NOT NULL DEFAULT 0.5,
    "min_xp_percent" DECIMAL(3,2) NOT NULL DEFAULT 0.1,
    "review_intervals" INTEGER[] DEFAULT ARRAY[1, 3, 7, 14, 30]::INTEGER[],
    "tags" TEXT[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topic_xp_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_topic_xp" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "topic_slug" VARCHAR(255) NOT NULL,
    "current_xp" INTEGER NOT NULL DEFAULT 0,
    "total_xp_earned" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 0,
    "last_activity" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "daily_tasks_count" INTEGER NOT NULL DEFAULT 0,
    "daily_tasks_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "srs_stage" INTEGER NOT NULL DEFAULT 0,
    "next_review_date" DATE,
    "last_practiced_date" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_topic_xp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_task_attempts" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "task_id" VARCHAR(255) NOT NULL,
    "topic_slug" VARCHAR(255) NOT NULL,
    "completed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "xp_earned" INTEGER NOT NULL DEFAULT 0,
    "is_correct" BOOLEAN NOT NULL DEFAULT true,
    "next_review_date" DATE,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "mastery_level" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_task_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "topic_xp_config_topic_slug_key" ON "topic_xp_config"("topic_slug");

-- CreateIndex
CREATE INDEX "idx_user_topic_xp_user" ON "user_topic_xp"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_topic_xp_topic" ON "user_topic_xp"("topic_slug");

-- CreateIndex
CREATE INDEX "idx_user_topic_xp_next_review" ON "user_topic_xp"("next_review_date");

-- CreateIndex
CREATE UNIQUE INDEX "user_topic_xp_user_id_topic_slug_key" ON "user_topic_xp"("user_id", "topic_slug");

-- CreateIndex
CREATE INDEX "idx_user_task_attempts_user_topic" ON "user_task_attempts"("user_id", "topic_slug");

-- CreateIndex
CREATE INDEX "idx_user_task_attempts_next_review" ON "user_task_attempts"("next_review_date");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_topic_xp" ADD CONSTRAINT "user_topic_xp_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_topic_xp" ADD CONSTRAINT "user_topic_xp_topic_slug_fkey" FOREIGN KEY ("topic_slug") REFERENCES "topic_xp_config"("topic_slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_task_attempts" ADD CONSTRAINT "user_task_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_task_attempts" ADD CONSTRAINT "user_task_attempts_topic_slug_fkey" FOREIGN KEY ("topic_slug") REFERENCES "topic_xp_config"("topic_slug") ON DELETE CASCADE ON UPDATE CASCADE;
