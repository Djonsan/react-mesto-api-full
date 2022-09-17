const Сard = require('../models/card');

const BadRequestError = require('../errors/bad-request-err');
const NotFoundError = require('../errors/not-found-err');
const DelCardError = require('../errors/del-card-err');

module.exports.getCards = (req, res, next) => {
  Сard.find({})
    .then((cards) => res.send({ cards }))
    .catch(next);
};

module.exports.createCard = (req, res, next) => {
  const { name, link } = req.body;

  Сard.create({ name, link, owner: req.user._id })
    .then((card) => {
      res.send(card);
    })
    .catch((err) => {
      if (err.name === 'ValidationError') {
        return next(new BadRequestError('Переданы некорректные данные при создании карточки.'));
      }
      return next(err);
    });
};

module.exports.deleteCard = (req, res, next) => {
  Сard.findById(req.params.cardId)
    .then((cards) => {
      if (!cards) {
        throw new NotFoundError('Карточка с указанным _id не найдена.');
      } else if (!cards.owner.equals(req.user._id)) {
        throw new DelCardError('Попытка удалить чужую карточку.');
      } else {
        return cards.remove().then(() => res.status(200).send(cards));
      }
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        return next(new BadRequestError('Переданы некорректные данные при удалении карточки.'));
      }
      return next(err);
    });
};

module.exports.likeCard = (req, res, next) => {
  Сard.findByIdAndUpdate(
    req.params.cardId,
    { $addToSet: { likes: req.user._id } },
    { new: true },
  )
    .then((cards) => {
      if (!cards) {
        throw new NotFoundError('Передан несуществующий _id карточки.');
      }
      res.send({ cards });
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        return next(new BadRequestError('Переданы некорректные данные для изменения лайка.'));
      }
      return next(err);
    });
};

module.exports.dislikeCard = (req, res, next) => {
  Сard.findByIdAndUpdate(
    req.params.cardId,
    { $pull: { likes: req.user._id } },
    { new: true },
  )
    .then((cards) => {
      if (!cards) {
        throw new NotFoundError('Передан несуществующий _id карточки.');
      }
      res.send({ cards });
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        return next(new BadRequestError('Переданы некорректные данные для изменения лайка.'));
      }
      return next(err);
    });
};
