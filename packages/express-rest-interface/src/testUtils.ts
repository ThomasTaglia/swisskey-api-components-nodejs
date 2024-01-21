import bodyParser from "body-parser";
import express from "express";
import { middleware as openapiValidator } from "express-openapi-validator";
import { OpenAPIV3 } from "express-openapi-validator/dist/framework/types";

import makeApiSpec from "./makeApiSpec";
import errorHandler from "./middleware/errorHandler";
import routeErrorHandler from "./middleware/routeErrorHandler";
import Route from "./Route";
import forwardThrownRequestHandlerErrors from "./utils/forwardThrownRequestHandlerErrors";

export function getTestApp(
    route: Route,
    schemas?: OpenAPIV3.ComponentsObject["schemas"],
): express.Application {
    const apiSpec = makeApiSpec(
        "name",
        "version",
        "publicUrl",
        [route],
        schemas,
        route.includeCommonParameters ?? false,
    );

    const app = express();

    app.use(bodyParser.json());
    app.use(
        openapiValidator({
            apiSpec: apiSpec,
            validateSecurity: false,
            validateResponses: true,
        }),
    );

    app[route.method](
        route.path,
        forwardThrownRequestHandlerErrors(route.handler),
        routeErrorHandler(route.errorConverter),
    );

    app.use(
        errorHandler({
            error: (log: any) => console.error(JSON.stringify(log, null, 4)),
        } as any),
    );

    return app;
}
