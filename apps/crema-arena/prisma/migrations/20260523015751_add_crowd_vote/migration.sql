-- AlterTable
ALTER TABLE "duels" ADD COLUMN     "crowd_votes_a" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "crowd_votes_b" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "photo_left_slot" "DuelSlot" NOT NULL DEFAULT 'a';

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "crowd_vote_enabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "crowd_votes" (
    "id" TEXT NOT NULL,
    "duel_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "side" "VoteSide" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crowd_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crowd_votes_duel_id_idx" ON "crowd_votes"("duel_id");

-- CreateIndex
CREATE UNIQUE INDEX "crowd_votes_duel_id_device_id_key" ON "crowd_votes"("duel_id", "device_id");

-- AddForeignKey
ALTER TABLE "crowd_votes" ADD CONSTRAINT "crowd_votes_duel_id_fkey" FOREIGN KEY ("duel_id") REFERENCES "duels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
