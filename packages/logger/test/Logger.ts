import { MissingRequest } from "@swissknife-api-components-nodejs/requests";
import { expect } from "chai";
import sinon from "sinon";
import { Writable } from "stream";

import LogLevel from "../src/LogLevel";
import Logger from "../src/Logger";

function makeMockSwissknifeRequestService() {
    return { get: sinon.stub().returns({}) };
}

describe("Logger", () => {
    describe("logging methods", () => {
        let clock: sinon.SinonFakeTimers;
        before(() => {
            clock = sinon.useFakeTimers();
        });
        after(() => {
            clock.restore();
        });

        it("don't write anything to the outStream when the outStream is null", () => {
            // Setup mocks
            const mockSwissknifeRequestService =
                makeMockSwissknifeRequestService();

            // Setup SUT
            const logger = new Logger(
                mockSwissknifeRequestService as any,
                { app_name: "app_name", app_version: "app_version" },
                LogLevel.Info,
                null,
            );

            // Exercise
            logger.info({ message: "message" });

            // Verify
            // The fact that the above call doesn't throw an NPE means that
            // outStream.write was not called, verifying the test
        });

        describe("don't write anything to the outStream when the level of the log is lower than the level of the logger", () => {
            it("case: logger level Info, log level Debug", () => {
                // Setup mocks
                const mockSwissknifeRequestService =
                    makeMockSwissknifeRequestService();
                const mockOutStream = new Writable();
                sinon.stub(mockOutStream, "write");

                // Setup SUT
                const logger = new Logger(
                    mockSwissknifeRequestService as any,
                    { app_name: "app_name", app_version: "app_version" },
                    LogLevel.Info,
                    mockOutStream,
                );

                // Exercise
                logger.debug({ message: "message" });

                // Verify
                expect(mockOutStream.write).to.have.callCount(0);
            });
        });

        describe("write something to the outStream when the level of the log is equal or higher than the level of the logger", () => {
            it("case: logger level Info, log level Info", () => {
                // Setup mocks
                const mockSwissknifeRequestService =
                    makeMockSwissknifeRequestService();
                const mockOutStream = new Writable();
                sinon.stub(mockOutStream, "write");

                // Setup SUT
                const logger = new Logger(
                    mockSwissknifeRequestService as any,
                    { app_name: "app_name", app_version: "app_version" },
                    LogLevel.Info,
                    mockOutStream,
                );

                // Exercise
                logger.info({ message: "message" });

                // Verify
                expect(mockOutStream.write).to.have.callCount(1);
            });

            it("case: logger level Info, log level Warn", () => {
                // Setup mocks
                const mockSwissknifeRequestService =
                    makeMockSwissknifeRequestService();
                const mockOutStream = new Writable();
                sinon.stub(mockOutStream, "write");

                // Setup SUT
                const logger = new Logger(
                    mockSwissknifeRequestService as any,
                    { app_name: "app_name", app_version: "app_version" },
                    LogLevel.Info,
                    mockOutStream,
                );

                // Exercise
                logger.warn({ message: "message" });

                // Verify
                expect(mockOutStream.write).to.have.callCount(1);
            });
        });

        describe("construct the log and write its JSON-stringification to the outStream", () => {
            it("case: with authenticated swissknifeRequest", () => {
                // Setup mocks
                const mockUserId = "mockUserId";
                const mockSwissknifeRequestService =
                    makeMockSwissknifeRequestService();
                mockSwissknifeRequestService.get.returns({
                    user: { id: mockUserId },
                });
                const mockOutStream = new Writable();
                sinon.stub(mockOutStream, "write");

                // Setup SUT
                const logger = new Logger(
                    mockSwissknifeRequestService as any,
                    { app_name: "app_name", app_version: "app_version" },
                    LogLevel.Info,
                    mockOutStream,
                );

                // Exercise
                logger.info({
                    message: "message",
                    details: { key: "value" },
                    indexed_details_s: { key: "value" },
                    indexed_details_n: { key: 0 },
                });

                // Verify
                expect(mockOutStream.write).to.have.callCount(1);
                const logString = (mockOutStream.write as sinon.SinonStub)
                    .firstCall.args[0];
                const log = JSON.parse(logString);
                expect(log).to.deep.equal({
                    app_name: "app_name",
                    app_version: "app_version",
                    context: { user_id: mockUserId },
                    level: "INFO",
                    message: "message",
                    iso_timestamp: "1970-01-01T00:00:00.000Z",
                    details: { key: "value" },
                    indexed_details_s: { key: "value" },
                    indexed_details_n: { key: 0 },
                });
            });

            it("case: with anonymous swissknifeRequest", () => {
                // Setup mocks
                const mockSwissknifeRequestService =
                    makeMockSwissknifeRequestService();
                mockSwissknifeRequestService.get.returns({ user: null });
                const mockOutStream = new Writable();
                sinon.stub(mockOutStream, "write");

                // Setup SUT
                const logger = new Logger(
                    mockSwissknifeRequestService as any,
                    { app_name: "app_name", app_version: "app_version" },
                    LogLevel.Info,
                    mockOutStream,
                );

                // Exercise
                logger.info({
                    message: "message",
                    details: { key: "value" },
                    indexed_details_s: { key: "value" },
                    indexed_details_n: { key: 0 },
                });

                // Verify
                expect(mockOutStream.write).to.have.callCount(1);
                const logString = (mockOutStream.write as sinon.SinonStub)
                    .firstCall.args[0];
                const log = JSON.parse(logString);
                expect(log).to.deep.equal({
                    app_name: "app_name",
                    app_version: "app_version",
                    context: {
                        user_id: "anonymous",
                    },
                    level: "INFO",
                    message: "message",
                    iso_timestamp: "1970-01-01T00:00:00.000Z",
                    details: { key: "value" },
                    indexed_details_s: { key: "value" },
                    indexed_details_n: { key: 0 },
                });
            });

            it("case: without swissknifeRequest", () => {
                // Setup mocks
                const mockSwissknifeRequestService =
                    makeMockSwissknifeRequestService();
                mockSwissknifeRequestService.get.throws(new MissingRequest());
                const mockOutStream = new Writable();
                sinon.stub(mockOutStream, "write");

                // Setup SUT
                const logger = new Logger(
                    mockSwissknifeRequestService as any,
                    { app_name: "app_name", app_version: "app_version" },
                    LogLevel.Info,
                    mockOutStream,
                );

                // Exercise
                logger.info({
                    message: "message",
                    details: { key: "value" },
                    indexed_details_s: { key: "value" },
                    indexed_details_n: { key: 0 },
                });

                // Verify
                expect(mockOutStream.write).to.have.callCount(1);
                const logString = (mockOutStream.write as sinon.SinonStub)
                    .firstCall.args[0];
                const log = JSON.parse(logString);
                expect(log).to.deep.equal({
                    app_name: "app_name",
                    app_version: "app_version",
                    context: {},
                    level: "INFO",
                    message: "message",
                    iso_timestamp: "1970-01-01T00:00:00.000Z",
                    details: { key: "value" },
                    indexed_details_s: { key: "value" },
                    indexed_details_n: { key: 0 },
                });
            });
        });

        it("ends each log with a newline character", () => {
            // Setup mocks
            const mockSwissknifeRequestService =
                makeMockSwissknifeRequestService();
            const mockOutStream = new Writable();
            sinon.stub(mockOutStream, "write");

            // Setup SUT
            const logger = new Logger(
                mockSwissknifeRequestService as any,
                { app_name: "app_name", app_version: "app_version" },
                LogLevel.Info,
                mockOutStream,
            );

            // Exercise
            logger.info({ message: "message" });

            // Verify
            expect(mockOutStream.write).to.have.callCount(1);
            const logString = (mockOutStream.write as sinon.SinonStub).firstCall
                .args[0];
            expect(logString).to.match(/\n$/);
        });
    });
});
