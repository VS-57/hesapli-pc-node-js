import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url"; // URL modülünü içe aktarın
import gameGarajRouter from "./routes/gameGaraj.mjs";
import gamingGenRouter from "./routes/gamingGen.mjs";
import itopyaRouter from "./routes/itopya.mjs";
import pckolikRouter from "./routes/pckolik.mjs";
import vatanRouter from "./routes/vatan.mjs";
import getAllRouter from "./routes/getAll.mjs";
import setupSwagger from "./swagger/swagger.mjs";

const app = express();
const port = 3000;

// __filename ve __dirname değişkenlerini tanımlayın
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* const corsOptions = {
  origin: ["https://ucuzasistem.up.railway.app", "http://localhost:3000"], // İzin verilen origin'ler
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions)); */

app.use(cors());

app.use(express.json());

// Statik dosyaları sunmak için middleware ekleyin
app.use(express.static(path.join(__dirname, "public")));

// Anasayfaya gelen isteklerde main.html dosyasını gönder
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "main.html"));
});

app.use("/api/game-garaj", gameGarajRouter);
app.use("/api/gaming-gen", gamingGenRouter);
app.use("/api/itopya", itopyaRouter);
app.use("/api/pckolik", pckolikRouter);
app.use("/api/vatan", vatanRouter);
app.use("/api/getAll", getAllRouter);

// Swagger documentation setup
setupSwagger(app);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}/api-docs`);
});
