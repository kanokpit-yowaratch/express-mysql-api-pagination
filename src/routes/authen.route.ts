import express from "express";
import authenController from "../controllers/authen.controller";

const router = express.Router();

router.post("/register", authenController.register);
router.post("/login", authenController.login);
router.post("/authen", authenController.authenticate);

export default router;