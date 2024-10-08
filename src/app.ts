import express from 'express';
import http from 'http';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from "./swagger.json";
import { checkConnectionState } from './middleware/connection-state.middleware';
import routes from './routes';
import { connectionState } from './db-config';
import { noi } from './routes/noi';

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

const port = process.env.API_PORT;
// app.listen(port, () => {
//     console.log(`Listening on port ${port}`);
// });

// handle http
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