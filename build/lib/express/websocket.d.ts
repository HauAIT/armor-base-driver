/// <reference types="node" />
export type ArmorServer = import('armor-types').ArmorServer;
export function addWebSocketHandler(this: import("armor-types").ArmorServer, handlerPathname: string, handlerServer: import("ws").Server<typeof import("ws"), typeof import("http").IncomingMessage>): Promise<void>;
export class addWebSocketHandler {
    webSocketsMapping: {};
}
export function removeWebSocketHandler(this: import("armor-types").ArmorServer, handlerPathname: string): Promise<boolean>;
export function removeAllWebSocketHandlers(this: import("armor-types").ArmorServer): Promise<boolean>;
export function getWebSocketHandlers(this: import("armor-types").ArmorServer, keysFilter?: string | null | undefined): Promise<Record<string, import("ws").Server<typeof import("ws"), typeof import("http").IncomingMessage>>>;
export const DEFAULT_WS_PATHNAME_PREFIX: "/ws";
//# sourceMappingURL=websocket.d.ts.map