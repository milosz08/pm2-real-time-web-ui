# PM2 Real time Web UI

An interactive and open-source management panel for PM2 instances updated in real time. It uses a node.js environment, server-side events and websocket (socket.io) protocol to send resources usage parameters and application logs in real time.

## Table of content
<!-- no toc -->
- [Demo](#demo)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Clone and install](#clone-and-install)
- [hCaptcha challenge](#h-captcha-challenge)
- [Disclaimer](#disclaimer)
- [Tech stack](#tech-stack)
- [Author](#author)
- [License](#license)

<a name="demo"></a>
## Demo
![](.github/pm2-web-ui.gif)

<a name="features"></a>
## Features
- [x] managing already mounted instances (start, restart, reload, stop and delete),
- [x] updating PM2 process state and details in real time (processor and memory usage, uptime),
- [x] updating PM2 process logs in UI in real time (split to `out` and `err`),
- [x] possibility for viewing archived logs in small chunks,
- [x] create additional user accounts with different permissions for running processes (view, start, restart etc.),
- [x] automatic logs rotation in UI (keeping recent 1000 lines to prevent high memory usage),
- [x] hCaptcha challenge in login form for prevent spam,
- [x] simultaneous logout of the user after editing his account by the administrator,
- [x] edit selected ecosystem config file via web interface,
- [ ] handling multiple PM2 instances from different servers,
- [ ] availability to start non-existing process.

<a name="prerequisites"></a>
## Prerequisites
* Node v18 or higher with yarn,
* MongoDB (used for storing additional application users),
* Docker (if you want run MongoDB from `docker-compose.yml` file),
* Modern browser which has support for SSE and Websocket protocol.

<a name="clone-and-install"></a>
## Clone and install

1. To install this software on your computer, use the command below:
```bash
$ git clone https://github.com/milosz08/pm2-real-time-web-ui
```

2. Go to project directory and install packages:
```bash
$ cd pm2-real-time-web-ui
$ yarn install --frozen-lockfile
```
> NOTE: If you don't have Yarn yet, install via: `$ npm i -g yarn`.

3. Change environment variables in `.env` file or provide as exported variables:
```properties
# only for MongoDB docker container
PM2_MONGODB_PORT=<MongoDB port>
PM2_MONGODB_PASSWORD=<MongoDB default root password>

PM2_ADMIN_LOGIN=<default admin account username>
PM2_ADMIN_PASSWORD=<default admin account password>
PM2_ADMIN_PASSWORD_HASHED=<true, if PM2_ADMIN_PASSWORD is hashed with BCrypt>
PM2_DB_CONNECTION=mongodb://<username>:<password>@<host>:<port>/db?authSource=admin
PM2_H_CAPTCHA_SITE_KEY=<hCaptcha site key, see hCaptcha challenge section>
PM2_H_CAPTCHA_SECRET_KEY=<hCaptcha secret, see hCaptcha challenge section>
PM2_COOKIE_SECRET=<cookies secret>
PM2_CSRF_SECRET=<32 characters length secret>
PM2_ECOSYSTEM_CONFIG_FILE_PATH=<path to ecosystem config file>
```

4. **(Only if you don't providing own MongoDB connection)** Create MongoDB instance via:
```bash
$ docker-compose up -d
```
This command should run MongoDB instance on port defined in `PM2_MONGODB_PORT` variable (by default is is `9191`).

5. Run application:
* **(Only for development purposes)** To run development server (with nodemon) type:
```bash
$ yarn run dev
```

* **(For production purposes)** To run server as PM2 process type:
```bash
$ cd pm2-real-time-web-ui
$ pm2 start src/server.js --name Pm2RealTimeUi
$ pm2 save
```

Optionally, you can pass additional parameters:
* `--port` - application port, (by default 3000),
* `--interval` - data refreshing interval (CPU and memory usage) in milliseconds (by default 1000),
* `--sesTime` - session max time in seconds (by default 7200s -> 2h).

Rest of application config you can find in `utils/config.js` file. The most significant fields, what you might be change is:

```js
logsBufferLinesCount: 100, // size of the buffer for reading consecutive log lines through the stream
realTimeLogsBufferLinesCount: 1000, // max count of records in real-time console log dump
```

<a name="h-captcha-challenge"></a>
## hCaptcha challenge
By default in development environment, hCaptcha is active but without any challenge. This is provided by the following keys:
```properties
PM2_H_CAPTCHA_SITE_KEY=20000000-ffff-ffff-ffff-000000000002
PM2_H_CAPTCHA_SECRET_KEY=0x0000000000000000000000000000000000000000
```
for more information, see [this section](https://docs.hcaptcha.com/#test-key-set-publisher-or-pro-account).

To configure hCaptcha for production environment, register new app in hCaptcha dashboard and get **site-key** with **secret-key** (more information about that process you will find [here](https://docs.hcaptcha.com)).

After than, provide two environment variables:
```properties
PM2_H_CAPTCHA_SITE_KEY=<hCaptcha site key>
PM2_H_CAPTCHA_SECRET_KEY=<hCaptcha secret>
```

and make sure that `hCaptchaEnabled` variable is set to true (in `utils/config.js` file):
```js
...
hCaptchaEnabled: true, // this must be true
hCaptchaSiteKey: process.env.PM2_H_CAPTCHA_SITE_KEY,
hCaptchaSecretKey: process.env.PM2_H_CAPTCHA_SECRET_KEY,
...
```

<a name="disclaimer"></a>
## Disclaimer
This application has most of the standard security features (only-http Cookies, CSRF tokens), but it is not advisable to use it in production environments with applications that have sensitive data. I am not responsible for any damage caused from using the application in a production environment.

<a name="tech-stack"></a>
## Tech stack
* Node.js v20,
* Express and Handlebars (views),
* Bootstrap and Chart.js (UI),
* PM2 api,
* Server side events,
* Socket.io (websocket protocol).

<a name="author"></a>
## Author
Created by Miłosz Gilga. If you have any questions about this application, send message: [personal@miloszgilga.pl](mailto:personal@miloszgilga.pl).

<a name="license"></a>
## License
This software is on Apache 2.0 License.
