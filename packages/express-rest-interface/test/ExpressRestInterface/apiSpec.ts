import request from "supertest";

import ExpressRestInterface from "../../src/ExpressRestInterface";
import HttpMethod from "../../src/HttpMethod";
import { jsonResponse } from "../../src/openapiUtils";
import Route from "../../src/Route";
import {
    makeMockAuthService,
    makeMockConfiguration,
    makeMockLogger,
    makeMockSwissknifeRequestService,
} from "../utils";

describe("/api-spec.json", () => {
    it("serves the correctly generated OpenAPI V3 spec document without internal api", async () => {
        // Setup SUT
        const routes: Route[] = [
            {
                method: HttpMethod.Get,
                path: "/basic",
                operationObject: {},
                requiresAuthentication: false,
                handler: () => {},
            },
            {
                method: HttpMethod.Get,
                path: "/unauthenticated/:pathParam/suffix",
                operationObject: {
                    description: "description",
                    parameters: [
                        {
                            name: "pathParam",
                            in: "path",
                            required: true,
                            schema: { type: "string" },
                        },
                    ],
                    responses: { "200": { description: "200" } },
                },
                requiresAuthentication: false,
                handler: () => {},
            },
            {
                method: HttpMethod.Get,
                path: "/authenticated/:pathParam/suffix",
                operationObject: {
                    description: "description",
                    parameters: [
                        {
                            name: "pathParam",
                            in: "path",
                            required: true,
                            schema: { type: "string" },
                        },
                    ],
                    responses: { "200": { description: "200" } },
                },
                requiresAuthentication: true,
                handler: () => {},
            },
            {
                method: HttpMethod.Get,
                path: "/referencingSharedSchema",
                operationObject: {
                    description: "description",
                    responses: {
                        "200": jsonResponse("response", {
                            $ref: "#/components/schemas/Shared",
                        }),
                    },
                },
                requiresAuthentication: false,
                handler: () => {},
            },
            {
                method: HttpMethod.Get,
                path: "/notExposedApi",
                operationObject: {},
                requiresAuthentication: false,
                internal: true,
                handler: () => {},
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
            .get("/api-spec.json")
            .expect({
                openapi: "3.0.3",
                info: { title: "name", version: "version" },
                servers: [{ url: "http://localhost" }],
                paths: {
                    "/basic": {
                        get: {
                            parameters: [
                                { $ref: "#/components/parameters/userAgent" },
                                { $ref: "#/components/parameters/appName" },
                                { $ref: "#/components/parameters/appVersion" },
                                { $ref: "#/components/parameters/requestId" },
                                {
                                    $ref: "#/components/parameters/correlationId",
                                },
                            ],
                            responses: {
                                "400": { $ref: "#/components/responses/400" },
                            },
                        },
                    },
                    "/unauthenticated/{pathParam}/suffix": {
                        get: {
                            description: "description",
                            parameters: [
                                {
                                    name: "pathParam",
                                    in: "path",
                                    required: true,
                                    schema: { type: "string" },
                                },
                                { $ref: "#/components/parameters/userAgent" },
                                { $ref: "#/components/parameters/appName" },
                                { $ref: "#/components/parameters/appVersion" },
                                { $ref: "#/components/parameters/requestId" },
                                {
                                    $ref: "#/components/parameters/correlationId",
                                },
                            ],
                            responses: {
                                "200": { description: "200" },
                                "400": { $ref: "#/components/responses/400" },
                            },
                        },
                    },
                    "/authenticated/{pathParam}/suffix": {
                        get: {
                            description: "description",
                            parameters: [
                                {
                                    name: "pathParam",
                                    in: "path",
                                    required: true,
                                    schema: { type: "string" },
                                },
                                { $ref: "#/components/parameters/userAgent" },
                                { $ref: "#/components/parameters/appName" },
                                { $ref: "#/components/parameters/appVersion" },
                                { $ref: "#/components/parameters/requestId" },
                                {
                                    $ref: "#/components/parameters/correlationId",
                                },
                            ],
                            responses: {
                                "200": { description: "200" },
                                "400": { $ref: "#/components/responses/400" },
                                "401": { $ref: "#/components/responses/401" },
                                "403": { $ref: "#/components/responses/403" },
                            },
                            security: [{ BearerAuth: [] }],
                        },
                    },
                    "/referencingSharedSchema": {
                        get: {
                            description: "description",
                            responses: {
                                "200": {
                                    description: "response",
                                    content: {
                                        "application/json": {
                                            schema: {
                                                $ref: "#/components/schemas/Shared",
                                            },
                                        },
                                    },
                                },
                                "400": { $ref: "#/components/responses/400" },
                            },
                            parameters: [
                                { $ref: "#/components/parameters/userAgent" },
                                { $ref: "#/components/parameters/appName" },
                                { $ref: "#/components/parameters/appVersion" },
                                { $ref: "#/components/parameters/requestId" },
                                {
                                    $ref: "#/components/parameters/correlationId",
                                },
                            ],
                        },
                    },
                },
                components: {
                    schemas: {
                        Shared: { type: "object" },
                        Error: {
                            type: "object",
                            properties: {
                                code: { type: "integer" },
                                status: { type: "string" },
                                message: { type: "string" },
                                details: { type: "object" },
                            },
                            required: ["code", "status", "message"],
                            additionalProperties: false,
                        },
                    },
                    parameters: {
                        userAgent: {
                            name: "user-agent",
                            in: "header",
                            required: true,
                            schema: { type: "string" },
                        },
                        appName: {
                            name: "x-app-name",
                            in: "header",
                            required: true,
                            schema: { type: "string" },
                        },
                        appVersion: {
                            name: "x-app-version",
                            in: "header",
                            required: true,
                            schema: { type: "string" },
                        },
                        requestId: {
                            name: "x-request-id",
                            in: "header",
                            required: false,
                            schema: { type: "string" },
                        },
                        correlationId: {
                            name: "x-correlation-id",
                            in: "header",
                            required: false,
                            schema: { type: "string" },
                        },
                    },
                    responses: {
                        "400": {
                            description: "Bad request",
                            content: {
                                "application/json": {
                                    schema: {
                                        $ref: "#/components/schemas/Error",
                                    },
                                },
                            },
                        },
                        "401": {
                            description: "Unauthenticated request",
                            content: {
                                "application/json": {
                                    schema: {
                                        $ref: "#/components/schemas/Error",
                                    },
                                },
                            },
                        },
                        "403": {
                            description: "Unauthorized request",
                            content: {
                                "application/json": {
                                    schema: {
                                        $ref: "#/components/schemas/Error",
                                    },
                                },
                            },
                        },
                    },
                    securitySchemes: {
                        BearerAuth: { type: "http", scheme: "bearer" },
                    },
                },
            });
    });
});
