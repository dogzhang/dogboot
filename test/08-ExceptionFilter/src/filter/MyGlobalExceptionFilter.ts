import { GlobalExceptionFilter, ExceptionHandler } from "../../../../bin/lib/DogBoot";

@GlobalExceptionFilter
export class MyGlobalExceptionFilter {
    @ExceptionHandler(Error)
    async handleError(error: Error, ctx: any) {
        ctx.body = error.message
    }
}