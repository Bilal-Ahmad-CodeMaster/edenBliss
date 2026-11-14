/** Full navigation so the login form opens at the top of the screen, including on a phone. */
export function loginHref(next?: string) {
  const path = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return `/login?next=${encodeURIComponent(path)}`;
}

export function redirectToLogin(next?: string) {
  const path = next ?? `${window.location.pathname}${window.location.search}`;
  window.location.assign(loginHref(path));
}
