import { RequestService } from "@swissknife-api-components-nodejs/requests";
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { nanoid } from "nanoid";
import qs from "qs";

import { omitNilProperties } from "./utils/omitNilProperties";

export default class AxiosClient {
    private readonly axiosInstance: AxiosInstance;
    constructor(
        requestService: RequestService,
        baseUrl: string,
        userAgent: string,
    ) {
        const {
            accessToken,
            correlationId,
            appName,
            appVersion,
            user,
            locale,
        } = requestService.get()!;
        this.axiosInstance = axios.create({
            baseURL: baseUrl,
            headers: omitNilProperties({
                authorization: `Bearer ${accessToken}`,
                "accept-language": locale,
                "x-user-id": user?.id,
                "x-correlation-id": correlationId,
                "x-request-id": nanoid(),
                "user-agent": userAgent,
                "x-app-name": appName,
                "x-app-version": appVersion,
            }),
            paramsSerializer: (params) =>
                qs.stringify(omitNilProperties(params), { indices: false }),
        });
    }

    request<ResBody = any>(
        config: AxiosRequestConfig,
    ): Promise<AxiosResponse<ResBody>> {
        return this.axiosInstance.request(config);
    }
}
