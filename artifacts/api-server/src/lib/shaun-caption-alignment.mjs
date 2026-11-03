/** Preserve recognizer text. Unreliable word boundaries become a grouped cue,
 * never invented evenly-spaced word timestamps. */
export function appendAlignedWord(words, text, start, end, duration) {
  if (!text) return false;
  const previous = words.at(-1);
  const valid = Number.isFinite(start) && Number.isFinite(end) && start >= 0 && end > start && end <= duration;
  if (valid && (!previous || start >= previous.end)) {
    words.push({ text, start, end });
    return false;
  }
  if (previous) {
    previous.text = `${previous.text} ${text}`.trim();
    if (valid) previous.end = Math.max(previous.end, end);
    return true;
  }
  return null; // caller carries this text forward to the first reliable boundary
}
