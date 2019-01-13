import { Config, Field } from "../../lib/DogBoot";

@Config('redisKey')
export class RedisKeyConfig {
    @Field()
    accessToken: string

    @Field()
    ticket: string

    @Field()
    shopLastOnline: string

    @Field()
    qrcodeForInviteSeller: string
}