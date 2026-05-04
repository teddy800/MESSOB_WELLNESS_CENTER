import dotenv from "dotenv";

dotenv.config();

const PLACEHOLDER_PATTERNS = [
  /^change_me/i,
  /^replace/i,
  /^your_/i,
  /^example/i,
];
const ALLOWED_NODE_ENVS = ["development", "test", "production"] as const;

type NodeEnv = (typeof ALLOWED_NODE_ENVS)[number];

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  if (PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value))) {
    throw new Error(
      `Environment variable ${name} cannot use a placeholder value.`,
    );
  }

  return value;
}

function getRequiredPort(name: string): number {
  const value = Number.parseInt(getRequiredEnv(name), 10);

  if (Number.isNaN(value) || value <= 0 || value > 65535) {
    throw new Error(`Environment variable ${name} must be a valid TCP port.`);
  }

  return value;
}

function getNodeEnv(): NodeEnv {
  const rawValue = (process.env.NODE_ENV ?? "development").trim();

  if (!ALLOWED_NODE_ENVS.includes(rawValue as NodeEnv)) {
    throw new Error(
      `Invalid NODE_ENV value: ${rawValue}. Allowed values: ${ALLOWED_NODE_ENVS.join(", ")}.`,
    );
  }

  return rawValue as NodeEnv;
}

function getOptionalEnv(name: string): string {
  return process.env[name]?.trim() || '';
}

function getOptionalPort(name: string): number {
  const value = process.env[name]?.trim();
  if (!value) return 587; // Default SMTP port
  const port = Number.parseInt(value, 10);
  if (Number.isNaN(port) || port <= 0 || port > 65535) {
    return 587;
  }
  return port;
}

export const env = Object.freeze({
  NODE_ENV: getNodeEnv(),
  PORT: getRequiredPort("PORT"),
  DB_HOST: getRequiredEnv("DB_HOST"),
  DB_PORT: getRequiredPort("DB_PORT"),
  DB_USER: getRequiredEnv("DB_USER"),
  DB_PASS: getRequiredEnv("DB_PASS"),
  DB_NAME: getRequiredEnv("DB_NAME"),
  DATABASE_URL: getRequiredEnv("DATABASE_URL"),
  JWT_SECRET: getRequiredEnv("JWT_SECRET"),
  JWT_EXPIRES_IN: getRequiredEnv("JWT_EXPIRES_IN"),
  SMTP_HOST: getOptionalEnv("SMTP_HOST"),
  SMTP_PORT: getOptionalPort("SMTP_PORT"),
  SMTP_USER: getOptionalEnv("SMTP_USER"),
  SMTP_PASS: getOptionalEnv("SMTP_PASS"),
  SMTP_FROM: getOptionalEnv("SMTP_FROM") || "noreply@mesob.com",
});

if (!env.DATABASE_URL.startsWith("postgresql://")) {
  throw new Error("DATABASE_URL must use the postgresql:// connection protocol.");
}

const isLocalDatabase =
  env.DATABASE_URL.includes("@localhost") ||
  env.DATABASE_URL.includes("@127.0.0.1");

if (!isLocalDatabase) {
  throw new Error(
    "DATABASE_URL must point to a local PostgreSQL instance (localhost or 127.0.0.1).",
  );
}
