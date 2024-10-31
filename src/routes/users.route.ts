import express from "express";
import userController from "../controllers/user.controller";
import { upload } from "../interfaces/common.interface";
import * as v from '../validators/user.validator';
import { validator } from "../validators/validation-handler";

const router = express.Router();

router.get("/", userController.getUsers);
router.get("/:id", userController.getUser);
router.post("/", validator(v.create), userController.createUser);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);
router.post("/update-avatar", upload.single('avatar'), userController.updateAvatar);
// app.get("/avatar/:avatar", (req, res, next) => {
//   const fileUrl = url.pathToFileURL('./uploads/avatar-kung.jpg');
// });
// change password

export default router;