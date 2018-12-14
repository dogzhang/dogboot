export class JsonResult<T> {
    success: boolean
    data: T
    code: number
    message: string

    constructor(success: boolean, data: T, code: number, message: string) {
        this.success = success
        this.data = data
        this.code = code
        this.message = message
    }
}

export class JsonResultUtil {

    static ok<T>(data: T = null): JsonResult<T> {
        return new JsonResult(true, data, 0, 'ok')
    }
    static fail<T>(code = 3, message = null, data: T = null): JsonResult<T> {
        return new JsonResult(false, data, code, message)
    }
    static toastFail<T>(message: string): JsonResult<T> {
        return this.fail(1, message)
    }
    static alertFail<T>(message: string): JsonResult<T> {
        return this.fail(2, message)
    }
}