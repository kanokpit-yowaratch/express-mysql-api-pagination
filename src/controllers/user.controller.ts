import { Request, Response, NextFunction } from "express";
import * as userService from '../services/user.service';
import { ResultResponse } from "../types/interfaces";

const getUsers = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const host = req.get('host');
		const result: ResultResponse = await userService.getUsers(req.query, req.protocol, host);
		return res.status(200).json(result);
	} catch (error) {
		const { message } = error;
		return res.status(500).json({ message });
	}
}

const getUser = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const host = req.get('host');
		const result = await userService.getUser(req.params?.id, req.protocol, host);
		return res.status(200).json(result);
	} catch (error) {
		return res.status(error.status).send({ message: error.message });
	}
}

const createUser = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const newUserId = await userService.createUser(req.body);
		return res.status(200).json({ message: "Create user successfully.", newUserId });
	} catch (error) {
		return res.status(error.status).send({ message: error.message });
	}
}

const updateUser = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const rowUpdated = await userService.updateUser(req.body, req.params?.id);
		return res.status(200).json({ message: "Create user successfully.", updated: rowUpdated });
	} catch (error) {
		return res.status(error.status).send({ message: error.message });
	}
}

const updateAvatar = async (req: Request | any, res: Response, next: NextFunction) => {
	try {
		const id = req.body.id;
		const file = req.file;
		const avatar = await userService.updateAvatar(id, file);
		return res.status(200).json({ message: "User updated successfully!", avatar });
	} catch (error) {
		return res.status(500).send({ message: error.message });
	}
}

const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const deleted = await userService.deleteUser(req.params?.id);
		return res.status(200).json({ message: "User deleted successfully!", deleted });
	} catch (error) {
		return res.status(error.status).send({ message: error.message });
	}
}

export default {
	getUsers,
	getUser,
	createUser,
	updateUser,
	updateAvatar,
	deleteUser
};