import { expect } from "chai";
import { sign } from "jsonwebtoken";
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

describe("request", () => {
    it("is correctly set for each http request", async () => {
        // Setup mocks
        const mockAgyoRequestService = makeMockSwissknifeRequestService();

        // Setup SUT
        const routes: Route[] = [
            {
                method: HttpMethod.Get,
                path: "/",
                operationObject: {},
                requiresAuthentication: true,
                handler: (_req, res) => {
                    res.status(200).send();
                },
            },
        ];
        const expressRestInterface = new ExpressRestInterface(
            mockAgyoRequestService,
            makeMockLogger() as any,
            makeMockConfiguration() as any,
            routes,
            makeMockAuthService(),
        );

        // Exercise
        const sub = "email@example.com";
        const uid = "uid";
        const accessToken = sign({ sub, uid }, "secret");
        const appName = "appName";
        const appVersion = "appVersion";
        const requestId = "requestId";
        const correlationId = "correlationId";
        const locale = "en-US";

        await request((expressRestInterface as any).makeApp())
            .get("/")
            .set("authorization", `Bearer ${accessToken}`)
            .set("user-agent", "user-agent")
            .set("accept-language", locale)
            .set("x-app-name", appName)
            .set("x-app-version", appVersion)
            .set("x-request-id", requestId)
            .set("x-correlation-id", correlationId)
            .expect(200);

        // Verify
        expect(mockAgyoRequestService.get()).to.deep.equal({
            accessToken: accessToken,
            user: {
                id: uid,
                email: sub,
            },
            locale: locale,
            requestId: requestId,
            correlationId: correlationId,
            appName: appName,
            appVersion: appVersion,
        });
    });
});
