export const SESSION_COOKIE = "eb_session";
export const REFRESH_COOKIE = "eb_refresh";

export const RESTRICTED_MESSAGE =
  "Your account has been restricted by the administrator.";

/** A signed-in visitor counts as online while a heartbeat arrived inside this window. */
export const ONLINE_WINDOW_MS = 90_000;

/** Admin overview counts a visitor as logged in for this long after the last heartbeat. */
export const ADMIN_ONLINE_WINDOW_MS = 15 * 60 * 1000;

export const LOW_STOCK_THRESHOLD = 3;

export const HEARTBEAT_INTERVAL_MS = 40_000;

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
