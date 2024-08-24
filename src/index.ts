// @ts-nocheck

import express, { Request, Response } from "express";
import apiRouter from "./routes/api";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors());

// Use API routes
app.use("/api", apiRouter);

// Health check route
app.get("/", (req: Request, res: Response) => {
  res.send("Server is running");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
