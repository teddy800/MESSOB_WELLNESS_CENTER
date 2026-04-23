// THIS FILE Configure the Express app (middleware, routes, logic)


import cors from "cors";
import express, { Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { prisma } from "./config/prisma";
import apiRoutes from "./routes";

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/api/health", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      status: "success",
      data: {
        service: "Mesob Wellness API",
        database: "connected",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return res.status(503).json({
      status: "warning",
      data: {
        service: "Mesob Wellness API",
        database: "disconnected",
        message: "Database connection failed. Please ensure PostgreSQL is running.",
        timestamp: new Date().toISOString(),
      },
    });
  }
});

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    data: {
      service: "Mesob Wellness API",
      route: "/health",
    },
  });
});

app.use("/api/v1", apiRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

export default app;
