CREATE TYPE "FileVisibility" AS ENUM ('public', 'private');

CREATE TABLE "file_file" (
    "id" UUID NOT NULL,
    "mime" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "sha512" TEXT NOT NULL,
    "visibility" "FileVisibility" NOT NULL DEFAULT 'public',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_file_pkey" PRIMARY KEY ("id")
);