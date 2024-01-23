import express from 'express';
import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mysql, { ResultSetHeader } from 'mysql2';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import multer from 'multer';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from "./swagger.json";
import dotenv from 'dotenv';

const saltRounds = 10;
const secret = "full-stack-login-2024";
let connectDb = true;

dotenv.config();

interface MulterRequest extends Request {
    file: any;
}

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
});

connection.connect((error) => {
    if (error) {
        connectDb = false;
        console.log(`Can't connect DB: ${error}`);
        // throw error;
    } else {
        console.log("Connected!");
    }
});

var storage = multer.diskStorage(
    {
        destination: './public/uploads/',
        filename: (req, file, cb) => {
            cb(null, 'avatar-' + file.originalname);
        }
    }
);

var upload = multer({ storage: storage });

const app = express()
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ limit: "2mb" }));
app.use(express.static('public'));

// get users
app.get("/users", async (req, res, next) => {
    const sqlTotalString =
        "SELECT COUNT(*) as totalUser FROM `docker_users` WHERE user_status = ?";
    const sqlDataString =
        "SELECT * FROM `docker_users` WHERE user_status = ? limit ? offset ?";

    let { reqPage, reqLimit } = req.query;

    const page = parseInt((reqPage || '1').toString());
    const limit = parseInt((reqLimit || '5').toString());

    const offset = (page - 1) * limit;
    const values = ["1", +limit, +offset];

    try {
        const totalUser = await new Promise((resolve, reject) => {
            connection.query(sqlTotalString, ["1"], (error, results) => {
                if (error) {
                    return reject(error);
                }
                return resolve(results);
            });
        });
        const total = totalUser[0].totalUser;

        const dataList = await new Promise((resolve, reject) => {
            connection.query(sqlDataString, values, (error, results: ResultSetHeader[]) => {
                if (error) {
                    return reject(error);
                }
                if (results && results.length) {
                    results.map((obj: any) => {
                        obj.avatar = req.protocol + '://' + req.get('host') + '/uploads/' + obj.avatar_name;
                        return obj;
                    });
                }
                return resolve(results);
            });
        });

        const totalPage = Math.ceil(+total / limit);

        res.json({
            data: dataList,
            total: total,
            pages: totalPage,
            limit: limit,
            currentPage: page,
        });
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
        connection.end();
        // sqlState: '42S02',
        // sqlMessage: "Table 'noi_live_code.users7' doesn't exist",
        // sql: "SELECT COUNT(*) as totalUser FROM `users7` WHERE user_status = '1'"
        return res.status(500).send({ message: "SQL Error" });
    }
});

// get user by id
app.get("/users/:id", (req, res, next) => {
    const id = req.params.id;
    if (id && connectDb) {
        connection.query(
            "SELECT username, email, first_name, last_name, avatar_name FROM `docker_users` WHERE id=?",
            [id],
            (err, results, fields) => {
                let data: any = {};
                if (results && results[0]) {
                    const user = results[0];
                    data = user;
                    if (data.avatar_name) {
                        data = { ...user, avatar: req.protocol + '://' + req.get('host') + '/uploads/' + user.avatar_name }
                    }
                }
                res.json(data);
            }
        );
    } else {
        connection.end();
    }
});

// app.get("/avatar/:avatar", (req, res, next) => {
//   const fileUrl = url.pathToFileURL('./uploads/avatar-kung.jpg');
// });

app.post("/users/create", (req, res, next) => {
    const { username, password, email, first_name, last_name } = req.body;
    try {
        bcrypt.hash(password, saltRounds, function (err, hash) {
            connection.query(
                "INSERT INTO docker_users(username, password, email, first_name, last_name) VALUES (?, ?, ?, ?, ?)",
                [username, hash, email, first_name, last_name],
                (err, results, fields) => {
                    if (err) {
                        console.log("Error while inserting a user into the database: ", err);
                        return res.status(400).send();
                    }
                    return res
                        .status(201)
                        .json({ status: "ok", message: "New user successfully created." });
                }
            );
        });
    } catch (error) {
        console.log(error);
        connection.end();
        return res.status(500).send();
    }
});

// Update [email, first_name, last_name]
app.put("/users/update", function (req, res, next) {
    const { email, first_name, last_name, username } = req.body;
    try {
        connection.query(
            "UPDATE docker_users SET email = ?, first_name = ?, last_name = ? WHERE username = ?",
            [email, first_name, last_name, username],
            (err, results, fields) => {
                if (err) {
                    console.log("Error while updating a user: ", err);
                    return res.status(400).send();
                }
                return res.status(200).json({ status: "ok", message: "User updated successfully!" });
            }
        );
    } catch (error) {
        console.log(error);
        connection.end();
        return res.status(500).send();
    }
});

// Update [avatar]
app.post("/users/update-avatar", upload.single('avatar'), async (req: MulterRequest, res, next) => {
    const id = req.body.id;
    const file = req.file;

    // const newFileName = `${id}_${new Date().toJSON().slice(0, 10)}_${file_name}`;
    const newFileName = 'avatar-' + file.originalname;

    try {
        connection.query(
            "UPDATE docker_users SET avatar_name = ? WHERE id = ?",
            [newFileName, id],
            (err, results, fields) => {
                if (err) {
                    console.log("Error while updating a user: ", err);
                    return res.status(400).send();
                }
                return res.status(200).json({ status: "ok", message: "User updated successfully!" });
            }
        );
    } catch (error) {
        console.log(error);
        connection.end();
        return res.status(500).send();
    }
});

// Delete users by id
app.delete("/users/delete/:id", function (req, res, next) {
    const id = req.params.id;
    try {
        connection.query(
            "DELETE FROM docker_users WHERE id=?",
            [id],
            (err, results, fields) => {
                if (err) {
                    console.log("Error while updating a user: ", err);
                    return res.status(400).send();
                }
                return res.status(200).json({ status: "ok", message: "User updated successfully!" });
            }
        );
    } catch (error) {
        connection.end();
        console.log(error);
        return res.status(500).send();
    }
});

// change password

app.post("/register", function (req, res, next) {
    const { password, email, first_name, last_name } = req.body;
    try {
        bcrypt.hash(password, saltRounds, function (err, hash) {
            connection.query(
                "INSERT INTO docker_users(username, password, email, first_name, last_name) VALUES (?, ?, ?, ?, ?)",
                [email, hash, email, first_name, last_name],
                (err, results, fields) => {
                    if (err) {
                        console.log("Error while inserting a user into the database: ", err);
                        return res.status(400).send();
                    }
                    return res
                        .status(201)
                        .json({ status: "ok", message: "Register successfully." });
                }
            );
        });
    } catch (error) {
        console.log(error);
        connection.end();
        return res.status(500).send();
    }
});

app.post("/login", function (req, res, next) {
    connection.execute(
        "SELECT * FROM `docker_users` WHERE email=?",
        [req.body.email],
        function (err, users, fields) {
            if (err) {
                res.json({ status: "error", message: err });
                return;
            }
            // TODO: Find solution
            // if (users.length === 0) {
            //     res.json({ status: "error", message: "no user found" });
            //     return;
            // }

            bcrypt.compare(
                req.body.password,
                users[0].password,
                function (err, isLogin) {
                    if (isLogin) {
                        const token = jwt.sign({ email: users[0].email }, secret, {
                            expiresIn: "1h",
                        });
                        res.json({ status: "ok", message: "login success", token });
                    } else {
                        res.json({ status: "error", message: "login failed" });
                    }
                }
            );
        }
    );
});

app.post("/authen", (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const decode = jwt.verify(token, secret);
        res.json({ status: "ok", decode });
    } catch (error) {
        res.json({ status: "error", message: error.message });
    }
});

app.use("/", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const port = process.env.API_PORT;
app.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
});