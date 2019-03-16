import { Config, Typed } from "../../lib/DogBoot";

@Config('redisKey')
export class RedisKeyConfig {
    @Typed()
    accessToken: string

    @Typed()
    ticket: string

    @Typed()
    shopLastOnline: string

    @Typed()
    qrcodeForInviteSeller: string
}