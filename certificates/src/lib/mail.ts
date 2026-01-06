
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT || "587"),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
    },
});

interface SendCertificateEmailParams {
    to: string;
    participantName: string;
    eventName: string;
    certificateUrl: string; // URL for download/view
    validationUrl: string; // Validation URL
    pdfBuffer: Buffer;
    filename: string;
}

export async function sendCertificateEmail({
    to,
    participantName,
    eventName,
    certificateUrl,
    validationUrl,
    pdfBuffer,
    filename,
}: SendCertificateEmailParams) {
    try {
        const logoUrl =
            "https://certificados.evenday.app/_next/image?url=%2Flogo-escura.png&w=128&q=75";

        const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${logoUrl}" alt="Evenday Logo" style="max-width: 150px; height: auto;" />
        </div>
        
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <h2 style="color: #111827; margin-top: 0;">Olá, ${participantName}!</h2>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">
            É com enorme prazer que entregamos o seu certificado de participação no evento <strong>${eventName}</strong>.
          </p>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">
            Seu certificado está anexado a este e-mail em formato PDF. Você também pode visualizá-lo e validar sua autenticidade através do botão abaixo.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${validationUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Visualizar e Validar Certificado
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
            Atenciosamente,<br>
            Equipe Evenday
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
          Este é um e-mail automático, por favor não responda.
        </div>
      </div>
    `;

        const info = await transporter.sendMail({
            from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
            to,
            subject: `Seu certificado do evento ${eventName} chegou! 🎓`,
            html: htmlContent,
            attachments: [
                {
                    filename: filename,
                    content: pdfBuffer,
                    contentType: "application/pdf",
                },
            ],
        });

        console.log("Certificate email sent to:", to, "MessageId:", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Error sending certificate email:", error);
        // Don't throw, just log and return false so we don't block the API response
        return { success: false, error };
    }
}
