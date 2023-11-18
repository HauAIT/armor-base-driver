/**
 * Options for {@linkcode startServer }.
 */
export type StartServerOpts = {
    /**
     * - HTTP server instance
     */
    httpServer: import('http').Server;
    /**
     * - Port to run on
     */
    port: number;
    /**
     * - Keep-alive timeout in milliseconds
     */
    keepAliveTimeout: number;
    /**
     * - Optional hostname
     */
    hostname?: string | undefined;
};
export type ArmorServer = import('armor-types').ArmorServer;
export type ArmorServerSocket = import('armor-types').ArmorServerSocket;
export type MethodMap = import('armor-types').MethodMap<import('armor-types').ExternalDriver>;
/**
 * Options for {@linkcode configureHttp }
 */
export type ConfigureHttpOpts = {
    /**
     * - HTTP server instance
     */
    httpServer: import('http').Server;
    /**
     * - Rejection function from `Promise` constructor
     */
    reject: (error?: any) => void;
    /**
     * - Keep-alive timeout in milliseconds
     */
    keepAliveTimeout: number;
};
/**
 * Options for {@linkcode server }
 */
export type ServerOpts = {
    routeConfiguringFunction: RouteConfiguringFunction;
    port: number;
    cliArgs?: import("armor-types").ServerArgs | undefined;
    hostname?: string | undefined;
    allowCors?: boolean | undefined;
    basePath?: string | undefined;
    extraMethodMap?: Readonly<import("armor-types").DriverMethodMap<import("armor-types").ExternalDriver<import("armor-types").Constraints, string, import("armor-types").StringRecord, import("armor-types").StringRecord, import("armor-types").DefaultCreateSessionResult<import("armor-types").Constraints>, void, import("armor-types").StringRecord>>> | undefined;
    serverUpdaters?: import("armor-types").UpdateServerCallback[] | undefined;
    keepAliveTimeout?: number | undefined;
};
/**
 * A function which configures routes
 */
export type RouteConfiguringFunction = (app: import('express').Express, opts?: RouteConfiguringFunctionOpts | undefined) => void;
/**
 * Options for a {@linkcode RouteConfiguringFunction }
 */
export type RouteConfiguringFunctionOpts = {
    basePath?: string | undefined;
    extraMethodMap?: Readonly<import("armor-types").DriverMethodMap<import("armor-types").ExternalDriver<import("armor-types").Constraints, string, import("armor-types").StringRecord, import("armor-types").StringRecord, import("armor-types").DefaultCreateSessionResult<import("armor-types").Constraints>, void, import("armor-types").StringRecord>>> | undefined;
};
/**
 * Options for {@linkcode configureServer }
 */
export type ConfigureServerOpts = {
    app: import('express').Express;
    addRoutes: RouteConfiguringFunction;
    allowCors?: boolean | undefined;
    basePath?: string | undefined;
    extraMethodMap?: Readonly<import("armor-types").DriverMethodMap<import("armor-types").ExternalDriver<import("armor-types").Constraints, string, import("armor-types").StringRecord, import("armor-types").StringRecord, import("armor-types").DefaultCreateSessionResult<import("armor-types").Constraints>, void, import("armor-types").StringRecord>>> | undefined;
};
/**
 *
 * @param {ServerOpts} opts
 * @returns {Promise<ArmorServer>}
 */
export function server(opts: ServerOpts): Promise<ArmorServer>;
/**
 * Sets up some Express middleware and stuff
 * @param {ConfigureServerOpts} opts
 */
export function configureServer({ app, addRoutes, allowCors, basePath, extraMethodMap, }: ConfigureServerOpts): void;
/**
 * Normalize base path string
 * @param {string} basePath
 * @returns {string}
 */
export function normalizeBasePath(basePath: string): string;
//# sourceMappingURL=server.d.ts.map