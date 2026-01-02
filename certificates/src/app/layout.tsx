import type { Metadata } from "next";
import { Varela_Round } from "next/font/google";
import "./globals.css";

const varela = Varela_Round({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-varela",
});

export const metadata: Metadata = {
  title: "Certificados - Evenday",
  description: "Editor de certificados",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${varela.variable} font-[family-name:var(--font-varela)] antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
