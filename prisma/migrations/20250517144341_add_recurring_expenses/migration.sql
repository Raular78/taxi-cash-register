-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "frequency" TEXT,
ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nextDueDate" TIMESTAMP(3);
