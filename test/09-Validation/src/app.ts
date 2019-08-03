import { createApp } from "../../../bin/index";
import path = require('path');

let port = 3000 + Number.parseInt(path.basename(path.resolve(__dirname, '..')).match(/^\d+/)[0])
export const appPromise = createApp({ port, entry: __filename })