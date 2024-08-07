import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import compression from "compression"; // compression paketini import edin
import setupSwagger from "./swagger/swagger.mjs";
import apiRouter from "./routes/api.mjs"; // API rotalarını import edin

const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Compression middleware'ini kullanın
app.use(compression());

// Statik dosyalar için public dizinini sun
app.use(express.static(path.join(__dirname, "public")));

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "main.html"));
});

app.get("/anasayfa", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "main.html"));
});

// API rotaları
app.use("/api", apiRouter);

setupSwagger(app);

// Custom 404 error page
app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
