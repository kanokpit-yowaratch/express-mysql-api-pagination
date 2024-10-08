import { Request, Response, NextFunction } from "express";
import { connectionState } from "../db-config";

export const checkConnectionState = async (req: Request, res: Response, next: NextFunction) => {
    const { connection } = await connectionState();
    if (connection) {
        next();
    } else {
        const error = `Can't connect Database!`;
        res.send(error);
    }
}
