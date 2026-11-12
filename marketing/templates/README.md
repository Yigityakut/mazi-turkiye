# Video templates (HyperFrames)

`make-video.mjs` — 16 s vertical "Bil bakalım" video (1080×1920): intro → photo + question → countdown from 5 → answer on the map, year counter, place name, CTA. The attribution line is on every frame.

```bash
node marketing/templates/make-video.mjs marketing/videos/specs/bb-001.json   # → marketing/videos/bb-001/
cd marketing/videos/bb-001 && npx -y hyperframes@0.9.10 check && npx -y hyperframes@0.9.10 render --output bb-001.mp4
```

Spec: `{ id, image (local path relative to the spec file), year, location, lat, lng, author, source, license, cta? { title, sub } }`. If `cta` is omitted, the last card reads "Her gün 5 fotoğraf. / Mazi Türkiye · App Store ve Google Play"; the pre-launch and pre-Android texts are in `marketing/content-calendar.md` §1.1.
Rule: the day's real photos are never used; only past days or the `bonus` pool. Rendering also works in the agent environment (local Chromium).
Voice-over (ElevenLabs) and music are not added yet; if they are, use the `/media-use` skill and the platform's "AI-generated" label.
