import { expect } from "chai";
import sinon from "sinon";

import AuthService from "../src/AuthService";
import InvalidAccessToken from "../src/InvalidAccessToken";

describe("AuthService", () => {
    describe("verify", () => {
        it("throws InvalidAccessToken on request error", async () => {
            // Setup mocks
            const mockAuthServiceAxiosClient = {
                request: sinon.stub().rejects(),
            };

            // Setup SUT
            const authClient = new AuthService(
                mockAuthServiceAxiosClient as any,
            );

            // Exercise
            const verifyPromise = authClient.verify("accessToken");

            // Verify
            await expect(verifyPromise).to.be.rejectedWith(InvalidAccessToken);
        });

        it("skips verifyToken if skipVerifyToken is set to true", async () => {
            // Setup mocks
            const mockAuthServiceAxiosClient = {
                request: sinon.stub().resolves(),
            };

            // Setup SUT
            const authClient = new AuthService(
                mockAuthServiceAxiosClient as any,
                undefined,
                true,
            );

            // Exercise
            const accessToken0 = "accessToken0";
            const verifyPromise0 = authClient.verify(accessToken0);
            await expect(verifyPromise0).to.be.fulfilled;

            // Verify
            expect(mockAuthServiceAxiosClient.request).to.have.callCount(0);
        });

        describe("uses a cache for consecutive (not parallel) calls to avoid repeatedly calling the AuthService", () => {
            it("case: verify succeeds", async () => {
                // Setup mocks
                const mockAuthServiceAxiosClient = {
                    request: sinon.stub().resolves(),
                };

                // Setup SUT
                const authClient = new AuthService(
                    mockAuthServiceAxiosClient as any,
                );

                // Exercise
                const accessToken0 = "accessToken0";
                const accessToken1 = "accessToken1";
                const verifyPromise0 = authClient.verify(accessToken0);
                await expect(verifyPromise0).to.be.fulfilled;
                const verifyPromise1 = authClient.verify(accessToken0);
                await expect(verifyPromise1).to.be.fulfilled;
                const verifyPromise2 = authClient.verify(accessToken1);
                await expect(verifyPromise2).to.be.fulfilled;

                // Verify
                expect(mockAuthServiceAxiosClient.request).to.have.callCount(2);
            });

            it("case: verify fails", async () => {
                // Setup mocks
                const mockAuthServiceAxiosClient = {
                    request: sinon.stub().rejects(),
                };

                // Setup SUT
                const authClient = new AuthService(
                    mockAuthServiceAxiosClient as any,
                );

                // Exercise
                const verifyPromise0 = authClient.verify("accessToken");
                await expect(verifyPromise0).to.be.rejected;
                const verifyPromise1 = authClient.verify("accessToken");
                await expect(verifyPromise1).to.be.rejected;

                // Verify
                expect(mockAuthServiceAxiosClient.request).to.have.callCount(1);
            });
        });
    });

    describe("getUser", () => {
        it("returns the AgyoUser corresponding to the supplied TeamSystemID token", async () => {
            // Setup mocks
            const mockIdentifiers = {
                subject: "email@example.com",
                id: "id",
            };
            const mockAuthServiceAxiosClient = {
                request: sinon.stub().resolves({ data: mockIdentifiers }),
            };

            // Setup SUT
            const authClient = new AuthService(
                mockAuthServiceAxiosClient as any,
            );

            // Exercise
            const accessToken = "accessToken";
            const user = await authClient.getUser(accessToken);

            // Verify
            expect(user).to.deep.equal({
                id: mockIdentifiers.id,
                email: mockIdentifiers.subject,
            });
        });

        it("uses a cache for consecutive (not parallel) calls to avoid repeatedly calling the AuthService", async () => {
            // Setup mocks
            const mockAuthServiceAxiosClient = {
                request: sinon.stub().resolves({
                    data: {
                        subject: "email@example.com",
                        id: "id",
                    },
                }),
            };

            // Setup SUT
            const authClient = new AuthService(
                mockAuthServiceAxiosClient as any,
            );

            // Exercise
            const accessToken = "accessToken";
            await authClient.getUser(accessToken);
            await authClient.getUser(accessToken);
            await authClient.getUser(accessToken);

            // Verify
            expect(mockAuthServiceAxiosClient.request).to.have.callCount(1);
        });
    });
});
