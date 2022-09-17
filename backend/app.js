require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const BodyParser = require('body-parser');
const { errors } = require('celebrate');
const cenralErrors = require('./middlewares/central-err');
const { requestLogger, errorLogger } = require('./middlewares/logger');

const app = express();
const routes = require('./routes/routes');

const { PORT = 3000 } = process.env;

async function main() {
  try {
    await mongoose.connect('mongodb://localhost:27017/mestodb');
  } catch (error) {
    console.log(error);
  }
  app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
  });
}

app.use(BodyParser.json());
app.use(requestLogger);
app.use(express.json());
app.use(routes);
app.use(errorLogger);
app.use(errors());
app.use(cenralErrors);
main();
