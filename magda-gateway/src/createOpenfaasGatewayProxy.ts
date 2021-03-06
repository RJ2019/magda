import express from "express";
import createBaseProxy from "./createBaseProxy";
import { TenantMode } from "./setupTenantMode";
import Authenticator from "./Authenticator";
import { mustBeAdmin } from "magda-typescript-common/src/authorization-api/authMiddleware";

interface OptionsType {
    gatewayUrl: string;
    baseAuthUrl: string;
    jwtSecret: string;
    authenticator: Authenticator;
    tenantMode: TenantMode;
    allowAdminOnly?: boolean;
}

export default function createOpenfaasGatewayProxy(
    options: OptionsType
): express.Router {
    const router = express.Router();
    const proxy = createBaseProxy(options.tenantMode);

    if (options.allowAdminOnly) {
        options.authenticator.applyToRoute(router);
        router.use(mustBeAdmin(options.baseAuthUrl, options.jwtSecret));
    }

    router.all("*", (req: express.Request, res: express.Response) => {
        proxy.web(req, res, { target: options.gatewayUrl });
    });

    return router;
}
