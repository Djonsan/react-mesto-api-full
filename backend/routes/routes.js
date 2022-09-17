const express = require('express');
const { celebrate, Joi } = require('celebrate');
const validator = require('validator');
const userRouter = require('./user');
const cardRouter = require('./card');
const NotFoundError = require('../errors/not-found-err');
const {
  createUser,
  login,
} = require('../controllers/user');
const { AVATAR_REGEX } = require('../constants');
const auth = require('../middlewares/auth');

const app = express();

app.get('/crash-test', () => {
  setTimeout(() => {
    throw new Error('Сервер сейчас упадёт');
  }, 0);
});

app.post('/signup', celebrate({
  body: Joi.object().keys({
    name: Joi.string().min(2).max(30),
    about: Joi.string().min(2).max(30),
    email: Joi.string().required().custom((value, helpers) => {
      if (validator.isEmail(value)) {
        return value;
      }
      return helpers.message('Некорректный email');
    }),
    password: Joi.string().required(),
    avatar: Joi.string().custom((value, helpers) => {
      if (AVATAR_REGEX.test(value)) {
        return value;
      }
      return helpers.message('Некорректная ссылка');
    }),
  }),
}), createUser);

app.post('/signin', celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().custom((value, helpers) => {
      if (validator.isEmail(value)) {
        return value;
      }
      return helpers.message('Некорректный email');
    }),
    password: Joi.string().required(),
  }),
}), login);

app.use(auth);
app.use(userRouter);
app.use(cardRouter);
app.use('*', auth, (req, res, next) => next(new NotFoundError(`Страницы по адресу ${req.baseUrl} не существует`)));

module.exports = app;