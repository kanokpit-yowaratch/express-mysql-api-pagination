import express, { Request, Response, NextFunction } from "express";
import { connectionState } from "../db-config";
import { User } from "../interfaces/common.interface";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const router = express.Router();
const saltRounds = 10;
const secret = "full-stack-login-2024";

router.post("/register", async (req: Request, res: Response, next: NextFunction) => {
    const { password, email, first_name, last_name } = req.body;
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
                [email, hash, email, first_name, last_name]);

            return res
                .status(201)
                .json({ status: "ok", message: "Register successfully." });
        });
    } catch (error) {
        console.log(error);
        if (connection) {
            connection.end();
        }
        return res.status(500).send();
    }
});

router.post("/login", async (req, res, next) => {
    const { connection } = await connectionState();
    try {
        if (!connection) {
            const err = new Error('Error');
            err.message = 'Something went wrong!';
            throw err;
        }

        const [results]: any = await connection.execute(
            "SELECT * FROM `users` WHERE email=?",
            [req.body.email]);

        const userData = results ? results[0] : null;

        if (!userData) {
            res.json({ status: "error", message: "no user found" });
            return;
        }

        bcrypt.compare(
            req.body.password,
            userData.password,
            (err, isLogin) => {
                if (isLogin) {
                    const token = jwt.sign({ email: userData.email }, secret, {
                        expiresIn: "1h",
                    });
                    res.json({ status: "ok", message: "login success", token });
                } else {
                    res.json({ status: "error", message: "login failed" });
                }
            }
        );
    } catch (error) {
        console.log(error);
        res.send(error.message);
    }
});

router.post("/authen", (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const decode = jwt.verify(token, secret);
        res.json({ status: "ok", decode });
    } catch (error) {
        res.json({ status: "error", message: error.message });
    }
});

export default router;