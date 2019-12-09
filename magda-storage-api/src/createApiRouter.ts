import { ApiError } from "@google-cloud/common";
import { installStatusRouter } from "@magda/typescript-common/dist/express/status";
import * as express from "express";
import { OutgoingHttpHeaders } from "http";
import ObjectStoreClient from "./ObjectStoreClient";
import * as bodyParser from "body-parser";

export interface ApiRouterOptions {
    objectStoreClient: ObjectStoreClient;
}

export default function createApiRouter(options: ApiRouterOptions) {
    const router: express.Router = express.Router();

    const status = {
        probes: {
            objectStore: options.objectStoreClient.statusProbe
        }
    };
    installStatusRouter(router, status);

    router.use(bodyParser.json({ type: "*/json" }));
    router.use(bodyParser.text({ type: "text/*" }));
    router.use(
        bodyParser.raw({ type: ["image/*", "application/octet-stream"] })
    );

    // Download an object
    router.get("/:fileid", async function(req, res) {
        const fileId = req.params.fileid;
        const encodedRootPath = encodeURIComponent(fileId);

        const object = options.objectStoreClient.getFile(encodedRootPath);

        let headers: OutgoingHttpHeaders;
        try {
            headers = await object.headers();
            Object.keys(headers).forEach(header => {
                const value = headers[header];
                if (value !== undefined) {
                    res.setHeader(header, value);
                }
            });
        } catch (err) {
            if (err instanceof ApiError) {
                if (err.code === 404) {
                    return res
                        .status(404)
                        .send("No such object with fileId " + fileId);
                }
            }
            return res.status(500).send("Unknown error");
        }

        const streamP = object.createStream();
        if (streamP) {
            streamP.then(stream => {
                stream.on("error", _e => {
                    res.status(500).send("Unknown error");
                });
                stream.pipe(res);
            });
        }
    });

    // Upload an object
    router.put("/:fileid", async function(req, res) {
        const fileId = req.params.fileid;
        const encodedRootPath = encodeURIComponent(fileId);
        const content = req.body;
        const metaData = {
            "Content-Type": req.headers["content-type"],
            "Content-Length": req.headers["content-length"]
        };
        return options.objectStoreClient
            .putFile(encodedRootPath, content, metaData)
            .then(etag => {
                return res.status(200).send({
                    message: "File uploaded successfully",
                    etag: etag
                });
            })
            .catch((err: Error) => {
                console.error(err);
                // Sending 500 for everything for the moment
                return res.status(500).send({
                    message:
                        "Encountered error while uploading file." +
                        "This has been logged and we are looking into this."
                });
            });
    });

    return router;
}
