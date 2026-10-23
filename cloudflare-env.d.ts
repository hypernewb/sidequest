declare namespace Cloudflare {
  interface Env {
    QLOO_API_KEY?: string;
    CONNPASS_API_KEY?: string;
    PULLMD_URL?: string;
    PULLMD_BEARER_TOKEN?: string;
    FEVER_CLIENT_ID?: string;
    FEVER_CLIENT_SECRET?: string;
    FEVER_AUDIENCE?: string;
    FEVER_OAUTH_CLIENT_ID?: string;
    FEVER_OAUTH_CLIENT_SECRET?: string;
    FEVER_OAUTH_REDIRECT_URI?: string;
    FEVER_SESSION_KEY?: string;
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}
