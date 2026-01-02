import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  endpoint: process.env.AWS_ENDPOINT || undefined,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true,
});

const STORAGE_MODE = process.env.STORAGE_MODE || "local";
const S3_BUCKET = process.env.AWS_S3_BUCKET || "evenday";

/**
 * Salva PDF no storage (S3/Wasabi/MinIO ou local)
 */
export async function savePDF(
  buffer: Buffer,
  filename: string
): Promise<string> {
  if (STORAGE_MODE === "s3") {
    return await saveToS3(buffer, filename);
  } else {
    return await saveLocally(buffer, filename);
  }
}

/**
 * Deleta PDF do storage
 */
export async function deletePDF(pdfUrl: string): Promise<void> {
  if (STORAGE_MODE === "s3") {
    await deleteFromS3(pdfUrl);
  } else {
    await deleteLocally(pdfUrl);
  }
}

/**
 * Salva no S3
 */
async function saveToS3(buffer: Buffer, filename: string): Promise<string> {
  const key = `certificates/${filename}`;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: "application/pdf",
    ACL: "public-read",
  });

  await s3Client.send(command);

  const endpoint = process.env.AWS_ENDPOINT;

  if (endpoint) {
    const cleanEndpoint = endpoint.replace(/\/$/, "");
    return `${cleanEndpoint}/${S3_BUCKET}/${key}`;
  } else {
    const region = process.env.AWS_REGION || "us-east-1";
    return `https://${S3_BUCKET}.s3.${region}.amazonaws.com/${key}`;
  }
}

/**
 * Deleta do S3
 */
async function deleteFromS3(pdfUrl: string): Promise<void> {
  // Extrair o key do URL
  const urlParts = pdfUrl.split("/");
  const keyIndex = urlParts.indexOf("certificates");
  if (keyIndex === -1) return;

  const key = urlParts.slice(keyIndex).join("/");

  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Salva localmente
 */
async function saveLocally(buffer: Buffer, filename: string): Promise<string> {
  const publicDir = path.join(process.cwd(), "public", "certificates");

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const filePath = path.join(publicDir, filename);
  fs.writeFileSync(filePath, buffer);

  return `/certificates/${filename}`;
}

/**
 * Deleta localmente
 */
async function deleteLocally(pdfUrl: string): Promise<void> {
  const filename = pdfUrl.split("/").pop();
  if (!filename) return;

  const filePath = path.join(process.cwd(), "public", "certificates", filename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

/**
 * Gera nome único para o arquivo
 */
export function generateFilename(
  certificateNumber: string,
  attendeeName: string
): string {
  const sanitized = attendeeName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-");

  return `${certificateNumber}-${sanitized}.pdf`;
}
