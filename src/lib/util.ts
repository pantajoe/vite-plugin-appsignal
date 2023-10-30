/**
 * Chunks an array into smaller arrays/batches of a specified size.
 *
 * @param arr The array to chunk.
 * @param size The size of each chunk.
 */
export function chunkify<T>(arr: T[], size: number): T[][] {
  return arr.length > size ? [arr.slice(0, size), ...chunkify(arr.slice(size), size)] : [arr]
}
