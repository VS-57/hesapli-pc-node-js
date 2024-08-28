import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import compression from "compression";
import setupSwagger from "./swagger/swagger.mjs";
import apiRouter from "./routes/api.mjs";

const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(compression());

app.use(express.static(path.join(__dirname, "public")));

/* app.use(cors()); */

const corsOptions = {
  origin: [
    "https://ucuzasistem.com",
    "https://www.ucuzasistem.com",
    "https://ucuzasistem.up.railway.app",
  ],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "main.html"));
});

app.get("/anasayfa", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "main.html"));
});

app.use("/api", apiRouter);

setupSwagger(app);

app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
