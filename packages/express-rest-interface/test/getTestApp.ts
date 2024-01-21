import request from "supertest";

import HttpMethod from "../src/HttpMethod";
import { getTestApp } from "../src/testUtils";

describe("getTestApp test util", () => {
    it("allows testing a single route, skipping authentication and logging headers validation", async () => {
        // Setup SUT
        const testApp = getTestApp({
            method: HttpMethod.Get,
            path: "/",
            operationObject: {},
            requiresAuthentication: true,
            handler: (_req, res) => {
                res.status(200).send();
            },
        });

        // Exercise + verify
        await request(testApp).get("/").expect(200);
    });
});
