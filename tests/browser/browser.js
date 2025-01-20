const os = require('os');
const isMacOS = os.platform() === 'darwin';
const isLinux = os.platform() === 'linux';

const getBrowser = async (customPuppeteer=undefined) => {
    const puppeteer = customPuppeteer ? customPuppeteer :
        require(isMacOS ? '../../macos/node_modules/puppeteer' : 'puppeteer');

    // https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#setting-up-chrome-linux-sandbox
    return isLinux ? await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
                   : await puppeteer.launch();
};

module.exports = { getBrowser };
