// Meta Graph /insights endpoints cap a single request at 30 days. Split a range
// into consecutive <=maxDays windows, returned as [sinceUnix, untilUnix] pairs.
export function splitWindows(
  from: Date,
  to: Date,
  maxDays: number,
): Array<[number, number]> {
  const windows: Array<[number, number]> = [];
  const stepMs = maxDays * 24 * 60 * 60 * 1000;
  let cursor = from.getTime();
  const end = to.getTime();
  while (cursor < end) {
    const windowEnd = Math.min(cursor + stepMs, end);
    windows.push([Math.floor(cursor / 1000), Math.floor(windowEnd / 1000)]);
    cursor = windowEnd;
  }
  if (!windows.length) {
    windows.push([Math.floor(from.getTime() / 1000), Math.floor(end / 1000)]);
  }
  return windows;
}
