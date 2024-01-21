import { expect } from "chai";
import { map } from "lodash";

import HttpMethod from "../../src/HttpMethod";
import Route from "../../src/Route";
import sortByRegistrationPriority from "../../src/utils/sortByRegistrationPriority";

describe("sortByRegistrationPriority util", () => {
    it("sorts routes by registrationPriority, assigning 0 to routes without a defined registrationPriority", () => {
        // Exercise
        const routes: Route[] = [
            {
                method: HttpMethod.Get,
                path: "/",
                operationObject: {},
                requiresAuthentication: false,
                handler: () => {},
            },
            {
                method: HttpMethod.Get,
                registrationPriority: 2,
                path: "/2",
                operationObject: {},
                requiresAuthentication: false,
                handler: () => {},
            },
            {
                method: HttpMethod.Get,
                registrationPriority: 1,
                path: "/1",
                operationObject: {},
                requiresAuthentication: false,
                handler: () => {},
            },
        ];
        const sortedRoutes = sortByRegistrationPriority(routes);

        // Verify
        expect(map(sortedRoutes, "path")).to.deep.equal(["/2", "/1", "/"]);
    });
});
