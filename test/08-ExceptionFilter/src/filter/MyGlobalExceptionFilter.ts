import { GlobalExceptionFilter, ExceptionHandler } from "../../../../bin/lib/DogBoot";

@GlobalExceptionFilter
export class MyGlobalExceptionFilter {
    @ExceptionHandler(Error)
    async handleError(ctx: any, error: Error) {
        ctx.body = error.message
    }
}