export function normalizeReturnTo(value: string | null | undefined, fallback = "/") {
  const candidate = typeof value === "string" ? value.trim() : "";

  if (!candidate || !candidate.startsWith("/")) {
    return fallback;
  }

  return candidate;
}

export function appendReturnTo(pathname: string, returnTo?: string | null) {
  const normalizedReturnTo = normalizeReturnTo(returnTo, "");

  if (!normalizedReturnTo) {
    return pathname;
  }

  const url = new URL(pathname, "http://local");
  url.searchParams.set("returnTo", normalizedReturnTo);
  return `${url.pathname}${url.search}`;
}
