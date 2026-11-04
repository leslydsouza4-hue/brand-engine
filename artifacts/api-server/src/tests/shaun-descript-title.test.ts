import { test } from "node:test";
import assert from "node:assert/strict";
import { descriptTitle } from "../lib/shaun-video-import";
test("Descript title supports attribute order, escaping and title fallback", () => {
  assert.equal(descriptTitle(`<meta content="Profiles &amp; Business Cards - Descript" property="og:title">`), "Profiles & Business Cards");
  assert.equal(descriptTitle(`<meta property='og:title' content='Checkout Upgrades'>`), "Checkout Upgrades");
  assert.equal(descriptTitle("<title>Studio Payments - Descript</title>"), "Studio Payments");
  assert.equal(descriptTitle("<html></html>"), "");
});
