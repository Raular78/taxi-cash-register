-- AlterTable
ALTER TABLE "DailyRecord" ADD COLUMN     "shiftBreakEnd" TEXT,
ADD COLUMN     "shiftBreakStart" TEXT;

-- AlterTable
ALTER TABLE "Payroll" ADD COLUMN     "pdfUrl" TEXT;
