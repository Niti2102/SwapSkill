const Joi = require('joi');

const registerValidation = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    skillsKnown: Joi.array().items(Joi.string()).required(),
    skillsWanted: Joi.array().items(Joi.string()).required(),
  });
  return schema.validate(data);
};

module.exports = { registerValidation };
