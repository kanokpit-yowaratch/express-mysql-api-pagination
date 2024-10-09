import Joi from './common.validator';
// import joi from 'joi';

export const create = {
	body: Joi.object({
		username: Joi.string().trim().required(),
		password: Joi.string().trim().required(),
		email: Joi.string().trim().required(),
		first_name: Joi.string().trim().required(),
		last_name: Joi.string().trim().required(),
	}),
};

export const update = {
	body: Joi.object({
		expiredDt: Joi.any()
	}),
	params: Joi.object({
		rowId: Joi.string().required(),
	}),
};

export const remove: any = {
	body: Joi.array().items({
		rowId: Joi.string().trim().required(),
	}),
};

export const searchById: any = {
	params: Joi.object({
		rowId: Joi.string().max(18).min(18).required(),
	}),
};