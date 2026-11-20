# Output quality checks

Review the actual deliverable. Record each check as **passed**, **failed**, **not inspected** or **not applicable**, with evidence or a reason. A successful command alone does not establish that a video is ready.

Run the commands below from the repository root. Replace MY_PROJECT and BLOCK_ID with existing identifiers. Use a fresh review folder and check output paths before replacing files.

## 1. Initial silent sample

Expected default output: projeler/ornek-dikey/cikti/tam.mp4, with tam.render.json beside it.

- The render completed and the actual MP4 exists and is nonempty.
- The default sample is portrait 1080×1920, 30 fps and 10 seconds. Expected report values: boyut=1080x1920, kare=300, video_sn=10 and sesli=false.
- The channel name, selected language, fonts and graphics are correct. No unintended placeholder, clipping, overlap, blank scene or frozen transition remains.
- Actual playback follows the intended sequence. With no tam.wav, the output contains a silent AAC track; this is expected.
- The owner can open the local preview. If playback has not been inspected, leave that check pending.
- Narration and subtitle checks are not applicable to this silent sample. No upload, paid voice call or unselected recurring task is needed.

These are sample defaults, not required dimensions or duration for every later video.

## 2. Editorial and visual review for each video

| Check | Evidence to record |
| --- | --- |
| Promise and source | The title names a concrete topic or event, creates understandable curiosity and makes a promise the opening and body deliver. Claims match the script and cited sources. |
| Numbers | Every on-screen number has a checked calculation, source or clear example label. |
| Pacing | For explanatory lessons, use a purposeful visual cue for each sentence. As an editorial default, explain any gap longer than five seconds without a meaningful visual change. This is a style target, not a platform rule. |
| Main subject | The key subject is clear at phone size in every section. Record the intended scale in the channel's visual identity; apply a numeric target only after defining what it measures. |
| Frames and transitions | Inspect at least every two seconds, plus scene boundaries and brief events. Check overflow, collisions, ghost layers, missing assets and unintended holds. |
| Audio | Record speech rate, integrated loudness and true peak where applicable. Listen for pronunciation, intelligibility, cuts and effects masking speech. |
| Cover | The cover and opening frame communicate the topic and remain readable on a phone. |
| Continuity | Compare with the previous approved video for the agreed language, typography, palette, pacing and channel identity. |

### Frame inspection and automated checks

```sh
node kalite/kare.mjs MY_PROJECT tam projeler/MY_PROJECT/inceleme --her 2
node kalite/cakisma_tara.mjs MY_PROJECT tam 2
node kalite/okuma_olc.mjs MY_PROJECT tam
```

The frame command creates PNGs and an event record for review. Also inspect the actual rendered MP4; scene screenshots alone do not verify the encoded video.

The collision scan flags selected text and line intersections at sampled times. The reading tool reports visibility durations and flags durations under 0.6 seconds. That threshold is a warning heuristic: longer text can require much more reading time. Neither tool covers every element or every instant, and findings do not necessarily produce a failing exit code.

**Current portrait limitation:** the collision scan uses fixed landscape safe bounds, and the reading tool uses a 1920×1080 visibility boundary. Until these checks use the actual scene dimensions, their reports cannot establish that a portrait video passes. Inspect portrait frames directly and record automated portrait coverage as unavailable. Do not suppress real findings just to obtain a clean report.

### Subtitles

For a narrated project with metin.json and matching timing data:

```sh
node kalite/altyazi.mjs MY_PROJECT tam
```

This writes projeler/MY_PROJECT/paket/altyazi.srt and can also generate English subtitles when ceviri-en.json exists. To run the English step separately:

```sh
node kalite/altyazi_en.mjs MY_PROJECT
```

Read the generated subtitles against the final audio: wording, language, names, sequence, synchronization, line breaks and reading time. Aim for at most two lines of 42 characters, then check the actual output. Cue-boundary adjustments can shorten display time; a generated file is not proof that every cue meets the intended minimum.

The English validator currently rejects Turkish letters, including legitimate proper names. Preserve correct names and report such a failure for correction; do not remove accurate diacritics merely to pass validation. Preserve any manually edited subtitle file before regeneration.

### Speech and final mix

```sh
node ses/olc.mjs MY_PROJECT BLOCK_ID
```

This measures an existing narration block and writes or updates projeler/MY_PROJECT/ses/olcum.json. It reports speech rate, pauses, loudness and peaks. The English syllable count is an estimate. These block measurements do not establish the loudness of the final video with music and effects.

To measure integrated loudness and true peak in an existing final MP4 using the bundled FFmpeg:

```sh
node --input-type=module -e "import ffmpeg from 'ffmpeg-static'; import {spawnSync} from 'node:child_process'; const r=spawnSync(ffmpeg,['-hide_banner','-i',process.argv[1],'-af','ebur128=peak=true','-f','null','-'],{stdio:'inherit'}); process.exit(r.status ?? 1)" projeler/MY_PROJECT/cikti/tam.mp4
```

Record the final summary, including integrated LUFS and true peak. Compare it with the approved audio targets; kanal.json's loudness setting is a project target, not a universal platform requirement. Resolve clipping and missing audio targets before acceptance. Numerical measurements cannot establish pronunciation, intelligibility or pleasing balance: unheard audio remains unverified.

## 3. Before an approved upload

Prepare the actual final file, title, description, subtitles, thumbnail where applicable, destination channel, visibility or schedule, timezone and relevant declarations. Apply the owner's made-for-kids and synthetic-media decisions for that content.

Run the uploader's dry run without --yes for the complete package. Resolve failures and identify manual Studio work. A clean dry run does not authorize sending.

Use the owner's valid authorization covering the package and destination before the real upload. Preserve the receipt and check partial remote results before retrying. A planned or private video must not be described as publicly available.

## 4. Completion record

Record the reviewed file, checks, measurements, outstanding issues and owner's review status in the project management records. Link material decisions from yonetim/karar-gunlugu.md. Do not mark a required, uninspected check as passed. No promised view count, retention rate or algorithmic outcome is a quality check.