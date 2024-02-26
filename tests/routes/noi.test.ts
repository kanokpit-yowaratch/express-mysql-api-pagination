import * as routes from '../../src/routes'

describe('routes', () => {
    it('test route noi', () => {
        const req = { query: { id: 1, name: 'noi' } };
        const { id, name } = req.query;
        const basicInfo = `ID: ${id}, Name: ${name}`;
        const res = {
            json: () => ({
                status: "ok",
                data: basicInfo
            })
        };
        const result = routes.noi(req, res);
        expect(result).toBeUndefined();
        // expect(result).toEqual(`ID: ${request.query.id}, Name: ${request.query.name}`);

        // const req = {
        //     query: {}
        // };
        // req.query = "?id=1&name=noi";

        // Success but => ID: undefined, Name: undefined
        // const result = routes.noi(req, null);
    });
});