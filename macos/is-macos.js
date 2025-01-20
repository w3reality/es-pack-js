#!/usr/bin/env node

const os = require('os');
const isMacOS = os.platform() === 'darwin';

process.exit(isMacOS ? 0 : 1);
