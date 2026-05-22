-- CreateTable
CREATE TABLE "sponsors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo_url" TEXT,
    "website" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sponsors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_sponsors" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "sponsor_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_sponsors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_sponsors_event_id_position_idx" ON "event_sponsors"("event_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "event_sponsors_event_id_sponsor_id_key" ON "event_sponsors"("event_id", "sponsor_id");

-- AddForeignKey
ALTER TABLE "event_sponsors" ADD CONSTRAINT "event_sponsors_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_sponsors" ADD CONSTRAINT "event_sponsors_sponsor_id_fkey" FOREIGN KEY ("sponsor_id") REFERENCES "sponsors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
