import test from "node:test";
import assert from "node:assert/strict";
import { disposeLocalTranscriber, transcribeLocalAudio } from "../lib/shaun-video-transcribe";

// Opt-in integration regression: supply a real 8–15 second, mono PCM16/16kHz
// clip from the approved source. Model downloads stay under /tmp, never Git.
test("local Whisper produces genuine nonuniform aligned words from speech", {
  skip: !process.env.SHAUN_ASR_TEST_WAV, timeout: 120000,
}, async () => {
  try {
    const result = await transcribeLocalAudio(process.env.SHAUN_ASR_TEST_WAV!, () => undefined);
    assert.equal(result.timestampMethod, "whisper-cross-attention-dtw");
    assert.equal(result.timing, "word");
    assert.ok(result.duration >= 8 && result.duration <= 15);
    assert.ok(result.words.length > 10);
    const widths = new Set(result.words.map(w => Math.round((w.end - w.start) * 100)));
    assert.ok(widths.size > 4, "words have genuinely varied timing, not equal distribution");
    for (let i = 0; i < result.words.length; i++) {
      const word = result.words[i];
      assert.ok(word.text.trim());
      assert.ok(word.start >= 0 && word.end > word.start && word.end <= result.duration);
      if (i) assert.ok(word.start >= result.words[i - 1].end);
    }
    assert.match(result.text.toLowerCase(), /profile|business|cards/);
  } finally { disposeLocalTranscriber(); }
});

test("an already-aborted transcription never starts its worker", async () => {
  const controller = new AbortController(); controller.abort();
  await assert.rejects(transcribeLocalAudio("/nonexistent.wav", () => undefined, controller.signal), /cancelled/);
});
