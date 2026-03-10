-- CreateTable
CREATE TABLE "generation_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generation_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "generation_logs" ADD CONSTRAINT "generation_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
