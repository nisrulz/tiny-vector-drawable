import { isXmlFile } from './util.js';

export const MAX_FILE_COUNT = 100;
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 25 * 1024 * 1024;

export function validateFileBatch(fileList, current = {}) {
  const selected = Array.from(fileList);
  if (selected.length > MAX_FILE_COUNT) {
    throw new Error(`Choose at most ${MAX_FILE_COUNT} files at a time.`);
  }

  const files = selected.filter(isXmlFile);
  if (files.length === 0) {
    throw new Error('No .xml vector drawable files found.');
  }

  const currentCount = current.count || 0;
  if (currentCount + files.length > MAX_FILE_COUNT) {
    throw new Error(`Keep at most ${MAX_FILE_COUNT} files in one batch.`);
  }

  const oversized = files.find((file) => file.size > MAX_FILE_BYTES);
  if (oversized) {
    throw new Error(`${oversized.name} is larger than 5 MB.`);
  }

  const selectedBytes = files.reduce((total, file) => total + file.size, 0);
  if ((current.bytes || 0) + selectedBytes > MAX_TOTAL_BYTES) {
    throw new Error('Keep the total input size below 25 MB.');
  }

  return files;
}
