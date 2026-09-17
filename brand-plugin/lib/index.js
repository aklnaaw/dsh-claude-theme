/**
 * Host half of dsh-claude-brand.
 *
 * Deliberately empty: every effect this plugin has is a browser-side
 * presentation concern (slot occupants + two DOM strings). There is no host
 * state, no RPC surface, and no persistence.
 *
 * The module exists because the DSH plugin contract resolves both halves from
 * the package entry points, and `main` must resolve to something loadable.
 */

export const name = "dsh-claude-brand";

/** No host services are needed; the client half declares its own (`slots`). */
export const inject = [];

export function apply() {
  // Intentionally empty — see the module doc.
}
