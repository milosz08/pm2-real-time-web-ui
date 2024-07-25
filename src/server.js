'use strict';

const express = require('express');
const http = require('http');
const nocache = require('nocache');
const expressSession = require('express-session');
const path = require('path');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const memoryStore = require('memorystore');
const { engine } = require('express-handlebars');

const config = require('./utils/config');
const webRouter = require('./router/web');
const apiRouter = require('./router/api');
const { commonVariables } = require('./middleware/root');
const logger = require('./utils/logger');

const app = express();
const httpServer = http.createServer(app);
const MemoryStore = memoryStore(expressSession);
const sessionStore = new MemoryStore({
  checkPeriod: config.sessionMaxLife,
});

const io = new Server(httpServer);
const monitIo = io.of('/monit');
const consoleIo = io.of('/console');

app.use(nocache());
app.use(cookieParser());

app.use(expressSession({
  secret: config.sessionSecret,
  saveUninitialized: true,
  cookie: {
    maxAge: config.sessionMaxLife * 1000,
    secure: config.isProd,
  },
  resave: true,
  rolling: true,
  store: sessionStore,
}));

app.engine('.hbs', engine({ extname: '.hbs' }));
app.set('view engine', '.hbs');
app.set('views', path.resolve(__dirname, 'views'));

app.use('/static', express.static(path.resolve(__dirname, 'public')));
app.use('/', commonVariables);

app.use('/api', express.json());
app.use('/', express.urlencoded({ extended: true }));

app.use('/', webRouter);
app.use('/api', apiRouter);

module.exports = {
  io,
  monitIo,
  consoleIo,
  sessionStore,
};

require('./socket/handler');

httpServer.listen(config.port, () => {
  logger.info(`Server started at port: ${config.port}`)
});
