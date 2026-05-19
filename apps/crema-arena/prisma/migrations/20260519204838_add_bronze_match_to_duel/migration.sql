-- AlterTable
ALTER TABLE "duels" ADD COLUMN     "bronze_duel_id" TEXT,
ADD COLUMN     "is_bronze_match" BOOLEAN NOT NULL DEFAULT false;
