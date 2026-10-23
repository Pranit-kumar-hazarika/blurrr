const required = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY"
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  frontendOrigins: (process.env.FRONTEND_ORIGINS || "http://127.0.0.1:5500")
    .split(",").map((value) => value.trim()).filter(Boolean),
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  storageBucket: process.env.STORAGE_BUCKET || "event-photos",
  maxUploadBytes: Math.max(1, Number(process.env.MAX_UPLOAD_MB || 10)) * 1024 * 1024
};
