import AxiosClient from "@swissknife-api-components-nodejs/axios-client";
import { User } from "@swissknife-api-components-nodejs/user";
import { decode } from "jsonwebtoken";
import { isNil } from "lodash";
import { LRUCache } from "lru-cache";

import AuthIdentifiers from "./AuthIdentifiers";
import AuthTokenClaims from "./AuthTokenClaims";
import InvalidAccessToken from "./InvalidAccessToken";

export default class AuthService {
    private verifyCache: LRUCache<string, boolean>;
    private userCache: LRUCache<string, User>;
    constructor(
        private readonly authServiceAxiosClient: AxiosClient,
        /**
         * Calling the AuthService `verify`  and `getIdentifiers`
         * APIs multiple times for the same user in the span of a few seconds
         * _most likely_ produces the same result. Therefore, in order to speed
         * up the methods of this class an in-memory cache is used. The
         * `cacheConfiguration` object allows to configure the behavior of the
         * cache.
         *
         * When configuring the cache, keep in mind that:
         *
         * - an access token takes approximately 800 bytes of memory
         * - each user takes approximately 200 bytes of memory
         */
        cacheConfiguration = {
            verify: { maxSize: 10_000, maxAge: 60_000 },
            getUser: { maxSize: 10_000, maxAge: 60_000 },
        },
        private readonly skipVerifyToken: boolean = false,
    ) {
        this.skipVerifyToken = skipVerifyToken;
        this.verifyCache = new LRUCache({
            max: cacheConfiguration.verify.maxSize,
            maxSize: cacheConfiguration.verify.maxSize,
            ttl: cacheConfiguration.verify.maxAge,
            sizeCalculation: () => 1,
        });
        this.userCache = new LRUCache({
            max: cacheConfiguration.getUser.maxSize,
            maxSize: cacheConfiguration.getUser.maxSize,
            ttl: cacheConfiguration.getUser.maxAge,
            sizeCalculation: () => 1,
        });
    }

    async verify(accessToken: string): Promise<void> {
        if (this.skipVerifyToken) {
            return;
        }
        const cacheKey = accessToken;
        const cachedAccessTokenIsValid = this.verifyCache.get(cacheKey);
        const accessTokenIsValid =
            cachedAccessTokenIsValid ??
            (await this.uncachedIsAccessTokenValid(accessToken));
        if (cachedAccessTokenIsValid === undefined) {
            this.verifyCache.set(cacheKey, accessTokenIsValid);
        }
        if (!accessTokenIsValid) {
            throw new InvalidAccessToken();
        }
    }

    async getUser(accessToken: string): Promise<User> {
        const cacheKey = accessToken;
        const cachedUser = this.userCache.get(cacheKey);
        const user = cachedUser ?? (await this.uncachedGetUser(accessToken));
        if (cachedUser === undefined) {
            this.userCache.set(cacheKey, user);
        }
        return user;
    }

    private async uncachedIsAccessTokenValid(
        accessToken: string,
    ): Promise<boolean> {
        try {
            await this.authServiceAxiosClient.request({
                url: "/api/v1/verify",
                method: "post",
                data: { accessToken },
            });
            return true;
        } catch {
            return false;
        }
    }

    private async uncachedGetUser(accessToken: string): Promise<User> {
        try {
            const authIdentifiers = await this.getIdentifiers(accessToken);
            return {
                id: authIdentifiers.id,
                email: authIdentifiers.subject,
            };
        } catch {
            throw new InvalidAccessToken();
        }
    }

    private async getIdentifiers(
        accessToken: string,
    ): Promise<AuthIdentifiers> {
        const claims = decode(accessToken) as AuthTokenClaims;
        if (!isNil(claims)) {
            return {
                id: claims.uid,
                subject: claims.sub,
            };
        } else {
            const response =
                await this.authServiceAxiosClient.request<AuthIdentifiers>({
                    url: "/api/v1/identifiers",
                    method: "get",
                    headers: {
                        authorization: `Bearer ${accessToken}`,
                        // The auth-service breaks (500) if no content-type is
                        // provided
                        "content-type": "application/json",
                    },
                });
            return response.data;
        }
    }
}
