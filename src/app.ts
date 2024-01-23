import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from "./swagger.json";

const app = express();
const port = 4000;

app.get('/salt', (req, res) => {
    res.send('เค็ม แต่ดี');
});

app.use("/", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
});