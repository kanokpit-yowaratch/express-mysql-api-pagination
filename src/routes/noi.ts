export const noi = (req, res) => {
    const { id, name } = req.query;
    const basicInfo = `ID: ${id}, Name: ${name}`;
    return basicInfo;
};