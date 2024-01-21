import { expect } from "chai";
import { EventEmitter } from "events";
import sinon from "sinon";

import ApplicationRunner from "../src/ApplicationRunner";

describe("ApplicationRunner", () => {
    it("registers handlers for uncaught exceptions / unhandled rejections", () => {
        // Setup mocks
        const mockLogger = {
            error: sinon.stub(),
        };
        const mockProcess = new EventEmitter();

        // Setup SUT
        const applicationRunner = new ApplicationRunner(
            mockLogger as any,
            [],
            mockProcess as any,
        );

        // Exercise
        applicationRunner.run();
        mockProcess.emit("uncaughtException", new Error("uncaughtException"));
        mockProcess.emit("unhandledRejection", new Error("unhandledRejection"));

        // Verify
        expect(mockLogger.error).to.have.been.calledWithMatch(
            sinon.match({
                details: sinon.match({
                    code: undefined,
                    message: "uncaughtException",
                    name: "Error",
                    signal: undefined,
                    stack: sinon.match.string,
                }),
                message: "Process uncaught exception",
                type: "APPLICATION_ERROR",
            }),
        );
        expect(mockLogger.error).to.have.been.calledWith(
            sinon.match({
                details: sinon.match({
                    code: undefined,
                    message: "unhandledRejection",
                    name: "Error",
                    signal: undefined,
                    stack: sinon.match.string,
                }),
                message: "Process unhandled rejection",
                type: "APPLICATION_ERROR",
            }),
        );
    });

    it("starts all runnables in the order they were passed-in", async () => {
        // Setup mocks
        const mockLogger = {
            info: sinon.stub(),
        };
        const mockProcess = new EventEmitter();
        const mockRunnable0 = { start: sinon.stub(), stop: sinon.stub() };
        const mockRunnable1 = { start: sinon.stub(), stop: sinon.stub() };

        // Setup SUT
        const applicationRunner = new ApplicationRunner(
            mockLogger as any,
            [mockRunnable0, mockRunnable1],
            mockProcess as any,
        );

        // Exercise
        await applicationRunner.run();

        // Verify
        expect(mockRunnable0.start).to.have.callCount(1);
        expect(mockRunnable1.start).to.have.callCount(1);
        expect(mockRunnable0.start).to.have.calledBefore(mockRunnable1.start);
    });

    it("on SIGTERM/SIGINT/SIGQUIT, stops all runnables in the reverse order they were passed-in", async () => {
        // Setup mocks
        const mockLogger = {
            info: sinon.stub(),
        };
        let resolveExitPromise: Function;
        const exitPromise = new Promise((resolve) => {
            resolveExitPromise = resolve;
        });
        const mockProcess = new EventEmitter();
        (mockProcess as any).exit = () => {
            resolveExitPromise();
        };
        const mockRunnable0 = { start: sinon.stub(), stop: sinon.stub() };
        const mockRunnable1 = { start: sinon.stub(), stop: sinon.stub() };

        // Setup SUT
        const applicationRunner = new ApplicationRunner(
            mockLogger as any,
            [mockRunnable0, mockRunnable1],
            mockProcess as any,
        );
        await applicationRunner.run();

        // Exercise
        mockProcess.emit("SIGTERM");
        await exitPromise;

        // Verify
        expect(mockRunnable0.stop).to.have.callCount(1);
        expect(mockRunnable1.stop).to.have.callCount(1);
        expect(mockRunnable1.stop).to.have.calledBefore(mockRunnable0.stop);
    });
});
