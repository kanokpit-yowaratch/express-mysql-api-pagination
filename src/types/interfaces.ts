import { ResultSetHeader } from "mysql2/promise";
import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

export interface MulterRequest extends Request {
	file: {
		originalname: string;
	}
}

const storage = multer.diskStorage(
	{
		destination: './public/uploads/',
		filename: (req, file, cb) => {
			cb(null, 'avatar-' + file.originalname);
		}
	}
);

export const upload = multer({ storage: storage });

export interface User extends ResultSetHeader {
	username: string;
	password: string;
	email: string;
	first_name: string;
	last_name: string;
	avatar: string;
	avatar_name: string;
}

export type ResultResponse = {
	data: any[];
	total: number;
	pages: number;
	limit: number;
	currentPage: number;
}

export type UserQueryParams = {
	search?: string;
	page?: string;
	limit?: string;
};