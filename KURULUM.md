# Frame Parade — setup guide for the assistant

The filename stays KURULUM.md so the README and setup prompt use one guide. This is the English guide; speak to the user in their chosen language.

Goal: configure this copy for its owner, then present a local, silent, 10-second portrait sample using their channel name. YouTube, paid audio, analytics and agent-post are optional. Installation succeeds only when the actual sample has been produced and checked; reading this guide is not a test result.

## Explain every step simply

Assume the user is new to AI and software setup. Explain what the next step achieves in everyday language, ask them to do one thing at a time, and explain technical terms when first used. Do not hand them a long command list. Reuse their answers and authorizations; ask only for missing decisions.

## 1. Establish the workspace

Use the official repository named in the prompt. If the destination is not empty, stop and agree on a location; do not delete, overwrite or select another repository. If private access is unavailable, report that limitation.

Read LICENSE, CLAUDE.md and KURALLAR.md at the root alongside this guide. If a required instruction file is absent or contradictory, report the incomplete package rather than inventing rules. Inspect package.json and the lockfile before installing dependencies.

All commands below run from the repository root. Keep the existing file layout. Do not operate the desktop, mouse or keyboard or record the user's screen. The renderer controls its own headless browser. Preserve source footage. Use the existing authorization in the conversation; obtain any missing approval for concrete system installations, paid operations or account access.

## 2. Check prerequisites and install dependencies

Run these version checks separately:

    node -v
    npm --version
    git --version

Node.js must satisfy package.json: version 20 or newer; prefer a currently maintained LTS release that meets this requirement. Create yonetim/ROLLER.md if absent, then record the observed OS, architecture, versions, free disk space and check time there. A read-only cross-platform check is:

    node -e "const fs=require('node:fs'); const s=fs.statfsSync('.'); console.log(JSON.stringify({platform:process.platform,arch:process.arch,node:process.version,freeBytes:s.bavail*s.bsize}))"

If a check fails, report what is unknown. For missing tools, identify the operating system first and use the official installation pages below. Explain one step at a time; do not invent commands or silently install software.

| System | Node.js and npm | Git |
|---|---|---|
| Windows | [Official download selector](https://nodejs.org/en/download), choose Windows and the correct architecture | [Windows installation](https://git-scm.com/install/windows) |
| macOS | [Official download selector](https://nodejs.org/en/download), choose macOS and the correct architecture | [macOS installation options](https://git-scm.com/install/mac) |
| Linux | [Official download selector](https://nodejs.org/en/download), choose the actual distribution-compatible method | [Linux installation options](https://git-scm.com/install/linux), follow the distribution-specific instructions |

After an installation, recheck the actual command versions. Do not confuse this kit's Node.js and Git requirements with the requirements for opening Claude Desktop.

Dependencies and a browser installation can require approximately several hundred MB or more, plus caches and generated media. This is a rough planning allowance, not a measured minimum. Report observed free space; no validated universal disk requirement is available. Longer videos and retained frame files require additional space. A Windows clean-folder trial completed on 20 November 2026 with Node.js, Git and Chrome already installed. Missing-tool installation, macOS and Linux have not been tested by that trial.

Explain that dependency installation downloads packages and may execute installation scripts, including the ffmpeg binary download. Once authorized:

    npm install

Stop on failure; do not force-upgrade dependencies or repeatedly reinstall without diagnosing the error. If npm reports audit warnings, summarize them for review; do not run npm audit fix --force.

### ffmpeg

The renderer imports ffmpeg-static; it does not need a separate global ffmpeg installation for this sample. Confirm the installed binary works:

    node --input-type=module -e "import ffmpeg from 'ffmpeg-static'; import {spawnSync} from 'node:child_process'; const r=spawnSync(ffmpeg,['-version'],{stdio:'inherit'}); process.exit(r.status ?? 1)"

ffmpeg-static does not supply ffprobe. If a later workflow requires ffprobe, check it separately and explain any installation needed. Do not make it a prerequisite for the silent sample.

### Chrome or a compatible browser

puppeteer-core does not install Chrome. ayar.mjs selects the first existing path from:

1. kanal.json → chrome;
2. CHROME_YOLU from the process environment, including a value loaded from local .env if the variable was not already set;
3. known browser installation locations, then an executable search on PATH if none is found.

The current resolver also considers Edge, Brave and Chromium. Chrome was used in the reported Windows trial; detection of another browser is not a successful render test. The categories below summarize the resolver in ayar.mjs.

| System | Paths checked |
|---|---|
| Windows | Program Files / Program Files (x86) Chrome and Edge paths; selected Brave paths; local-user Chrome, Brave and Chromium paths under LOCALAPPDATA; then PATH search. |
| macOS | Chrome, Chromium, Edge and Brave application bundles under /Applications; then PATH search. |
| Linux | Known Chrome, Chromium, Edge and Brave executable paths under /usr/bin, plus /snap/bin/chromium; then PATH search. |

Use an actual executable path, not a directory. Check resolution without launching a render:

    node --input-type=module -e "import {chromeYolu} from './ayar.mjs'; console.log(chromeYolu())"

A resolved file is not proof that Chrome can launch; the sample will test that. Existing process variables override .env values. Do not print the environment or .env contents.

## 3. Interview and save preferences

Use [kurulum/questions.md](kurulum/questions.md) for English or [kurulum/sorular.md](kurulum/sorular.md) for Turkish. For other languages, ask equivalent questions in the user's language. Ask one topic at a time and reuse answers already provided. Optional questions can be skipped. Topics 12–15 are a conditional checklist, not four mandatory follow-up questions: if the user already chose preview before publishing and skipped add-ons, record that, leave the integrations off and perform the remaining local machine checks without repeating the choices.

Preserve the actual JSON schema and value types. Do not create ignored feature switches or use null where the template uses strings, arrays or objects. Keep youtube.cocuklara_ozel at its existing null value until the user makes that choice; uploading requires an explicit true or false.

| File | What belongs here |
|---|---|
| kanal.json | Existing runtime settings: channel/series/language, colors/fonts/logo, screen-text overrides, audio parameters, YouTube metadata defaults and paths. |
| yonetim/VIDEO-KIMLIGI.md | Topic, audience, outcomes, formats, asset locations, approved visual/narration identity and audio choices. Fill the existing document. |
| yonetim/referanslar.md | Links, user notes, inspected segments, access limits and qualities to adopt or avoid. Create if absent. |
| yonetim/ROLLER.md | Writing/production/review responsibilities, preview and publication approvals, optional integrations, work limits and observed setup results. Create if absent. |

Other management files have distinct jobs:

- yonetim/isler.md tracks each task, status, next step and owner. Update it within the assigned writing responsibilities.
- yonetim/karar-gunlugu.md records dated decisions, reasons and decision-makers. Follow its numbering and ownership rules.
- yonetim/studio-yapilacak.md holds manual YouTube Studio follow-up items created by the upload workflow. During silent setup, leave it without invented publication tasks.

Fill the eight existing VIDEO-KIMLIGI.md sections briefly:

| Section | What to write |
|---|---|
| 1. Recurring skeleton | Audience, intended outcome and the repeatable opening–body–ending structure; note the chosen formats. |
| 2. Visual language | Approved palette, fonts, main-subject scale, motion style and accessible reference traits. |
| 3. Audio | Silent, own voice or synthetic voice; pronunciation and listening approval; music/effect choices. |
| 4. Text | Language, explanation level, title/opening approach and source-checking expectations. |
| 5. Package | Expected video, title, description, cover and subtitles, with output/source locations. |
| 6. Quality gate | Link KALITE-KAPISI.md and record channel-specific measurable targets and pending inspections. |
| 7. Free to vary | Elements that may change per video, such as examples, duration or scene composition. |
| 8. Change log | Date, change and reason; link the corresponding decision instead of silently changing the identity. |

Use these runtime keys, not earlier proposed aliases:

- Identity: ad, seri, dil. Leave seri empty if no series is chosen; remove sample placeholder names.
- On-screen text: ekran_metinleri. Empty means built-in English/Turkish values according to dil; an unknown dictionary language falls back to English. Use a valid locale tag. Overrides use the keys exposed by motor/sayfa/kimlik.js; chain is an array, the other current values are strings.
- Colors: renkler.zemin, yuzey, cizgi, ik (secondary), metin, vu (accent), abone_dugmesi.
- Fonts: yazitipleri.baslik and yazitipleri.sayi. Keep the bundled fonts unless another licensed font has actually been loaded and checked.
- Audio: ses.saglayici, kimlik, model, hece_sn and lufs. These settings do not turn services on. Record silent mode in the identity/roles documents and do not call audio tools.
- YouTube: youtube.oynatma_listesi, kategori, etiketler, yayin_saatleri, utc_farki, yapay_zeka_beyani, cocuklara_ozel and aciklama_zorunlu. These are metadata defaults, not OAuth credentials, timers or permission to publish.
- Paths: klasorler.projeler, klasorler.gecici, chrome. Keep the initial projeler directory and the empty temporary-path default. Moving projects outside the repository needs separate implementation verification because browser assets are served from the repository root.

A project's format is in its own proje.json: bicim is dikey or yatay. It is not a channel-level format switch.

Inspect references only where accessible. If a reference cannot be opened, record its status explicitly as "not inspected" ("incelenmedi" in Turkish). Propose a palette from the user's own description and label it as a proposal; do not describe it as extracted from that reference. Present a short style card: audience, narration, palette, typography, motion and things to avoid. Distinguish the user's choices from proposals, then obtain style approval. Keep writing, design/production and review responsibilities clear. By default, the same model writes the script and then produces the visuals; the owner reviews the result. A second model and agent-post are optional later choices, never prerequisites for this setup. Do not start extra paid sessions merely because roles exist.

## 4. Local credentials, only when needed

The silent sample needs no ElevenLabs or Google credentials.

If the user selects an integration, show only the required field names from .env.ornek:

| Name | Purpose |
|---|---|
| ELEVENLABS_API_KEY | User enters this locally for chosen ElevenLabs work. |
| YOUTUBE_REFRESH_TOKEN | Written locally by the OAuth flow; never request it in chat. |
| CHROME_YOLU | Optional executable path; not a secret. |

Copy the empty example to .env only if .env is absent. Never overwrite an existing credential file. The user enters values locally; do not read, echo, screenshot or paste keys/tokens. Check file existence or a boolean configured status without returning values.

Verify .env, youtube/client_secret.json and youtube/yetki-adres.txt remain excluded from Git. Keep local reports and private channel data out of the distributable kit as well.

## 5. Render the approved local sample

Check the project before running:

- kanal.json.ad is the agreed name; seri is agreed or empty.
- projeler/ornek-dikey/proje.json has bicim=dikey.
- projeler/ornek-dikey/tam.zaman.json has toplam=10.
- There is no pre-existing cikti/tam.wav: the renderer uses it automatically if present. Do not delete a user's audio to force silence.
- Existing tam.mp4 and its render report are preserved or overwrite permission has already been obtained. The command replaces its output.

Then run:

    node motor/render.mjs ornek-dikey

With the default project directory, expected files are:

- projeler/ornek-dikey/cikti/tam.mp4
- projeler/ornek-dikey/cikti/tam.render.json

The sample target is 1080×1920, 30 fps, 10 seconds (300 frames). Without tam.wav, the renderer adds a silent AAC track; silence does not mean no audio stream.

Check process success, the actual nonempty output, the report and video playback. The report should show video_sn=10, kare=300, boyut=1080x1920 and sesli=false for this path. The report describes the render; it does not replace visual review. Inspect for the correct channel name and language, readable text, clipping, missing fonts and motion. Present the local MP4 for the user to play. Do not claim to have watched or heard it if you cannot inspect it.

Use KALITE-KAPISI.md if provided; otherwise state that only the checks above were performed. A failed render is incomplete installation: report the error and next step. Do not upload the sample.

## 6. Optional integrations

### YouTube authorization

Only start after the user chooses it and approves the actual requested access. The current helper requests youtube.upload, youtube, youtube.force-ssl and yt-analytics.readonly. It is not an analytics-only authorization flow.

The user provides a suitable Google OAuth desktop-client file locally at youtube/client_secret.json; do not paste its contents. The relevant Google APIs and consent setup must already be available for that user's project. Then:

    node youtube/yetki.mjs

The helper writes youtube/yetki-adres.txt and waits for a local browser callback for up to 15 minutes. Ask the user to open the local authorization link and choose the intended account/channel; the script does not open the browser itself. Do not capture authorization codes or tokens in chat. On success it writes YOUTUBE_REFRESH_TOKEN to .env and removes the temporary address file during normal shutdown.

Connecting the API does not authorize an upload. For a later, complete video package, a dry run uses a project path and exactly one visibility/schedule option, without --yes:

    node youtube/yukle.mjs projeler/MY_PROJECT --gizli

MY_PROJECT is a placeholder to replace with the actual prepared project; do not run this example literally. Other options are --hemen or --yayin "YYYY-MM-DD HH:MM"; scheduled time uses youtube.utc_farki.

A later real upload requires review of the actual video, title, description, target channel, visibility/schedule and disclosures, followed by explicit user approval. Only then may --yes be added. Private uploads are still uploads. Do not automatically retry a partly completed real upload: first inspect the existing local receipt and remote result to avoid duplicates.

The uploader requires youtube.cocuklara_ozel to be explicitly true or false; its initial null value stops an upload. Ask the owner for the appropriate declaration for the actual content rather than inferring it from the channel topic. Review youtube.yapay_zeka_beyani for that video as well. The OAuth-selected channel is not independently checked against a configured expected channel ID. Confirm the target before any real upload. --ilgili records a manual Studio task; it does not set the related video through the API.

### Narration

If selected, choose a real voice ID with the user and put it in ses.kimlik; select a model available to that account in ses.model. A value in the template is not availability evidence. Keep the API key in .env.

ses/eleven.mjs is a helper module, not a standalone narration command. The production CLI is ses/uret.mjs and reads a project's metin.json. Confirm that the chosen project and block exist; the setup sample has no narration script to synthesize.

The command shape for separately approved narration is:

    node ses/uret.mjs MY_PROJECT BLOCK_ID

Replace both placeholders with real reviewed inputs. Explain text sent to the provider and estimated cost, obtain any required spending approval and generate one short preview first. The user must listen before the voice is approved. The current budget calculation assumes 0.5 credits per character; it is an estimate, not a reliable hard cap. No audio generation is needed to finish the silent setup.

### Music and sound effects

Keep them off unless selected. Confirm rights and get listening approval before using candidates. Available effect commands are:

    node ses/efekt/kur.mjs sentez
    node ses/efekt/kur.mjs eleven
    node ses/efekt/kur.mjs duzey
    node ses/efekt/kur.mjs dinleme

These are separate actions, not a sequence to run automatically. sentez creates local candidates and can overwrite files. eleven uses the paid provider and has no --yes guard; obtain cost/scope approval first. duzey prepares/levels candidates; dinleme produces kit-dinleme.mp3 and kit-dinleme.zaman.json for listening. Creating these files does not record approval or activate a soundtrack.

### Daily analytics

After chosen OAuth access and one authorized collection:

    node youtube/analitik.mjs

Outputs are analitik/OZET.md and analitik/veri/anlik.jsonl. The script collects data; it does not create a scheduled task. Keep both paths excluded from Git and accidental sharing; the current ignore file lists the data directory and the summary.

For daily collection, first agree on time, timezone, executable, working directory, output privacy and notification behavior. Use an existing task manager or a reviewed task definition appropriate to the machine. The kit has no universal scheduler installer. Do not duplicate an existing task or call a model for routine unchanged checks. Never promise CTR or Shorts swipe/retention metrics that the script does not collect.

### Agent-post

This is a separate, optional integration for users who choose collaboration between models. The single-model workflow needs no agent-post. Follow the current [agent-post repository instructions](https://github.com/nihatbirbudak/agent-post) for the public package, or the installed documentation for an existing local setup; do not mix their commands or identity settings. The kit does not supply a universal installer. Use a unique identity per task, read only that task's inbox, preserve existing identity bindings and reuse one healthy local watcher. Empty inbox checks must not invoke a model. Do not create a second watcher or periodic model polling.

## 7. Finish and record the result

In yonetim/ROLLER.md, record actual checks, sample path, user review status, skipped integrations and unresolved issues. Keep secret values out of the report.

Before distributing a personalized copy, use the current reviewed scanner with node tara.mjs. It writes TARAMA.md, masks matched values and attempts a Git-history scan. Keep reports local; report only counts and categories, not matching snippets or personal paths. The working-file filter excludes .env, and a skipped or failed history scan must be reported. A clean result is not proof that every secret is absent.

Give the user a short summary and the real local preview. Wait for their review, then ask in their language:

**What should your first video be about?**

Turkish: **İlk videonuzun konusu ne olsun?**
