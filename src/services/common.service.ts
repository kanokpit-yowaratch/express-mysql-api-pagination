import createHttpError from "http-errors";
import httpStatus from "http-status";
import { Connection } from "mysql2/promise";

export const checkUserExist = async (connection: Connection, email: string) => {
	const sqlExist = "SELECT username, email FROM `users` WHERE email=?";
	const compareExist = [email];
	const [resultExist]: any[] = await connection.query(sqlExist, compareExist);
	return (resultExist && resultExist.length);
}