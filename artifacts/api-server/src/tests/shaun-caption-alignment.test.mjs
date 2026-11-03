import { test } from "node:test";
import assert from "node:assert/strict";
import { appendAlignedWord } from "../lib/shaun-caption-alignment.mjs";

test("bad boundaries keep recognized words in grouped aligned cues", () => {
  const words = [];
  appendAlignedWord(words, "created", 1, 1.4, 10);
  assert.equal(appendAlignedWord(words, "for", 1.4, 1.4, 10), true);
  assert.equal(appendAlignedWord(words, "you", 1.3, 1.8, 10), true);
  appendAlignedWord(words, "today", 2, 2.5, 10);
  assert.deepEqual(words, [{ text: "created for you", start: 1, end: 1.8 }, { text: "today", start: 2, end: 2.5 }]);
  appendAlignedWord(words, "too", NaN, NaN, 10);
  assert.equal(words[1].text, "today too");
  assert.equal(appendAlignedWord([], "opening", NaN, NaN, 10), null);
});
