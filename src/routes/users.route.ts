import express, { Request, Response, NextFunction } from "express";
import { connectionState } from "../db-config";
import { MulterRequest, ResultResponse, upload, User } from "../interfaces/common.interface";
import * as v from '../validators/user.validator';
import bcrypt from 'bcrypt';
import { validator } from "../validators/validation-handler";
import httpStatus from "http-status";

const router = express.Router();
const saltRounds = 10;

// get users
router.get("/", async (req, res, next) => {
    let { page = 1, limit = 5, search }: any = req.query;
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

    page = page || 0;
    limit = limit || 5;

    const pageIndex = parseInt(page) - 1;
    const limitNum = parseInt(limit);

    const offset = pageIndex * limitNum;
    const { connection } = await connectionState();

    try {
        if (!connection) {
            const err = new Error('Error');
            err.message = 'Something went wrong!';
            throw err;
        }
        const compareTotal = keywords ? ["1", `%${keywords}%`, `%${keywords}%`, `%${keywords}%`] : ["1"];
        const [resultsTotal, fieldsTotal] = await connection.query(sqlTotalString, compareTotal);
        const total = resultsTotal[0].totalUser;

        const compareDatas = keywords ?
            ["1", `%${keywords}%`, `%${keywords}%`, `%${keywords}%`, limitNum, offset] :
            ["1", limitNum, offset];

        // const sqlQuery = connection.format(sqlDataString, compareDatas);
        // console.log(sqlQuery);

        const [results]: any[] = await connection.query(sqlDataString, compareDatas);

        let dataList = [];
        if (results && results.length) {
            dataList = results.map((obj: User) => {
                obj.avatar = req.protocol + '://' + req.get('host') + '/uploads/' + obj.avatar_name;
                return obj;
            });
        }

        const totalPage = Math.ceil(+total / limit);
        const responseData: ResultResponse = {
            data: dataList,
            total: total,
            pages: totalPage,
            limit: limitNum,
            currentPage: pageIndex + 1,
        }

        res.json(responseData);
    } catch (error) {
        if (error.sqlMessage || error.code || error.errno) {
            if (error.sqlMessage) {
                console.log(error.sqlMessage);
            }
            if (error.code) {
                console.log("Error code: ", error.code);
            }
            if (error.errno) {
                console.log("Error no: ", error.errno);
            }
        } else {
            console.log(error);
        }
        if (connection) {
            connection.end();
        }
        // sqlState: '42S02',
        // sqlMessage: "Table 'noi_live_code.users7' doesn't exist",
        // sql: "SELECT COUNT(*) as totalUser FROM `users7` WHERE user_status = '1'"
        return res.status(500).send({ message: error.message });
    }
});

// get user by id
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const { connection } = await connectionState();

    try {
        if (!connection) {
            const err = new Error('Error');
            err.message = 'Something went wrong!';
            throw err;
        }

        const sql = "SELECT username, email, first_name, last_name, avatar_name FROM `users` WHERE id=?";
        const compareDatas = [id];

        // const sqlQuery = connection.format(sql, compareDatas);
        // console.log(sqlQuery);

        const [results]: any[] = await connection.query(sql, compareDatas);

        if (results && results[0]) {
            const user = results[0];
            let data: User = user;
            if (data.avatar_name) {
                data = { ...user, avatar: req.protocol + '://' + req.get('host') + '/uploads/' + user.avatar_name }
            }
            res.json(data);
        } else {
            res.json('Not found data.');
        }
    } catch (error) {
        console.log(error);
        return res.status(500).send({ message: error.message });
    }
});

// app.get("/avatar/:avatar", (req, res, next) => {
//   const fileUrl = url.pathToFileURL('./uploads/avatar-kung.jpg');
// });

// Create user
router.post("/", validator(v.create), async (req, res, next) => {
    const { username, password, email, first_name, last_name } = req.body;
    const { connection } = await connectionState();
    try {
        if (!connection) {
            const err = new Error('Error');
            err.message = 'Something went wrong!';
            throw err;
        }
        bcrypt.hash(password, saltRounds, async (err, hash) => {
            await connection.query(
                "INSERT INTO users(username, password, email, first_name, last_name) VALUES (?, ?, ?, ?, ?)",
                [username, hash, email, first_name, last_name]);

            return res
                .status(201)
                .json({ status: "ok", message: "New user successfully created." });
        });
    } catch (error) {
        console.log(error);
        if (connection) {
            connection.end();
        }
        return res.status(500).send();
    }
});

// Update [email, first_name, last_name]
router.put("/:id", async (req, res, next) => {
    const { email, first_name, last_name, username } = req.body;
    const { connection } = await connectionState();
    try {
        if (!connection) {
            const err = new Error('Error');
            err.message = 'Something went wrong!';
            throw err;
        }
        await connection.query(
            "UPDATE users SET email = ?, first_name = ?, last_name = ? WHERE username = ?",
            [email, first_name, last_name, username]);
        return res.status(200).json({ status: "ok", message: "User updated successfully!" });
    } catch (error) {
        console.log(error);
        if (connection) {
            connection.end();
        }
        return res.status(500).send({ message: error.message });
    }
});

// Update [avatar]
router.post("/update-avatar", upload.single('avatar'), async (req: MulterRequest, res, next) => {
    const id = req.body.id;
    const file = req.file;
    const { connection } = await connectionState();

    try {
        if (!connection) {
            const err = new Error('Error');
            err.message = 'Something went wrong!';
            throw err;
        }
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

        return res.status(200).json({ status: "ok", message: "User updated successfully!" });

    } catch (error) {
        console.log(error);
        if (connection) {
            connection.end();
        }
        return res.status(500).send({ message: error.message });
    }
});

// Delete users by id
router.delete("/:id", async (req, res, next) => {
    const id = req.params.id;
    const { connection } = await connectionState();
    try {
        if (!connection) {
            const err = new Error('Error');
            err.message = 'Something went wrong!';
            throw err;
        }
        connection.query(
            "DELETE FROM users WHERE id=?",
            [id]);
        return res.status(200).json({ status: "ok", message: "User updated successfully!" });

    } catch (error) {
        if (connection) {
            connection.end();
        }
        console.log(error);
        return res.status(500).send({ message: error.message });
    }
});

// change password

export default router;