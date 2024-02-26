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
import * as routes from './routes';

const saltRounds = 10;
const secret = "full-stack-login-2024";
let connectDb = true;

dotenv.config();

interface MulterRequest extends Request {
    file: {
        originalname: string;
    }
}

interface User extends ResultSetHeader {
    password: string;
    email: string;
    avatar: string;
    avatar_name: string;
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
    let { page, limit, search }: any = req.query;
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

    const pageIndex = parseInt(page);
    const limitNum = parseInt(limit);

    const offset = pageIndex * limitNum;

    try {
        const totalUser = await new Promise((resolve, reject) => {
            const compareTotal = keywords ? ["1", `%${keywords}%`, `%${keywords}%`, `%${keywords}%`] : ["1"];
            connection.query(sqlTotalString, compareTotal, (error, results) => {
                if (error) {
                    return reject(error);
                }
                return resolve(results);
            });
        });
        const total = totalUser[0].totalUser;

        const dataList = await new Promise((resolve, reject) => {
            const compareDatas = keywords ? ["1", `%${keywords}%`, `%${keywords}%`, `%${keywords}%`, limitNum, offset] : ["1", limitNum, offset];
            connection.query(sqlDataString, compareDatas, (error, results: ResultSetHeader[]) => {
                if (error) {
                    return reject(error);
                }
                if (results && results.length) {
                    results.map((obj: User) => {
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
            "SELECT username, email, first_name, last_name, avatar_name FROM `users` WHERE id=?",
            [id],
            (err, results, fields) => {
                let data: User;
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
                "INSERT INTO users(username, password, email, first_name, last_name) VALUES (?, ?, ?, ?, ?)",
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
            "UPDATE users SET email = ?, first_name = ?, last_name = ? WHERE username = ?",
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
            "UPDATE users SET avatar_name = ? WHERE id = ?",
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
            "DELETE FROM users WHERE id=?",
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
                "INSERT INTO users(username, password, email, first_name, last_name) VALUES (?, ?, ?, ?, ?)",
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
        "SELECT * FROM `users` WHERE email=?",
        [req.body.email],
        function (err, users: User[], fields) {
            if (err) {
                res.json({ status: "error", message: err });
                return;
            }
            if (users.length === 0) {
                res.json({ status: "error", message: "no user found" });
                return;
            }

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

app.get("/noi", routes.noi);

const allowlist = ['http://example1.com', 'https://suaipisuai.com'];
const corsOptionsDelegate = function (req, callback) {
    let corsOptions;
    if (allowlist.indexOf(req.header('Origin')) !== -1) {
        corsOptions = { origin: true };
    } else {
        corsOptions = { origin: false };
    }
    console.log(corsOptions);
    callback(null, corsOptions);
}

app.get('/my-character', cors(corsOptionsDelegate), (req, res) => {
    res.json({
        message: 'My Character',
        users: [
            {
                id: 1,
                name: 'Noi Vinsmoke'
            },
            {
                id: 2,
                name: 'Unknown God'
            }
        ]
    });
});

app.get("/", (req, res) => {
    res.json({
        message: 'สมศรี หักคอหมีด้วยมือเปล่า'
    });
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const port = process.env.API_PORT;
app.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
});