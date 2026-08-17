type PublicEnvKey =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";

export function getPublicEnv(key: PublicEnvKey) {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

export function getOptionalServerEnv(key: "SUPABASE_SERVICE_ROLE_KEY" | "DATABASE_URL") {
  return process.env[key];
}
