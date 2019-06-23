import { DogBootApplication } from "../../../bin/lib/DogBoot";

process.env.dogbootEntry = __filename
export const appPromise = DogBootApplication.create().runAsync()