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
    password: string;
    email: string;
    avatar: string;
    avatar_name: string;
}