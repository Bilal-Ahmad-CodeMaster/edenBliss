export const DEFAULT_PAGE_LIMIT = 10;
export const MAX_PAGE_LIMIT = 50;

export function parsePageLimit(pageValue: unknown, limitValue: unknown) {
  const page = Math.max(1, Math.floor(Number(pageValue) || 1));
  const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, Math.floor(Number(limitValue) || DEFAULT_PAGE_LIMIT)));
  return { page, limit, skip: (page - 1) * limit };
}

export function pageCount(total: number, limit: number) {
  return Math.max(1, Math.ceil(total / limit));
}
