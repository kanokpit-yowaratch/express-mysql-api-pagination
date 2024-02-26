export const noi = (req, res) => {
    const { id, name } = req.query;
    let basicInfo = '';

    if (id && name) {
        basicInfo = `ID: ${id}, Name: ${name}`;
        res.json({ status: "ok", data: basicInfo });
    } else {
        res.json({ status: "error", data: null });
    }
};