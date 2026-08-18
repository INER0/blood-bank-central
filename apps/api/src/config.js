import "dotenv/config";

export const config = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || "postgresql://bloodbank:bloodbank@localhost:5432/bloodbank",
  jwtSecret: process.env.JWT_SECRET || "local-development-secret",
};
