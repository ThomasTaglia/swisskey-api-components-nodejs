import {
    IncomingRequestLogInfo,
    redactIncomingRequestLogInfo,
} from "@swissknife-api-components-nodejs/logger";
import { Request, Response } from "express";

export default function getIncomingRequestLogInfo(options: {
    request: Request;
    response: Response;
    message: string;
    type: string;
    requestStartedAt: number;
}): IncomingRequestLogInfo {
    const {
        request: req,
        response: res,
        message,
        type,
        requestStartedAt,
    } = options;

    const requestDuration = Date.now() - requestStartedAt;
    const responseStatusCode = res.statusCode;
    // The express route (with method) that matched the requested url. Might be
    // not defined if no route matched the url, and the request was instead
    // handled by something else (e.g. a middleware)
    const route = req.route?.path
        ? `${req.method} ${req.route.path}`
        : undefined;

    return redactIncomingRequestLogInfo({
        message: message,
        type: type,
        details: {
            method: req.method,
            url: req.originalUrl,
            route: route,
            request_query: req.query,
            request_headers: req.headers,
            client_ip: req.ip,
            status_code: responseStatusCode,
            response_headers: res.getHeaders(),
            duration: requestDuration,
        },
        indexed_details_s: {
            method: req.method,
            route: route,
            client_ip: req.ip,
        },
        indexed_details_n: {
            status_code: responseStatusCode,
            duration: requestDuration,
        },
    });
}
