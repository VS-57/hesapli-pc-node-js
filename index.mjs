import express from "express";
import gameGarajRouter from "./routes/gameGaraj.mjs";
import gamingGenRouter from "./routes/gamingGen.mjs";
import itopyaRouter from "./routes/itopya.mjs";
import pckolikRouter from "./routes/pckolik.mjs";
import vatanRouter from "./routes/vatan.mjs";
import getAllRouter from "./routes/getAll.mjs";
import setupSwagger from "./swagger/swagger.mjs";

const app = express();
const port = 3000;

app.use(express.json());

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
