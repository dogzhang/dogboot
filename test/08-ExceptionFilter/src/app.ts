import path = require('path');
import { getContainer } from '../../../bin/index';

let port = 3100 + Number.parseInt(path.basename(path.resolve(__dirname, '..')).match(/^\d+/)[0])
process.env.dogEntry = __filename
process.env.dogPort = port.toString()

export const containerPromise = getContainer().runAsync()