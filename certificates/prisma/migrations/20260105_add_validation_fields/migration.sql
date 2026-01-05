-- AlterTable
ALTER TABLE "issued_certificates" 
ADD COLUMN "validationCode" TEXT,
ADD COLUMN "validationUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "issued_certificates_validationCode_key" ON "issued_certificates"("validationCode");

-- CreateIndex
CREATE INDEX "issued_certificates_validationCode_idx" ON "issued_certificates"("validationCode");
