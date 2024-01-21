import {
    Logger,
    LoggingHeader,
    WellKnownLogType,
} from "@swissknife-api-components-nodejs/logger";
import {
    Request,
    RequestService,
} from "@swissknife-api-components-nodejs/requests";
import { RequestHandler } from "express";
import { first } from "lodash";
import { nanoid } from "nanoid";

import forwardThrownRequestHandlerErrors from "../../utils/forwardThrownRequestHandlerErrors";
import getIncomingRequestLogInfo from "./getIncomingRequestLogInfo";

const DEFAULT_LOCALE = "it-IT";
const MISSING_HEADER = "missing";

export default function logRequest(
    requestService: RequestService,
    logger: Logger,
): RequestHandler {
    return forwardThrownRequestHandlerErrors((req, res, next) => {
        const requestStartedAt = Date.now();

        const request: Request = {
            accessToken: null,
            user: null,
            locale: first(req.acceptsLanguages()) ?? DEFAULT_LOCALE,
            requestId: req.header(LoggingHeader.XRequestId) ?? nanoid(),
            correlationId: req.header(LoggingHeader.XCorrelationId) ?? nanoid(),
            appName: req.header(LoggingHeader.XAppName) ?? MISSING_HEADER,
            appVersion: req.header(LoggingHeader.XAppVersion) ?? MISSING_HEADER,
        };
        requestService.set(request);

        res.header(LoggingHeader.XRequestId, request.requestId);
        res.header(LoggingHeader.XCorrelationId, request.correlationId);

        // Response completely sent to the client
        res.on("finish", () => {
            logger.info(
                getIncomingRequestLogInfo({
                    request: req,
                    response: res,
                    message: WellKnownLogType.IncomingRequestFinished,
                    type: WellKnownLogType.IncomingRequestFinished,
                    requestStartedAt: requestStartedAt,
                }),
            );
        });

        // Response prematurely closed, not completely sent to the client
        res.on("close", () => {
            if (!res.writableEnded) {
                logger.warn(
                    getIncomingRequestLogInfo({
                        request: req,
                        response: res,
                        message: WellKnownLogType.IncomingRequestFailed,
                        type: WellKnownLogType.IncomingRequestFailed,
                        requestStartedAt: requestStartedAt,
                    }),
                );
            }
        });

        next();
    });
}
