-- Scope resume bullets to a user.
--
-- The column is added nullable first so existing rows survive, backfilled to
-- the original local author, and only then made NOT NULL. On a fresh database
-- resume_bullet is empty, so the backfill is a harmless no-op.

-- AlterTable
ALTER TABLE "public"."resume_bullet" ADD COLUMN "userId" TEXT;

-- Backfill: attach pre-existing bullets to the account that authored them.
UPDATE "public"."resume_bullet"
SET "userId" = (
    SELECT "id" FROM "public"."user"
    WHERE "email" = 'deguzmancyriljames@gmail.com'
)
WHERE "userId" IS NULL;

-- Any bullet still unattached has no owner to inherit and cannot satisfy the
-- NOT NULL constraint below; drop it rather than fail the migration.
DELETE FROM "public"."resume_bullet" WHERE "userId" IS NULL;

-- AlterTable
ALTER TABLE "public"."resume_bullet" ALTER COLUMN "userId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "resume_bullet_userId_idx" ON "public"."resume_bullet"("userId");

-- AddForeignKey
ALTER TABLE "public"."resume_bullet" ADD CONSTRAINT "resume_bullet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
