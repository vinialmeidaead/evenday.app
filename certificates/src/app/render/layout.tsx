export default function RenderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Render Certificate</title>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              html, body {
                margin: 0;
                padding: 0;
                overflow: hidden;
                background: #ffffff;
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
