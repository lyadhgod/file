/*
  Warnings:

  - The primary key for the `file_file` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "file_file" DROP CONSTRAINT "file_file_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "file_file_pkey" PRIMARY KEY ("id");
