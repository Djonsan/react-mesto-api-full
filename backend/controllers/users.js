const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { SEKRET_KEY } = require('../constants');

const SALT_ROUNDS = 10;

const { NODE_ENV, JWT_SECRET } = process.env;

const BadAuthError = require('../errors/bad-auth-err');
const BadRequestError = require('../errors/bad-request-err');
const NotFoundError = require('../errors/not-found-err');
const ExistEmailError = require('../errors/exist-email-err');

module.exports.login = (req, res, next) => {
  const { email, password } = req.body;

  return User.findUserByCredentials(email, password)
    .then((user) => {
      const token = jwt.sign({ _id: user._id }, NODE_ENV === 'production' ? JWT_SECRET : SEKRET_KEY, { expiresIn: '7d' });
      res.send({ token });
    })
    .catch(() => {
      next(new BadAuthError('Неправильные почта или пароль.'));
    });
};

module.exports.getUserById = (req, res, next) => {
  User.findById(req.params.userId)
    .orFail(() => {
      next(new NotFoundError('_id Ошибка. Пользователь не найден, попробуйте еще раз'));
    })
    .then((user) => {
      if (user) {
        res.send(user);
      } else {
        throw (new NotFoundError('_id Ошибка. Пользователь не найден, попробуйте еще раз'));
      }
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        return next(new BadRequestError(`_id Ошибка. ${req.params} Введен некорректный id пользователя`));
      }
      return next(err);
    });
};

module.exports.getUsers = (req, res, next) => {
  User.find({})
    .then((result) => res.send(result))
    .catch(next);
};

module.exports.createUser = (req, res, next) => {
  const {
    name, about, avatar, email, password,
  } = req.body;

  if (!email || !password) {
    return res.status(BadRequestError).send({ message: 'Поля email и password обязательны' });
  }
  return bcrypt.hash(req.body.password, SALT_ROUNDS)
    .then((hash) => User.create({
      name, about, avatar, email: req.body.email, password: hash,
    }))
    .then((user) => {
      res.status(200).send({
        name: user.name, about: user.about, avatar: user.avatar, _id: user._id, email: user.email,
      });
    })
    .catch((err) => {
      if (err.name === 'ValidationError') {
        return next(new BadRequestError('Переданы некорректные данные при создании пользователя'));
      }
      if (err.code === 11000) {
        return next(new ExistEmailError('Передан уже зарегистрированный email.'));
      }
      return next(err);
    });
};

module.exports.getCurrentUser = (req, res, next) => {
  User.findById(req.user._id)
    .then((user) => {
      if (!user) {
        return next(new NotFoundError('GET /users/me Пользователь по указанному _id не найден.'));
      }
      return res.status(200).send(user);
    })
    .catch((err) => next(err));
};

module.exports.updateUserProfile = (req, res, next) => {
  const { name, about } = req.body;

  User.findByIdAndUpdate(req.user._id, { name, about }, { new: true, runValidators: true })
    .then((user) => {
      if (!user) {
        return next(new NotFoundError('Пользователь по указанному _id не найден.'));
      }
      return res.send({ data: user });
    })
    .catch((err) => {
      if (err.name === 'ValidationError') {
        return next(new BadRequestError('Переданы некорректные данные при обновлении пользователя'));
      }
      return next(err);
    });
};

module.exports.patchMeAvatar = (req, res, next) => {
  const { avatar } = req.body;

  User.findByIdAndUpdate(req.user._id, { avatar }, { new: true, runValidators: true })
    .then((user) => {
      if (!user) {
        return next(new NotFoundError('Пользователь по указанному _id не найден.'));
      }
      return res.send({ data: user });
    })
    .catch((err) => {
      if (err.name === 'ValidationError') {
        return next(new BadRequestError('Переданы некорректные данные при обновлении пользователя'));
      }
      return next(err);
    });
};
