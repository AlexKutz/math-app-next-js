/*
  Warnings:

  - You are about to drop the column `lesson_completed` on the `user_topic_xp` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user_topic_xp" DROP COLUMN "lesson_completed";

-- CreateTable
CREATE TABLE "comments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subject" VARCHAR(50) NOT NULL,
    "topic_slug" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "parent_id" UUID,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "is_approved" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_comments_subject_topic" ON "comments"("subject", "topic_slug");

-- CreateIndex
CREATE INDEX "idx_comments_user" ON "comments"("user_id");

-- CreateIndex
CREATE INDEX "idx_comments_created_at" ON "comments"("created_at");

-- CreateIndex
CREATE INDEX "idx_comments_approved" ON "comments"("is_approved");

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
