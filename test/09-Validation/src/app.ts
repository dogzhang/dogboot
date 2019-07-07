import { DogBootApplication } from "../../../bin/lib/DogBoot";
import path = require('path');

process.env.dogbootEntry = __filename
let port = 3000 + Number.parseInt(path.basename(path.resolve(__dirname, '..')).match(/^\d+/)[0])
export const appPromise = DogBootApplication.create(port).runAsync()