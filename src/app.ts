import express from 'express';
import http from 'http';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from "./swagger.json";
import { checkConnectionState } from './middleware/connection-state.middleware';
import createHttpError from 'http-errors';
import httpStatus from 'http-status';
import routes from './routes';
import { connectionState } from './db-config';
import { noi } from './routes/noi';
import { pick } from 'lodash';

const app = express();
app.use(cors());
app.use(checkConnectionState);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ limit: "2mb" }));
app.use(express.static('public'));

app.use('/api', routes);

const corsOptions = {
	origin: 'http://suaipisuai.com',
	credentials: true,
	optionSuccessStatus: 200
}

app.get("/noi", cors(corsOptions), noi);
app.use("/", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// --- start error handler --- //
// app.use((_req, _res, next) => {
// 	next(createHttpError(httpStatus.NOT_FOUND));
// });

app.use((error, _req, res, _next) => {
	const statusCode = error.status || httpStatus.INTERNAL_SERVER_ERROR;
	const message = error.message || httpStatus[statusCode];
	const info = pick(error, ['details', 'errors', 'code', 'value']);

	res.status(statusCode).json({
		statusCode,
		message,
		...info,
	});
});
// --- end error handler --- //

const port = process.env.API_PORT;
// app.listen(port, () => {
//     console.log(`Listening on port ${port}`);
// });

// --- start http handler --- //
const server = http.createServer(app);
server.listen(port, () => {
	console.log(`Listening on port ${port}`);
});

const quit = async (signal: string) => {
	console.log(`${signal} signal received: closing HTTP server`);
	const { connection } = await connectionState();
	connection.end();
	console.log('DB connection closed.');
	server.close();
	console.log('HTTP server closed.');
	process.exit();
};

['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach((signal: string) => {
	process.on(signal, () => {
		quit(signal);
	});
});
// --- end http handler --- //