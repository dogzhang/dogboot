import { DogBootApplication } from "dogboot";

process.env.dogbootEntry = __filename
export const appPromise = DogBootApplication.create().runAsync()