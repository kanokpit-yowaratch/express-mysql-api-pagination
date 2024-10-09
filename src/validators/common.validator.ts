import joiImport from 'joi';
import joiDate from '@joi/date';

const Joi = joiImport.extend(joiDate);

export default Joi as typeof joiImport;
