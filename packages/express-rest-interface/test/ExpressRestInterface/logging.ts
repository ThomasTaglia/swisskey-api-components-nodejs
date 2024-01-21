import { expect } from "chai";
import sinon from "sinon";
import request from "supertest";

import ExpressRestInterface from "../../src/ExpressRestInterface";
import HttpMethod from "../../src/HttpMethod";
import Route from "../../src/Route";
import {
    makeMockAuthService,
    makeMockConfiguration,
    makeMockLogger,
    makeMockSwissknifeRequestService,
} from "../utils";

describe("logging", () => {
    it("completed requests are logged", async () => {
        // Setup mocks
        const mockLogger = makeMockLogger();

        // Setup SUT
        const routes: Route[] = [
            {
                method: HttpMethod.Get,
                path: "/",
                operationObject: {},
                requiresAuthentication: false,
                handler: (_req, res) => {
                    res.status(200).send();
                },
            },
        ];
        const expressRestInterface = new ExpressRestInterface(
            makeMockSwissknifeRequestService(),
            mockLogger as any,
            makeMockConfiguration() as any,
            routes,
            makeMockAuthService(),
        );

        // Exercise
        await request((expressRestInterface as any).makeApp())
            .get("/")
            .set("user-agent", "user-agent")
            .set("x-app-name", "x-app-name")
            .set("x-app-version", "x-app-version")
            .expect(200);

        // Verify
        expect(mockLogger.info).to.have.callCount(1);
        expect(mockLogger.info).to.have.been.calledWithMatch(
            sinon.match({
                message: "INCOMING_REQUEST_FINISHED",
                type: "INCOMING_REQUEST_FINISHED",
                details: sinon.match({
                    client_ip: sinon.match.string,
                    duration: sinon.match.number,
                    method: "GET",
                    request_headers: sinon.match({
                        "user-agent": "user-agent",
                        "x-app-name": "x-app-name",
                        "x-app-version": "x-app-version",
                    }),
                    response_headers: sinon.match({
                        "x-correlation-id": sinon.match.string,
                        "x-request-id": sinon.match.string,
                    }),
                    route: "GET /",
                    status_code: 200,
                    url: "/",
                }),
                indexed_details_n: sinon.match({
                    duration: sinon.match.number,
                    status_code: 200,
                }),
                indexed_details_s: sinon.match({
                    method: "GET",
                    route: "GET /",
                }),
            }),
        );
    });
});
