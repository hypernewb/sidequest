declare namespace Cloudflare {
  interface Env {
    QLOO_API_KEY?: string;
    FEVER_CLIENT_ID?: string;
    FEVER_CLIENT_SECRET?: string;
    FEVER_AUDIENCE?: string;
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}
