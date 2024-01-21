import { expect } from "chai";
import request from "supertest";

import ExpressRestInterface from "../../src/ExpressRestInterface";
import HttpMethod from "../../src/HttpMethod";
import { errorResponse } from "../../src/openapiUtils";
import Route from "../../src/Route";
import {
    makeMockAuthService,
    makeMockConfiguration,
    makeMockLogger,
    makeMockSwissknifeRequestService,
} from "../utils";

describe("error handling", () => {
    describe("express-openapi-validator errors are converted", () => {
        it("case: 400 validation errors", async () => {
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
                makeMockLogger() as any,
                makeMockConfiguration() as any,
                routes,
                makeMockAuthService(),
            );

            // Exercise + verify
            const response = await request(
                (expressRestInterface as any).makeApp(),
            )
                .get("/")
                .expect(400);
            expect(response.body)
                .to.have.property("message")
                .that.matches(/user-agent/);
            expect(response.body).to.have.nested.property("details.errors");
        });
    });

    it("route handler errors are converted according to the route error converter", async () => {
        // Setup mocks
        class MockError extends Error {}

        // Setup SUT
        const routes: Route[] = [
            {
                method: HttpMethod.Get,
                path: "/",
                operationObject: { responses: { "499": errorResponse("499") } },
                requiresAuthentication: false,
                errorConverter: (err) =>
                    err instanceof MockError
                        ? { code: 499, status: "status", message: "MockError" }
                        : null,
                handler: () => {
                    throw new MockError();
                },
            },
        ];
        const expressRestInterface = new ExpressRestInterface(
            makeMockSwissknifeRequestService(),
            makeMockLogger() as any,
            makeMockConfiguration() as any,
            routes,
            makeMockAuthService(),
        );

        // Exercise + verify
        await request((expressRestInterface as any).makeApp())
            .get("/")
            .set("user-agent", "user-agent")
            .set("x-app-name", "x-app-name")
            .set("x-app-version", "x-app-version")
            .expect(499)
            .expect({ code: 499, status: "status", message: "MockError" });
    });

    it("non converted errors become 500 errors", async () => {
        // Setup SUT
        const routes: Route[] = [
            {
                method: HttpMethod.Get,
                path: "/",
                operationObject: {},
                requiresAuthentication: false,
                handler: () => {
                    throw new Error();
                },
            },
        ];
        const expressRestInterface = new ExpressRestInterface(
            makeMockSwissknifeRequestService(),
            makeMockLogger() as any,
            makeMockConfiguration() as any,
            routes,
            makeMockAuthService(),
        );

        // Exercise + verify
        await request((expressRestInterface as any).makeApp())
            .get("/")
            .set("user-agent", "user-agent")
            .set("x-app-name", "x-app-name")
            .set("x-app-version", "x-app-version")
            .expect(500)
            .expect({
                code: 500,
                status: "Internal Server Error",
                message: "Internal server error",
            });
    });

    it("500 errors are logged", async () => {
        // Setup mocks
        const mockLogger = makeMockLogger();

        // Setup SUT
        const error = new Error("message");
        const routes: Route[] = [
            {
                method: HttpMethod.Get,
                path: "/",
                operationObject: {},
                requiresAuthentication: false,
                handler: () => {
                    throw error;
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
            .expect(500);

        // Verify
        expect(mockLogger.error).to.have.been.calledOnceWith({
            type: "APPLICATION_ERROR",
            message: "Unexpected 5xx error in route handler",
            details: {
                error: {
                    code: undefined,
                    message: error.message,
                    name: error.name,
                    signal: undefined,
                    stack: error.stack,
                },
                route: "GET /",
            },
            indexed_details_s: { route: "GET /" },
        });
    });

    describe("express-openapi-validator errors are converted also for internal routes", () => {
        it("case: 400 validation errors", async () => {
            // Setup SUT
            const routes: Route[] = [
                {
                    method: HttpMethod.Get,
                    path: "/",
                    operationObject: {},
                    requiresAuthentication: false,
                    internal: true,
                    handler: (_req, res) => {
                        res.status(200).send();
                    },
                },
            ];
            const expressRestInterface = new ExpressRestInterface(
                makeMockSwissknifeRequestService(),
                makeMockLogger() as any,
                makeMockConfiguration() as any,
                routes,
                makeMockAuthService(),
            );

            // Exercise + verify
            const response = await request(
                (expressRestInterface as any).makeApp(),
            )
                .get("/")
                .expect(400);
            expect(response.body)
                .to.have.property("message")
                .that.matches(/user-agent/);
            expect(response.body).to.have.nested.property("details.errors");
        });
    });
});
