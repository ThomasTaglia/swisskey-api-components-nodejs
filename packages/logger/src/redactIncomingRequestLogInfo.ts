import { cloneDeep } from "lodash";
import qs from "qs";

import IncomingRequestLogInfo from "./IncomingRequestLogInfo";

const REDACTED = "REDACTED";
// Note: the headers names must be lowercase
const ORIGINAL_URI_HEADER = "x-original-uri";
const REFERER_HEADER = "referer";

/**
 * Redacts sensitive information from incoming http request log info
 * objects
 */
export default function redactIncomingRequestLogInfo(
    originalLogInfo: IncomingRequestLogInfo,
): IncomingRequestLogInfo {
    // Clone the object to avoid modification to the request or
    // response objects during redaction
    const logInfo = cloneDeep(originalLogInfo);

    // Redact Authorization header
    if (logInfo?.details?.request_headers?.authorization) {
        logInfo.details.request_headers.authorization = REDACTED;
    }

    // Redact access_token querystring parameter:
    // - from the logInfo.details.request_query object
    if (logInfo?.details?.request_query?.access_token) {
        logInfo.details.request_query.access_token = REDACTED;
    }
    // - from incomingRequestLogInfo.details.url
    logInfo.details.url = redactUrl(logInfo.details.url);

    // - from the x-original-uri request header
    const originalUri =
        logInfo?.details?.request_headers?.[ORIGINAL_URI_HEADER];
    if (originalUri) {
        logInfo.details.request_headers[ORIGINAL_URI_HEADER] = Array.isArray(
            originalUri,
        )
            ? originalUri.map(redactUrl)
            : redactUrl(originalUri);
    }
    // - from the referer request header
    const referer = logInfo?.details?.request_headers?.[REFERER_HEADER];
    if (referer) {
        logInfo.details.request_headers[REFERER_HEADER] = redactUrl(referer);
    }

    return logInfo;
}

// Redacts the access_token querystring parameter of a url string (if present)
function redactUrl(url: string): string {
    const [pathname, querystring] = url.split("?") as [string, string];
    const parsedQuerystring = qs.parse(querystring);
    if (parsedQuerystring["access_token"]) {
        parsedQuerystring["access_token"] = REDACTED;
    }
    return querystring
        ? `${pathname}?${qs.stringify(parsedQuerystring)}`
        : pathname;
}
