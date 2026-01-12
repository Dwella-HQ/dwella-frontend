import Document, {
  Head,
  Html,
  Main,
  NextScript,
  type DocumentContext,
} from "next/document";

type DocumentProps = {
  apiBaseUrl?: string;
};

class DwellaDocument extends Document<DocumentProps> {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);

    // Get API base URL from environment at runtime (for Heroku compatibility)
    // This allows env vars to be set after build time
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

    return {
      ...initialProps,
      apiBaseUrl,
    };
  }

  override render() {
    const { apiBaseUrl } = this.props;

    return (
      <Html lang="en">
        <Head>
          {/* PWA Configuration */}
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#228cc6" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Dwella" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="msapplication-TileColor" content="#228cc6" />
          <meta name="msapplication-config" content="/browserconfig.xml" />
          
          {/* Apple Touch Icons */}
          <link rel="apple-touch-icon" sizes="72x72" href="/icons/icon-72x72.png" />
          <link rel="apple-touch-icon" sizes="96x96" href="/icons/icon-96x96.png" />
          <link rel="apple-touch-icon" sizes="128x128" href="/icons/icon-128x128.png" />
          <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144x144.png" />
          <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
          <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
          <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512x512.png" />
          
          {/* Favicon */}
          <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-128x128.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-96x96.png" />
          
          {/* Satoshi Font - Using CDN as fallback */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
          {/* Note: If you have Satoshi font files, place them in public/fonts/ and the @font-face in globals.css will be used instead */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.__NEXT_PUBLIC_API_BASE_URL__ = ${JSON.stringify(apiBaseUrl || "")};
              `,
            }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default DwellaDocument;
