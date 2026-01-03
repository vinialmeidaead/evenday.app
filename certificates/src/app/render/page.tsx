"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

// Importar o componente de renderização dinamicamente (client-side only)
const RenderCertificate = dynamic(
  () => import("@/components/certificate-render/RenderCertificate"),
  { ssr: false }
);

function RenderPageContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<{
    design: any;
    variables: Record<string, string>;
    width: number;
    height: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderId = searchParams.get("id");
    if (!renderId) {
      setError("Missing render ID");
      return;
    }

    // Buscar dados da API
    fetch(`/api/render-data?id=${renderId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch render data");
        }
        return res.json();
      })
      .then((fetchedData) => {
        setData(fetchedData);
      })
      .catch((err) => {
        console.error("Error fetching render data:", err);
        setError(err.message);
      });
  }, [searchParams]);

  const handleReady = () => {
    // Expor status de "pronto" para o Puppeteer
    (window as any).__CERTIFICATE_READY__ = true;
    console.log("Certificate ready for capture");
  };

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#ffffff",
          color: "red",
        }}
      >
        Error: {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#ffffff",
        }}
      >
        Carregando...
      </div>
    );
  }

  return (
    <div
      style={{
        width: `${data.width}px`,
        height: `${data.height}px`,
        margin: 0,
        padding: 0,
        overflow: "hidden",
        background: "#ffffff",
      }}
    >
      <RenderCertificate
        design={data.design}
        variables={data.variables}
        width={data.width}
        height={data.height}
        onReady={handleReady}
      />
    </div>
  );
}

export default function RenderPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            background: "#ffffff",
          }}
        >
          Carregando...
        </div>
      }
    >
      <RenderPageContent />
    </Suspense>
  );
}
