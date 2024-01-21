import { expect } from "chai";
import { merge } from "lodash";

import IncomingRequestLogInfo from "../src/IncomingRequestLogInfo";
import redactRequestLogInfo from "../src/redactIncomingRequestLogInfo";

function getIncomingRequestLogInfo(partial: any): IncomingRequestLogInfo {
    return merge(
        {
            message: "message",
            details: {
                method: "get",
                url: "/",
                route: "/",
                request_query: {},
                request_headers: {},
                client_ip: "0.0.0.0",
                status_code: 200,
                response_headers: {},
                duration: 100,
            },
            indexed_details_s: {
                method: "get",
                route: "/",
                client_ip: "0.0.0.0",
            },
            indexed_details_n: {},
        },
        partial,
    );
}

describe("redactIncomingRequestLogInfo", () => {
    it("redacts the access token from the url querystring", () => {
        const redactedLogInfo = redactRequestLogInfo(
            getIncomingRequestLogInfo({
                details: {
                    url: "/?access_token=access_token",
                },
            }),
        );
        expect(redactedLogInfo.details.url).to.equal("/?access_token=REDACTED");
    });

    it("redacts the access token from the request_query object", () => {
        const redactedLogInfo = redactRequestLogInfo(
            getIncomingRequestLogInfo({
                details: {
                    request_query: {
                        access_token: "access_token",
                    },
                },
            }),
        );
        expect(redactedLogInfo.details.request_query).to.have.property(
            "access_token",
            "REDACTED",
        );
    });

    it("redacts the access token from the authorization header", () => {
        const redactedLogInfo = redactRequestLogInfo(
            getIncomingRequestLogInfo({
                details: {
                    request_headers: {
                        authorization: "access_token",
                    },
                },
            }),
        );
        expect(redactedLogInfo.details.request_headers).to.have.property(
            "authorization",
            "REDACTED",
        );
    });

    it("redacts the access token from the x-original-uri header", () => {
        const redactedLogInfo = redactRequestLogInfo(
            getIncomingRequestLogInfo({
                details: {
                    request_headers: {
                        "x-original-uri": "/?access_token=access_token",
                    },
                },
            }),
        );
        expect(redactedLogInfo.details.request_headers).to.have.property(
            "x-original-uri",
            "/?access_token=REDACTED",
        );
    });

    it("redacts the access token from the referer header", () => {
        const redactedLogInfo = redactRequestLogInfo(
            getIncomingRequestLogInfo({
                details: {
                    request_headers: {
                        referer: "/?access_token=access_token",
                    },
                },
            }),
        );
        expect(redactedLogInfo.details.request_headers).to.have.property(
            "referer",
            "/?access_token=REDACTED",
        );
    });
});
