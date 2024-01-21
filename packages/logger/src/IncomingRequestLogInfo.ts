import { IncomingHttpHeaders, OutgoingHttpHeaders } from "http";

import UserSuppliedLogInfo from "./UserSuppliedLogInfo";

/**
 * Interface describing the log information supplied when logging incoming http
 * requests
 */
export default interface IncomingRequestLogInfo extends UserSuppliedLogInfo {
    details: {
        /** HTTP method of the request */
        method: string;
        /** Full url of the request (e.g. /users/0?q=true) */
        url: string;
        /** Route of the request (e.g. GET /users/:userId) */
        route: string | undefined;
        /** Parsed querystring of the request */
        request_query?: any;
        /** Headers of the request */
        request_headers: IncomingHttpHeaders;
        /** IP address of the client that initiated the request */
        client_ip: string | undefined;
        /** Status code of the response (if available) */
        status_code?: number;
        /** Headers of the response (if available) */
        response_headers?: OutgoingHttpHeaders;
        /** Duration of the request in milliseconds (if available) */
        duration?: number;
        /** Body of the request or response (if available) */
        payload?: string;
    };
    indexed_details_s: {
        method: string;
        route: string | undefined;
        client_ip: string | undefined;
    };
    indexed_details_n: {
        status_code?: number;
        duration?: number;
    };
}
