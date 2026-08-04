const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Store Puppeteer Chrome cache inside project directory so Render & Replit preserve it in build artifacts
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
