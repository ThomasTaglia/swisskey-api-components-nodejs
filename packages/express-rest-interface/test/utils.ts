import { AuthService } from "@swissknife-api-components-nodejs/auth-service";
import { Request } from "@swissknife-api-components-nodejs/requests";
import sinon, { SinonStub } from "sinon";

export function makeMockAuthService(requestMethod: SinonStub = sinon.stub()) {
    return new AuthService({ request: requestMethod } as any);
}

export function makeMockLogger() {
    return {
        trace: sinon.stub(),
        debug: sinon.stub(),
        info: sinon.stub(),
        warn: sinon.stub(),
        error: sinon.stub(),
        fatal: sinon.stub(),
    };
}

export function makeMockConfiguration() {
    return {
        port: 8080,
        validateResponses: true,
        corsAllowedOrigins: [],
        serviceInfo: {
            publicUrl: "http://localhost",
            name: "name",
            version: "version",
            commit: "commit",
        },
        schemas: {
            Shared: { type: "object" },
        },
    };
}

export function makeMockSwissknifeRequestService() {
    let _sRequest: Request;
    return {
        set: sinon.spy((req) => (_sRequest = req)),
        get: sinon.spy(() => _sRequest),
    };
}
