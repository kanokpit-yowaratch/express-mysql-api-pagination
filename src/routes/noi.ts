export const noi = (req, res) => {
    const { id, name } = req.query;
    let basicInfo = '';

    try {
        basicInfo = `ID: ${id}, Name: ${name}`;
        res.status(200).json({ status: "ok", data: basicInfo });
    } catch (error) {
        res.status(500).json({ status: "error", data: null });
    }
};