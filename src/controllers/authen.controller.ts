import { NextFunction, Request, Response } from 'express';
import * as authenService from '../services/authen.service';

const register = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const newUserId = await authenService.register(req.body);
		return res
			.status(201)
			.json({ message: "Register successfully.", newUserId });
	} catch (error) {
		const { message } = error;
		return res.status(500).json({ message });
	}
};

const login = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const token = await authenService.login(req.body);
		return res
			.status(201)
			.json({ message: "Login successfully.", token });
	} catch (error) {
		const { message } = error;
		return res.status(500).json({ message });
	}
};

const authenticate = (req: Request, res: Response, next: NextFunction) => {
	try {
		const token = req.headers.authorization.split(" ")[1];
		const tokenInfo = authenService.authenticate(token);
		return res
			.status(201)
			.json({ message: "Verify successfully.", tokenInfo });
	} catch (error) {
		const { message } = error;
		res.json({ message });
	}
}

export default {
	register,
	login,
	authenticate
};
