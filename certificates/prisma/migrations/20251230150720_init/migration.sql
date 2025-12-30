-- CreateTable
CREATE TABLE "certificate_templates" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "accountId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "width" INTEGER NOT NULL DEFAULT 1754,
    "height" INTEGER NOT NULL DEFAULT 1240,
    "design" JSONB NOT NULL,
    "variables" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificate_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issued_certificates" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "eventId" INTEGER NOT NULL,
    "attendeeId" INTEGER NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "variables" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issued_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate_configs" (
    "id" TEXT NOT NULL,
    "eventId" INTEGER NOT NULL,
    "templateId" TEXT NOT NULL,
    "requireCheckIn" BOOLEAN NOT NULL DEFAULT false,
    "autoGenerate" BOOLEAN NOT NULL DEFAULT false,
    "customVariables" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificate_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "certificate_templates_userId_idx" ON "certificate_templates"("userId");

-- CreateIndex
CREATE INDEX "certificate_templates_accountId_idx" ON "certificate_templates"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "issued_certificates_certificateNumber_key" ON "issued_certificates"("certificateNumber");

-- CreateIndex
CREATE INDEX "issued_certificates_eventId_idx" ON "issued_certificates"("eventId");

-- CreateIndex
CREATE INDEX "issued_certificates_attendeeId_idx" ON "issued_certificates"("attendeeId");

-- CreateIndex
CREATE INDEX "issued_certificates_certificateNumber_idx" ON "issued_certificates"("certificateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "certificate_configs_eventId_key" ON "certificate_configs"("eventId");

-- CreateIndex
CREATE INDEX "certificate_configs_eventId_idx" ON "certificate_configs"("eventId");

-- AddForeignKey
ALTER TABLE "issued_certificates" ADD CONSTRAINT "issued_certificates_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "certificate_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_configs" ADD CONSTRAINT "certificate_configs_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "certificate_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
