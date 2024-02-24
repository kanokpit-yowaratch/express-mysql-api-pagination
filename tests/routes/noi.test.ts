import * as routes from '../../src/routes'

describe('routes', () => {
    it('test route noi', () => {
        const request = { query: { id: 1, name: 'noi' } };
        const result = routes.noi(request, null);
        expect(result).toEqual(`ID: ${request.query.id}, Name: ${request.query.name}`);

        // const req = {
        //     query: {}
        // };
        // req.query = "?id=1&name=noi";

        // Success but => ID: undefined, Name: undefined
        // const result = routes.noi(req, null);
    });
});