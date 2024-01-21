import { AuthService } from "@swissknife-api-components-nodejs/auth-service";
import { RequestService } from "@swissknife-api-components-nodejs/requests";
import { RequestHandler } from "express";

import forwardThrownRequestHandlerErrors from "../../utils/forwardThrownRequestHandlerErrors";
import extractAccessToken from "./extractAccessToken";

export default function authenticateRequest(
    requestService: RequestService,
    authService: AuthService,
): RequestHandler {
    return forwardThrownRequestHandlerErrors(async (req, _res, next) => {
        const accessToken = extractAccessToken(req);
        await authService.verify(accessToken);
        requestService.set({
            ...requestService.get(),
            accessToken: accessToken,
            user: await authService.getUser(accessToken),
        });
        next();
    });
}
