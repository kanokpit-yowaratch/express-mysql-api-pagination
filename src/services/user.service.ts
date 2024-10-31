import { connectionState } from "../db-config";
import bcrypt from 'bcrypt';
import { saltRounds } from '../types/constants';
import createHttpError from "http-errors";
import httpStatus from "http-status";
import { checkUserExist } from "./common.service";
import { User, UserQueryParams } from "../types/interfaces";

const getUsers = async (params: UserQueryParams, protocol: string, host: string) => {
	const { connection } = await connectionState();

	let { page = '1', limit = '5', search } = params;
	let keywords = '';

	let sqlTotalString =
		"SELECT COUNT(*) as totalUser FROM `users` WHERE user_status = ?";
	let sqlDataString =
		"SELECT * FROM `users` WHERE user_status = ? limit ? offset ?";

	if (search) {
		keywords = search.trim();
		sqlTotalString =
			"SELECT COUNT(*) as totalUser FROM `users` WHERE (user_status = ? AND ( first_name LIKE ? OR last_name LIKE ? OR email LIKE ?))";
		sqlDataString =
			"SELECT * FROM `users` WHERE (user_status = ? AND ( first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)) limit ? offset ?";
	}

	const pageIndex = parseInt(page.toString()) - 1;
	const limitNum = parseInt(limit.toString());

	const offset = pageIndex * limitNum;

	const compareTotal = keywords ? ["1", `%${keywords}%`, `%${keywords}%`, `%${keywords}%`] : ["1"];
	const [resultsTotal, fieldsTotal] = await connection.query(sqlTotalString, compareTotal);
	const total = resultsTotal[0].totalUser;

	const compareDatas = keywords ?
		["1", `%${keywords}%`, `%${keywords}%`, `%${keywords}%`, limitNum, offset] :
		["1", limitNum, offset];

	// const sqlQuery = connection.format(sqlDataString, compareDatas);
	// console.log(sqlQuery);

	const [results]: any = await connection.query(sqlDataString, compareDatas);

	let dataList = [];
	if (results && results.length) {
		dataList = results.map((obj: User) => {
			obj.avatar = protocol + '://' + host + '/uploads/' + obj.avatar_name;
			return obj;
		});
	}

	const totalPage = Math.ceil(+total / +limit);
	const responseData = {
		data: dataList,
		total: total,
		pages: totalPage,
		limit: limitNum,
		currentPage: pageIndex + 1,
	}
	return responseData;
}

const getUser = async (id: string, protocol: string, host: string) => {
	const { connection } = await connectionState();

	const sql = "SELECT username, email, first_name, last_name, avatar_name FROM `users` WHERE id=?";
	const compareDatas = [id];

	// const sqlQuery = connection.format(sql, compareDatas);
	// console.log(sqlQuery);

	const [results]: any[] = await connection.query(sql, compareDatas);

	if (results && results[0]) {
		const user = results[0];
		let data: User = user;
		if (data.avatar_name) {
			data = { ...user, avatar: protocol + '://' + host + '/uploads/' + user.avatar_name }
		}
		return data;
	} else {
		throw createHttpError(httpStatus.BAD_REQUEST, {
			message: 'No data found.',
		});
	}
}

const createUser = async (params: User) => {
	const { username, password, email, first_name, last_name } = params;
	const { connection } = await connectionState();

	const exist = await checkUserExist(connection, email);
	if (exist) {
		throw createHttpError(httpStatus.BAD_REQUEST, {
			message: 'User already exists.',
		});
	}

	const passwordHash = await bcrypt.hash(password, saltRounds);

	const [results]: any[] = await connection.query(
		"INSERT INTO users(username, password, email, first_name, last_name) VALUES (?, ?, ?, ?, ?)",
		[username, passwordHash, email, first_name, last_name]);
	return results.insertId;
}

const updateUser = async (params: User, id: string) => {
	const { email, first_name, last_name, username } = params;
	const { connection } = await connectionState();

	const [results]: any[] = await connection.query(
		"UPDATE users SET email = ?, first_name = ?, last_name = ? WHERE id = ?",
		[email, first_name, last_name, id]);
	return results.affectedRows;
}

const updateAvatar = async (id: any, file: any) => {
	const { connection } = await connectionState();
	if (!id || !file) {
		const err = new Error('Error');
		err.message = `Error ${httpStatus.BAD_REQUEST}: Bad Request.`;
		throw err;
	}

	// const newFileName = `${id}_${new Date().toJSON().slice(0, 10)}_${file_name}`;
	const newFileName = 'avatar-' + file.originalname;
	await connection.query(
		"UPDATE users SET avatar_name = ? WHERE id = ?",
		[newFileName, id]);
}

const deleteUser = async (id: string) => {
	const { connection } = await connectionState();

	const [results]: any[] = await connection.query(
		"DELETE FROM users WHERE id=?",
		[id]);

	return results.affectedRows;
}

export {
	getUsers,
	getUser,
	createUser,
	updateUser,
	updateAvatar,
	deleteUser
};