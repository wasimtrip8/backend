export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

/**
 * Parses pagination query params and returns normalized values.
 * Defaults: page = 1, limit = 10.
 * Ensures non-negative integers and avoids invalid inputs.
 */
export function parsePagination(query: any): PaginationParams {
  const page = Math.max(parseInt(query.page as string) || 1, 1);
  const limit = Math.max(parseInt(query.limit as string) || 10, 1);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}
