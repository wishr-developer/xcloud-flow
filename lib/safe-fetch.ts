/**
 * Wrap a Supabase query (or anything returning a promise) so the page renders
 * gracefully even when the credentials are missing or the service is unreachable.
 * Returns the resolved data on success, fallback on any error / network failure.
 */
export async function safeFetch<T>(
  promise: PromiseLike<{ data: T | null; error: unknown }>,
  fallback: T
): Promise<T> {
  try {
    const { data, error } = await promise;
    if (error || data == null) return fallback;
    return data;
  } catch {
    return fallback;
  }
}
