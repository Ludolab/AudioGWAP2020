/**
 * index.js
 * Public (used in interface) routes collector.
 */

const fs = require('fs');
const path = require('path');
const Router = require('koa-router');

const router = new Router();
const scriptName = path.basename(__filename);
const dirName =  __dirname;

const pubApiPrefix = '/pub';

// Scan all the files under current dir and register routes
fs.readdirSync(dirName)
  .filter(file =>
    file != scriptName &&
    !file.startsWith('_') &&
    fs.statSync(path.join(dirName, file)).isFile())
  .forEach((route) => {
    router.use(pubApiPrefix, require(`./${route}`).routes());
  });

module.exports = router;