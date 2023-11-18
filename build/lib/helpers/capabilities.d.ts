export type Constraints = import('armor-types').Constraints;
export type ArmorLogger = import('armor-types').ArmorLogger;
export type StringRecord = import('armor-types').StringRecord;
export type BaseDriverCapConstraints = import('armor-types').BaseDriverCapConstraints;
export type Capabilities<C extends import("armor-types").Constraints> = import('armor-types').Capabilities<C>;
export function isW3cCaps(caps: any): boolean;
/**
 *
 * @template {Constraints} C
 * @param {any} oldCaps
 * @param {C} desiredCapConstraints
 * @param {ArmorLogger} log
 * @returns {Capabilities<C>}
 */
export function fixCaps<C extends import("armor-types").Constraints>(oldCaps: any, desiredCapConstraints: C, log: ArmorLogger): import("armor-types").ConstraintsToCaps<C>;
//# sourceMappingURL=capabilities.d.ts.map