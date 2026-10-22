declare namespace Cloudflare {
  interface Env {
    QLOO_API_KEY?: string;
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}
