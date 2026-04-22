import cors from "cors";
import express, { Request, Response } from "express";
import helmet from "helmet";
import type { RowDataPacket } from "mysql2";
import morgan from "morgan";
import db from "./config/db";
import apiRoutes from "./routes";

interface HealthRow extends RowDataPacket {
  ok: number;
}

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/api/health", async (_req: Request, res: Response) => {
  try {
    const [result] = await db.query<HealthRow[]>("SELECT 1 AS ok");
    const databaseStatus =
      result.length > 0 && result[0].ok === 1 ? "connected" : "unknown";

    return res.status(200).json({
      status: "success",
      data: {
        service: "Mesob Wellness API",
        database: databaseStatus,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (_error) {
    return res.status(500).json({
      status: "error",
      message: "Database connection failed",
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
