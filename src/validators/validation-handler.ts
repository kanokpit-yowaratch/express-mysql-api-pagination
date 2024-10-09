import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import httpStatus from 'http-status';
import { ObjectSchema, ArraySchema } from 'joi';

interface ValidatorSchema {
  params?: ObjectSchema;
  query?: ObjectSchema;
  headers?: ObjectSchema;
  cookies?: ObjectSchema;
  body?: ObjectSchema | ArraySchema;
}

export const validator = (schema: ValidatorSchema) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const keys = Object.keys(schema);
    if (!keys.length) {
      return next();
    }

    const promises = keys.map(async (key) => {
      try {
        const values = await schema[key].validateAsync(req[key]);
      } catch (error) {
        return error.details.map((e) => ({
          message: e.message,
          path: e.path.join('.'),
          location: key,
        }));
      }
    });
    const results = await Promise.all(promises);
    const errors = results.filter(Boolean);
    if (!errors.length) {
      return next();
    }

    const error = createHttpError(httpStatus.BAD_REQUEST, {
      errors: errors.flat(),
    });
    error.isInvalid = true;

    next(error);
  };
};
