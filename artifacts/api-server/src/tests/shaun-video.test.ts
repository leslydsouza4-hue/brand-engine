import test from "node:test";
import assert from "node:assert/strict";
import { findDescriptMedia, validateDescriptShareUrl } from "../lib/shaun-video-import";
import { videoResponse, MAX_DURATION, MAX_VIDEO_BYTES } from "../lib/shaun-video-store";

test("Descript import accepts only canonical HTTPS share pages", () => {
  assert.equal(validateDescriptShareUrl("https://share.descript.com/view/abc-123"), "https://share.descript.com/view/abc-123");
  for (const url of [
    "http://share.descript.com/view/abc", "https://127.0.0.1/view/abc",
    "https://share.descript.com.evil.test/view/abc", "https://evil.test/view/abc",
    "https://share.descript.com:8443/view/abc", "https://user:password@share.descript.com/view/abc",
    "https://share.descript.com/admin", "file:///etc/passwd", "https://[::1]/view/abc",
    "https://share.descript.com/view/abc/other",
  ]) assert.throws(() => validateDescriptShareUrl(url), { name: "Error" }, url);
});

test("Video API projection never exposes staging URL, owner, or storage keys", () => {
  const result = videoResponse({
    videoId: "test-id", name: "video.mp4", owner: "private-owner", status: "ready",
    staging: "/objects/uploads/private-key", size: 123, contentType: "video/mp4",
    createdAt: "2026-01-01T00:00:00.000Z", probe: { duration: 20, width: 1080, height: 1920, hasAudio: true },
  });
  assert.equal(result.assetUrl, "/api/shaun-video/videos/test-id/asset");
  assert.equal(JSON.stringify(result).includes("private-"), false);
  assert.equal(MAX_DURATION, 600);
  assert.equal(MAX_VIDEO_BYTES, 250 * 1024 * 1024);
});

test("Descript reads the supplied public original URL, including extensionless downloads", () => {
  const project = "4ebdacae-f58d-42bc-9920-50a08f6aef95";
  const url = `https://api.descript.com/v2/published_projects/${project}/download?expiration=123&amp;signature=example`;
  const metadata = (enabled: boolean, original = url) => `<script type="application/json" id="metadata">${JSON.stringify({
    id: project, downloads_enabled: enabled, drive_downloads_enabled: true,
    contents: { media: { original: { url: original } } },
  })}</script>`;
  assert.equal(findDescriptMedia(metadata(true)), url.replace("&amp;", "&"));
  assert.throws(() => findDescriptMedia(metadata(false)), /disabled/);
  assert.throws(() => findDescriptMedia(metadata(true, "http://127.0.0.1/private")), /No accessible MP4/);
  assert.throws(() => findDescriptMedia(metadata(true, "https://api.descript.com/admin")), /No accessible MP4/);
  assert.throws(() => findDescriptMedia(metadata(true, "https://api.descript.com/v2/published_projects/00000000-0000-0000-0000-000000000000/download")), /No accessible MP4/);
  const remux = `https://storage.googleapis.com/production-273614-media-cache/v1/remux/${"a".repeat(64)}.mp4`;
  assert.equal(findDescriptMedia(metadata(true, remux)), remux);
  assert.throws(() => findDescriptMedia(metadata(true, "https://storage.googleapis.com/arbitrary-bucket/private.mp4")), /No accessible MP4/);
});
