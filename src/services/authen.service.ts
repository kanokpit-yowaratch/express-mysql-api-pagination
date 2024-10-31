import { connectionState } from "../db-config";
import bcrypt from 'bcrypt';
import { saltRounds, secret } from '../types/constants';
import jwt from 'jsonwebtoken';
import { User } from "../interfaces/common.interface";
import createHttpError from "http-errors";
import httpStatus from "http-status";
// import { Connection } from "mysql2/promise";

const register = async (params: User) => {
	const { password, email, first_name, last_name, ...otherParams } = params;
	const { connection } = await connectionState();

	// Middleware has already been checked.
	// checkConnection(connection);

	const passwordHash = await bcrypt.hash(password, saltRounds);
	const sql = "INSERT INTO users(username, password, email, first_name, last_name) VALUES (?, ?, ?, ?, ?)";
	const compareDatas = [email, passwordHash, email, first_name, last_name];
	const [results]: any = await connection.query(sql, compareDatas);
	return results.insertId;
}

const login = async (params: User) => {
	const { password, email, ...otherParams } = params;

	const { connection } = await connectionState();

	// Middleware has already been checked.
	// checkConnection(connection);

	const sql = "SELECT * FROM `users` WHERE email=?";
	const [results]: any = await connection.execute(sql, [email]);
	const userData = results ? results[0] : null;

	if (!userData) {
		throw createHttpError(httpStatus.BAD_REQUEST, {
			message: 'User not found',
		});
	}

	const isMatch = bcrypt.compareSync(password, userData.password);

	if (isMatch) {
		const token = jwt.sign({ email: userData.email }, secret, {
			expiresIn: "1h",
		});
		return token;
	} else {
		throw createHttpError(httpStatus.BAD_REQUEST, {
			message: 'Login failed.',
		});
	}
}

const authenticate = async (token: string) => {
	try {
		const decode = jwt.verify(token, secret);
		return decode;
	} catch (error) {
		throw createHttpError(httpStatus.BAD_REQUEST, {
			message: 'Decode error.',
		});
	}
}

// Middleware has already been checked.
// const checkConnection = (connection: Connection) => {
// 	if (!connection) {
// 		throw createHttpError(httpStatus.BAD_REQUEST, {
// 			message: `Can't connect database.`,
// 		});
// 	}
// }

export { register, login, authenticate };