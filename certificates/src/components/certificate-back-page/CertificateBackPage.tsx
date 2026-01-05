/**
 * Componente para gerar a folha de verso do certificado
 * Inclui QR code, código de validação e instruções
 */

interface CertificateBackPageProps {
    certificateNumber: string;
    validationCode: string;
    validationUrl: string;
    qrCodeDataUrl: string;
    logoDataUrl?: string;
    eventTitle: string;
    participantName: string;
    issueDate: string;
}

export function CertificateBackPage({
    certificateNumber,
    validationCode,
    validationUrl,
    qrCodeDataUrl,
    logoDataUrl,
    eventTitle,
    participantName,
    issueDate,
}: CertificateBackPageProps) {
    return (
        <div
            style={{
                width: "1754px",
                height: "1240px",
                backgroundColor: "#ffffff",
                padding: "80px",
                fontFamily: "'Varela Round', sans-serif",
                position: "relative",
                boxSizing: "border-box",
            }}
        >
            {/* Header */}
            <div
                style={{
                    textAlign: "center",
                    marginBottom: "40px",
                    borderBottom: `3px solid #58467f`,
                    paddingBottom: "30px",
                }}
            >
                {logoDataUrl && (
                    <img
                        src={logoDataUrl}
                        alt="Evenday Logo"
                        style={{ height: "60px", marginBottom: "20px", display: "inline-block" }}
                    />
                )}
                <h1
                    style={{
                        fontSize: "48px",
                        fontWeight: "bold",
                        color: "#1F2937",
                        margin: "0 0 10px 0",
                    }}
                >
                    Validação de Certificado
                </h1>
                <p
                    style={{
                        fontSize: "24px",
                        color: "#6B7280",
                        margin: 0,
                    }}
                >
                    Sistema de Verificação de Autenticidade Evenday
                </p>
            </div>

            {/* Main Content - Two Columns */}
            <div
                style={{
                    display: "flex",
                    gap: "60px",
                    marginBottom: "60px",
                }}
            >
                {/* Left Column - QR Code */}
                <div
                    style={{
                        flex: "0 0 400px",
                        textAlign: "center",
                    }}
                >
                    <div
                        style={{
                            backgroundColor: "#F9FAFB",
                            padding: "30px",
                            borderRadius: "20px",
                            border: "2px solid #E5E7EB",
                        }}
                    >
                        <img
                            src={qrCodeDataUrl}
                            alt="QR Code de Validação"
                            style={{
                                width: "300px",
                                height: "300px",
                                margin: "0 auto 20px",
                                display: "block",
                            }}
                        />
                        <p
                            style={{
                                fontSize: "18px",
                                fontWeight: "600",
                                color: "#58467f",
                                margin: "0",
                            }}
                        >
                            Escaneie para Validar
                        </p>
                    </div>
                </div>

                {/* Right Column - Information */}
                <div style={{ flex: 1 }}>
                    {/* Certificate Info */}
                    <div
                        style={{
                            backgroundColor: "#f5f3f7",
                            padding: "30px",
                            borderRadius: "15px",
                            marginBottom: "30px",
                            border: "2px solid #e1dee6",
                        }}
                    >
                        <h2
                            style={{
                                fontSize: "28px",
                                fontWeight: "bold",
                                color: "#58467f",
                                margin: "0 0 20px 0",
                            }}
                        >
                            Informações do Certificado
                        </h2>
                        <div style={{ fontSize: "18px", color: "#1F2937", lineHeight: "1.8" }}>
                            <p style={{ margin: "0 0 12px 0" }}>
                                <strong>Participante:</strong> {participantName}
                            </p>
                            <p style={{ margin: "0 0 12px 0" }}>
                                <strong>Evento:</strong> {eventTitle}
                            </p>
                            <p style={{ margin: "0 0 12px 0" }}>
                                <strong>Número:</strong>{" "}
                                <span style={{ fontFamily: "monospace", color: "#58467f" }}>
                                    {certificateNumber}
                                </span>
                            </p>
                            <p style={{ margin: "0" }}>
                                <strong>Emissão:</strong> {issueDate}
                            </p>
                        </div>
                    </div>

                    {/* Validation Code */}
                    <div
                        style={{
                            backgroundColor: "#fffcf2",
                            padding: "30px",
                            borderRadius: "15px",
                            border: "2px solid #febc39",
                        }}
                    >
                        <h3
                            style={{
                                fontSize: "22px",
                                fontWeight: "bold",
                                color: "#8c6511",
                                margin: "0 0 15px 0",
                            }}
                        >
                            Código de Validação
                        </h3>
                        <p
                            style={{
                                fontSize: "36px",
                                fontFamily: "monospace",
                                fontWeight: "bold",
                                color: "#febc39",
                                margin: "0 0 15px 0",
                                letterSpacing: "3px",
                            }}
                        >
                            {validationCode}
                        </p>
                        <p
                            style={{
                                fontSize: "16px",
                                color: "#8c6511",
                                margin: "0",
                            }}
                        >
                            Use este código para validação manual
                        </p>
                    </div>
                </div>
            </div>

            {/* Instructions */}
            <div
                style={{
                    backgroundColor: "#FFFBEB",
                    padding: "30px",
                    borderRadius: "15px",
                    border: "2px solid #FDE68A",
                    marginBottom: "40px",
                }}
            >
                <h3
                    style={{
                        fontSize: "24px",
                        fontWeight: "bold",
                        color: "#92400E",
                        margin: "0 0 20px 0",
                    }}
                >
                    Como validar este certificado
                </h3>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "30px",
                    }}
                >
                    <div>
                        <div
                            style={{
                                width: "50px",
                                height: "50px",
                                backgroundColor: "#FCD34D",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "24px",
                                fontWeight: "bold",
                                color: "#92400E",
                                marginBottom: "15px",
                            }}
                        >
                            1
                        </div>
                        <p style={{ fontSize: "16px", color: "#78350F", margin: 0, lineHeight: "1.6" }}>
                            <strong>Escaneie o QR Code</strong> com a câmera do seu smartphone
                            ou aplicativo de leitura
                        </p>
                    </div>
                    <div>
                        <div
                            style={{
                                width: "50px",
                                height: "50px",
                                backgroundColor: "#FCD34D",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "24px",
                                fontWeight: "bold",
                                color: "#92400E",
                                marginBottom: "15px",
                            }}
                        >
                            2
                        </div>
                        <p style={{ fontSize: "16px", color: "#78350F", margin: 0, lineHeight: "1.6" }}>
                            <strong>Acesse o site</strong> {validationUrl.replace("https://", "").replace("http://", "")} e digite o código
                        </p>
                    </div>
                    <div>
                        <div
                            style={{
                                width: "50px",
                                height: "50px",
                                backgroundColor: "#FCD34D",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "24px",
                                fontWeight: "bold",
                                color: "#92400E",
                                marginBottom: "15px",
                            }}
                        >
                            3
                        </div>
                        <p style={{ fontSize: "16px", color: "#78350F", margin: 0, lineHeight: "1.6" }}>
                            <strong>Verifique a autenticidade</strong> e visualize todas as
                            informações do certificado
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div
                style={{
                    position: "absolute",
                    bottom: "40px",
                    left: "80px",
                    right: "80px",
                    textAlign: "center",
                    paddingTop: "20px",
                    borderTop: "2px solid #E5E7EB",
                }}
            >
                <p
                    style={{
                        fontSize: "16px",
                        color: "#6B7280",
                        margin: "0 0 10px 0",
                    }}
                >
                    Este certificado foi emitido digitalmente pela plataforma Evenday
                </p>
                <p
                    style={{
                        fontSize: "14px",
                        color: "#9CA3AF",
                        margin: "0",
                    }}
                >
                    Para mais informações, visite{" "}
                    <span style={{ color: "#58467f", fontWeight: "600" }}>
                        {validationUrl}
                    </span>
                </p>
            </div>
        </div>
    );
}

/**
 * Gera HTML da página de verso para renderização em PDF
 */
export function generateBackPageHTML(props: CertificateBackPageProps): string {
    const {
        certificateNumber,
        validationCode,
        validationUrl,
        qrCodeDataUrl,
        logoDataUrl,
        eventTitle,
        participantName,
        issueDate,
    } = props;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Varela+Round&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Varela Round', sans-serif;
    }
  </style>
</head>
<body>
  <div style="width: 1754px; height: 1240px; background-color: #ffffff; padding: 80px; position: relative;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #58467f; padding-bottom: 30px;">
      ${logoDataUrl ? `<img src="${logoDataUrl}" alt="Evenday Logo" style="height: 60px; margin-bottom: 20px;" />` : ''}
      <h1 style="font-size: 48px; font-weight: bold; color: #1F2937; margin: 0 0 10px 0;">
        Validação de Certificado
      </h1>
      <p style="font-size: 24px; color: #6B7280; margin: 0;">
        Sistema de Verificação de Autenticidade Evenday
      </p>
    </div>

    <!-- Main Content -->
    <div style="display: flex; gap: 60px; margin-bottom: 60px;">
      <!-- QR Code -->
      <div style="flex: 0 0 400px; text-align: center;">
        <div style="background-color: #f5f3f7; padding: 30px; border-radius: 20px; border: 2px solid #e1dee6;">
          <img src="${qrCodeDataUrl}" alt="QR Code" style="width: 300px; height: 300px; margin: 0 auto 20px; display: block;" />
          <p style="font-size: 18px; font-weight: 600; color: #58467f; margin: 0;">
            Escaneie para Validar
          </p>
        </div>
      </div>

      <!-- Information -->
      <div style="flex: 1;">
        <div style="background-color: #f5f3f7; padding: 30px; border-radius: 15px; margin-bottom: 30px; border: 2px solid #e1dee6;">
          <h2 style="font-size: 28px; font-weight: bold; color: #58467f; margin: 0 0 20px 0;">
            Informações do Certificado
          </h2>
          <div style="font-size: 18px; color: #1F2937; line-height: 1.8;">
            <p style="margin: 0 0 12px 0;"><strong>Participante:</strong> ${participantName}</p>
            <p style="margin: 0 0 12px 0;"><strong>Evento:</strong> ${eventTitle}</p>
            <p style="margin: 0 0 12px 0;">
              <strong>Número:</strong> 
              <span style="font-family: monospace; color: #58467f;">${certificateNumber}</span>
            </p>
            <p style="margin: 0;"><strong>Emissão:</strong> ${issueDate}</p>
          </div>
        </div>

        <div style="background-color: #fffcf2; padding: 30px; border-radius: 15px; border: 2px solid #febc39;">
          <h3 style="font-size: 22px; font-weight: bold; color: #8c6511; margin: 0 0 15px 0;">
            Código de Validação
          </h3>
          <p style="font-size: 36px; font-family: monospace; font-weight: bold; color: #febc39; margin: 0 0 15px 0; letter-spacing: 3px;">
            ${validationCode}
          </p>
          <p style="font-size: 16px; color: #8c6511; margin: 0;">
            Use este código para validação manual
          </p>
        </div>
      </div>
    </div>

    <!-- Instructions -->
    <div style="background-color: #FFFBEB; padding: 30px; border-radius: 15px; border: 2px solid #FDE68A; margin-bottom: 40px;">
      <h3 style="font-size: 24px; font-weight: bold; color: #92400E; margin: 0 0 20px 0;">
        Como validar este certificado
      </h3>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px;">
        <div>
          <div style="width: 50px; height: 50px; background-color: #febc39; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: #ffffff; margin-bottom: 15px;">
            1
          </div>
          <p style="font-size: 16px; color: #78350F; margin: 0; line-height: 1.6;">
            <strong>Escaneie o QR Code</strong> com a câmera do seu smartphone ou aplicativo de leitura
          </p>
        </div>
        <div>
          <div style="width: 50px; height: 50px; background-color: #FCD34D; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: #92400E; margin-bottom: 15px;">
            2
          </div>
          <p style="font-size: 16px; color: #78350F; margin: 0; line-height: 1.6;">
            <strong>Acesse o site</strong> e digite o código de validação
          </p>
        </div>
        <div>
          <div style="width: 50px; height: 50px; background-color: #FCD34D; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: #92400E; margin-bottom: 15px;">
            3
          </div>
          <p style="font-size: 16px; color: #78350F; margin: 0; line-height: 1.6;">
            <strong>Verifique a autenticidade</strong> e visualize todas as informações do certificado
          </p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="position: absolute; bottom: 40px; left: 80px; right: 80px; text-align: center; padding-top: 20px; border-top: 2px solid #E5E7EB;">
      <p style="font-size: 16px; color: #6B7280; margin: 0 0 10px 0;">
        Este certificado foi emitido digitalmente pela plataforma Evenday
      </p>
      <p style="font-size: 14px; color: #9CA3AF; margin: 0;">
        Para mais informações, visite <span style="color: #58467f; font-weight: 600;">${validationUrl}</span>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
