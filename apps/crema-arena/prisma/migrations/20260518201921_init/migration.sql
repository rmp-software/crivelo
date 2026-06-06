-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'organizer');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('setup', 'running', 'finished');

-- CreateEnum
CREATE TYPE "EntryStatus" AS ENUM ('active', 'eliminated', 'wildcard_in', 'dropped_out');

-- CreateEnum
CREATE TYPE "DuelStatus" AS ENUM ('pending', 'in_progress', 'completed', 'walkover');

-- CreateEnum
CREATE TYPE "WildcardType" AS ENUM ('walkover', 'manual', 'random');

-- CreateEnum
CREATE TYPE "DuelSlot" AS ENUM ('a', 'b');

-- CreateEnum
CREATE TYPE "VoteSide" AS ENUM ('a', 'b');

-- CreateTable
CREATE TABLE "organizers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'organizer',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "photo_url" TEXT NOT NULL,
    "coffee_shop" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "organizer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "judges_count" INTEGER NOT NULL DEFAULT 3,
    "status" "EventStatus" NOT NULL DEFAULT 'setup',
    "bracket_size" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_entries" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "competitor_id" TEXT NOT NULL,
    "seed" INTEGER,
    "status" "EntryStatus" NOT NULL DEFAULT 'active',
    "eliminated_at_round" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duels" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "entry_a_id" TEXT,
    "entry_b_id" TEXT,
    "votes_a" INTEGER NOT NULL DEFAULT 0,
    "votes_b" INTEGER NOT NULL DEFAULT 0,
    "winner_entry_id" TEXT,
    "status" "DuelStatus" NOT NULL DEFAULT 'pending',
    "wildcard_type" "WildcardType",
    "next_duel_id" TEXT,
    "next_duel_slot" "DuelSlot",
    "pour_photo_url" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "duels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" TEXT NOT NULL,
    "duel_id" TEXT NOT NULL,
    "side" "VoteSide" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizers_email_key" ON "organizers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "event_entries_event_id_competitor_id_key" ON "event_entries"("event_id", "competitor_id");

-- AddForeignKey
ALTER TABLE "competitors" ADD CONSTRAINT "competitors_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "organizers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "organizers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_entries" ADD CONSTRAINT "event_entries_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_entries" ADD CONSTRAINT "event_entries_competitor_id_fkey" FOREIGN KEY ("competitor_id") REFERENCES "competitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duels" ADD CONSTRAINT "duels_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duels" ADD CONSTRAINT "duels_entry_a_id_fkey" FOREIGN KEY ("entry_a_id") REFERENCES "event_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duels" ADD CONSTRAINT "duels_entry_b_id_fkey" FOREIGN KEY ("entry_b_id") REFERENCES "event_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duels" ADD CONSTRAINT "duels_winner_entry_id_fkey" FOREIGN KEY ("winner_entry_id") REFERENCES "event_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duels" ADD CONSTRAINT "duels_next_duel_id_fkey" FOREIGN KEY ("next_duel_id") REFERENCES "duels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_duel_id_fkey" FOREIGN KEY ("duel_id") REFERENCES "duels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
