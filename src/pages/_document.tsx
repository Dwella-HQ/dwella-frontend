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
