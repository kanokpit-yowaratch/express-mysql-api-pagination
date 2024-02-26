export const noi = (req, res) => {
    const { id, name } = req.query;
    const basicInfo = `ID: ${id}, Name: ${name}`;
    return res.status(200).json({ status: "ok", data: basicInfo });
};