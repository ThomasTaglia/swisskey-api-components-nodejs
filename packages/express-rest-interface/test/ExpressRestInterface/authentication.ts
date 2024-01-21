import { Request } from "@swissknife-api-components-nodejs/requests";
import { expect } from "chai";
import { sign } from "jsonwebtoken";
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

describe("authentication", () => {
    describe("unauthenticated routes", () => {
        it("no 401 on missing authorization header", async () => {
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
            await request((expressRestInterface as any).makeApp())
                .get("/")
                .set("user-agent", "user-agent")
                .set("x-app-name", "x-app-name")
                .set("x-app-version", "x-app-version")
                .expect(200);
        });

        it("accessToken and user are null in the request", async () => {
            // Setup SUT
            let swissknifeRequest: Request;
            const requestService = makeMockSwissknifeRequestService();
            const routes: Route[] = [
                {
                    method: HttpMethod.Get,
                    path: "/",
                    operationObject: {},
                    requiresAuthentication: false,
                    handler: (_req, res) => {
                        swissknifeRequest = requestService.get();
                        res.status(200).send();
                    },
                },
            ];
            const expressRestInterface = new ExpressRestInterface(
                requestService,
                makeMockLogger() as any,
                makeMockConfiguration() as any,
                routes,
                makeMockAuthService(),
            );

            // Exercise
            const sub = "sub";
            const uid = "uid";
            const accessToken = sign({ sub, uid }, "secret");
            await request((expressRestInterface as any).makeApp())
                .get("/")
                .set("authorization", `Bearer ${accessToken}`)
                .set("user-agent", "user-agent")
                .set("x-app-name", "x-app-name")
                .set("x-app-version", "x-app-version")
                .expect(200);

            // Verify
            expect(swissknifeRequest!).to.have.property("accessToken", null);
            expect(swissknifeRequest!).to.have.deep.property("user", null);
        });
    });

    describe("authenticated routes", () => {
        it("401 on missing authorization header", async () => {
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
                .expect(401)
                .expect({
                    code: 401,
                    status: "Unauthorized",
                    message: "MissingAccessToken",
                });
        });

        it("401 on malformed authorization header", async () => {
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
                makeMockSwissknifeRequestService(),
                makeMockLogger() as any,
                makeMockConfiguration() as any,
                routes,
                makeMockAuthService(),
            );

            // Exercise + verify
            await request((expressRestInterface as any).makeApp())
                .get("/")
                .set("authorization", "malformed")
                .set("user-agent", "user-agent")
                .set("x-app-name", "x-app-name")
                .set("x-app-version", "x-app-version")
                .expect(401)
                .expect({
                    code: 401,
                    status: "Unauthorized",
                    message: "InvalidAuthorizationHeader",
                });
        });

        it("401 on invalid access token", async () => {
            // Setup mocks
            const mockAuthServiceAxiosClient = makeMockAuthService(
                sinon.stub().rejects(),
            );

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
                makeMockSwissknifeRequestService(),
                makeMockLogger() as any,
                makeMockConfiguration() as any,
                routes,
                mockAuthServiceAxiosClient as any,
            );

            // Exercise + verify
            await request((expressRestInterface as any).makeApp())
                .get("/")
                .set("authorization", "Bearer accessToken")
                .set("user-agent", "user-agent")
                .set("x-app-name", "x-app-name")
                .set("x-app-version", "x-app-version")
                .expect(401)
                .expect({
                    code: 401,
                    status: "Unauthorized",
                    message: "InvalidAccessToken",
                });
        });

        it("401 on malformed access token", async () => {
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
                makeMockSwissknifeRequestService(),
                makeMockLogger() as any,
                makeMockConfiguration() as any,
                routes,
                makeMockAuthService(),
            );

            // Exercise + verify
            await request((expressRestInterface as any).makeApp())
                .get("/")
                .set("authorization", "Bearer accessToken")
                .set("user-agent", "user-agent")
                .set("x-app-name", "x-app-name")
                .set("x-app-version", "x-app-version")
                .expect(401)
                .expect({
                    code: 401,
                    status: "Unauthorized",
                    message: "InvalidAccessToken",
                });
        });

        it("no 401 on valid, well-formed access token", async () => {
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
                makeMockSwissknifeRequestService(),
                makeMockLogger() as any,
                makeMockConfiguration() as any,
                routes,
                makeMockAuthService(),
            );

            // Exercise + verify
            const accessToken = sign({ sub: "sub", uid: "uid" }, "secret");
            await request((expressRestInterface as any).makeApp())
                .get("/")
                .set("authorization", `Bearer ${accessToken}`)
                .set("user-agent", "user-agent")
                .set("x-app-name", "x-app-name")
                .set("x-app-version", "x-app-version")
                .expect(200);
        });

        it("accessToken and user are made available in the request", async () => {
            // Setup SUT
            let swissknifeRequest: Request;
            const requestService = makeMockSwissknifeRequestService();
            const routes: Route[] = [
                {
                    method: HttpMethod.Get,
                    path: "/",
                    operationObject: {},
                    requiresAuthentication: true,
                    handler: (_req, res) => {
                        swissknifeRequest = requestService.get();
                        res.status(200).send();
                    },
                },
            ];
            const expressRestInterface = new ExpressRestInterface(
                requestService,
                makeMockLogger() as any,
                makeMockConfiguration() as any,
                routes,
                makeMockAuthService(),
            );

            // Exercise
            const sub = "email@example.com";
            const uid = "uid";
            const accessToken = sign({ sub, uid }, "secret");
            await request((expressRestInterface as any).makeApp())
                .get("/")
                .set("authorization", `Bearer ${accessToken}`)
                .set("user-agent", "user-agent")
                .set("x-app-name", "x-app-name")
                .set("x-app-version", "x-app-version")
                .expect(200);

            // Verify
            expect(swissknifeRequest!).to.have.property(
                "accessToken",
                accessToken,
            );
            expect(swissknifeRequest!).to.have.deep.property("user", {
                id: uid,
                email: sub,
            });
        });
    });

    describe("authenticated and internal routes", () => {
        it("401 on missing authorization header", async () => {
            // Setup SUT
            const routes: Route[] = [
                {
                    method: HttpMethod.Get,
                    path: "/internal",
                    operationObject: {},
                    requiresAuthentication: true,
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

            // Exercise + verify internal api is protected
            await request((expressRestInterface as any).makeApp())
                .get("/internal")
                .set("user-agent", "user-agent")
                .set("x-app-name", "x-app-name")
                .set("x-app-version", "x-app-version")
                .expect(401)
                .expect({
                    code: 401,
                    status: "Unauthorized",
                    message: "MissingAccessToken",
                });
        });
    });
});
