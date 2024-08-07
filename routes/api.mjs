import { Router } from "express";
import gameGarajRouter from "./gameGaraj.mjs";
import gamingGenRouter from "./gamingGen.mjs";
import itopyaRouter from "./itopya.mjs";
import pckolikRouter from "./pckolik.mjs";
import vatanRouter from "./vatan.mjs";
import sinerjiRouter from "./sinerji.mjs";
import tebilonRouter from "./tebilon.mjs";
import inceHesapRouter from "./inceHesap.mjs";
import gencerGamingRouter from "./gencergaming.mjs";
import getCPUs from "../hardwares/cpus.mjs";
import getGPUs from "../hardwares/gpus.mjs";
import getProductsRouter from "./getProducts.mjs"; // getProducts rotasını import edin
import combinedRouter from "./combined.mjs"; // combined rotasını import edin

const router = Router();

router.use("/game-garaj", gameGarajRouter);
router.use("/gaming-gen", gamingGenRouter);
router.use("/itopya", itopyaRouter);
router.use("/pckolik", pckolikRouter);
router.use("/vatan", vatanRouter);
router.use("/sinerji", sinerjiRouter);
router.use("/tebilon", tebilonRouter);
router.use("/inceHesap", inceHesapRouter);
router.use("/gencergaming", gencerGamingRouter);

router.use("/cpu", getCPUs);
router.use("/gpu", getGPUs);
router.use("/getProducts", getProductsRouter); // getProducts rotasını kullan
router.use("/combined", combinedRouter); // combined rotasını kullan

export default router;
