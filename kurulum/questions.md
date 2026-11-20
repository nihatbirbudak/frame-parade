# Frame Parade setup interview

For the setup assistant: follow [KURULUM.md](../KURULUM.md). These are 15 topics, not a form to send at once. Ask one topic per message, reuse previous answers and show examples only when helpful. Use the user's language; Turkish wording is in [sorular.md](sorular.md).

Required means a decision is needed: propose a choice if the user is unsure and get agreement. Optional topics can be skipped. Examples are not user preferences. Never request secrets as answers.

Mappings use the actual `kanal.json` schema. Only listed existing keys belong there; preserve types. Other preferences go in `yonetim/VIDEO-KIMLIGI.md`, `yonetim/referanslar.md` and `yonetim/ROLLER.md`. No JSON mapping means no runtime field, not a missing switch. Do not replace empty strings or arrays with null. Preserve the existing null in youtube.cocuklara_ozel until the owner decides. No choice silently enables paid services or publication.

## A. Identity

### 01 — Channel identity · Required

**Question:** What is your channel name, main topic and narration language? Do you have a series name, or should we leave it blank?

**Why:** The sample and scripts need a shared identity.

**Example:** Curiosity Desk; everyday science; English; no series name yet.

**Existing JSON keys:** `ad`, `seri`, `dil`, `ekran_metinleri`

**Write / conditions:** Store the topic in yonetim/VIDEO-KIMLIGI.md. Use a valid language tag (en/tr); keep JSON keys unchanged. Built-in screen text uses en/tr; ekran_metinleri holds optional overrides. An empty object keeps defaults. Agree on a provisional name if needed.

### 02 — Audience · Required

**Question:** Who are the videos for, and what should viewers understand or be able to do afterward?

**Why:** This sets the level of explanation.

**Example:** Adults new to AI; understand how a model predicts.

**Existing JSON keys:** None; use management documents.

**Write / conditions:** Write Audience and learning outcome in yonetim/VIDEO-KIMLIGI.md. The runtime has no audience fields.

### 03 — Platforms · Required choice; account links optional

**Question:** Where will you use the videos: YouTube, Shorts, Instagram Reels or TikTok? You may add existing account links.

**Why:** This informs framing. An account is not needed for the local sample.

**Example:** YouTube and Shorts; no account yet.

**Existing JSON keys:** None; use management documents.

**Write / conditions:** Write platforms and public account links in yonetim/VIDEO-KIMLIGI.md. Selection does not enable publishing integrations or authorize uploads.

## B. References

### 04 — References and dislikes · Optional

**Question:** Can you share 3–5 accounts or videos and what you like in each? Fewer examples, no examples and dislikes are also useful.

**Why:** This makes style preferences concrete.

**Example:** A link: diagrams build step by step. Another link: too much text.

**Existing JSON keys:** None; use management documents.

**Write / conditions:** Use yonetim/referanslar.md: URL, user note, inspected segment and access status. Put approved style in yonetim/VIDEO-KIMLIGI.md. If skipped, propose two simple directions. Do not claim to watch inaccessible videos or assume reuse rights.

## C. Content

### 05 — Content type · Required

**Question:** What will you mainly make: lessons, explainers, promotion for your own work, footage edits or motion graphics?

**Why:** This selects the initial workflow.

**Example:** Technical lessons with animated diagrams.

**Existing JSON keys:** None; use management documents.

**Write / conditions:** Write Content and workflow in yonetim/VIDEO-KIMLIGI.md. Check LICENSE for permitted use. Record unsupported needs; do not promise a full editing application.

### 06 — Formats and pace · Required format; frequency optional

**Question:** Will you make landscape videos, short portrait videos or both? Is there a production target you want to try?

**Why:** This sets templates and work order without scheduling publication.

**Example:** Both; one long video and two Shorts a week.

**Existing JSON keys:** None; use management documents.

**Write / conditions:** Write formats in yonetim/VIDEO-KIMLIGI.md and pace in yonetim/ROLLER.md. Each project uses proje.json: bicim=dikey or yatay, not kanal.json. Keep the setup sample dikey. Skipped frequency means undecided; do one sample first.

## D. Assets

### 07 — Source material · Required workspace; existing assets optional

**Question:** Where can we read your footage or scripts, and where should new material go? Starting without existing assets is fine.

**Why:** This separates source material and generated output.

**Example:** Read my external drive; put new assets in malzeme/ here.

**Existing JSON keys:** `klasorler.projeler`, `klasorler.gecici`

**Write / conditions:** Record source locations and access in yonetim/VIDEO-KIMLIGI.md. Keep projeler and the empty temporary-path default for the sample. These JSON keys are runtime paths, not an asset catalog. Propose a local malzeme/ folder if needed. Do not move, overwrite or delete source assets.

### 08 — Visual identity · Optional

**Question:** Do you have a logo, colors or fonts? Otherwise we can propose a look from your references.

**Why:** This keeps the style consistent.

**Example:** No logo; dark background with orange accents.

**Existing JSON keys:** `logo`, `renkler.zemin`, `renkler.yuzey`, `renkler.cizgi`, `renkler.ik`, `renkler.metin`, `renkler.vu`, `renkler.abone_dugmesi`, `yazitipleri.baslik`, `yazitipleri.sayi`

**Write / conditions:** Record approved style in yonetim/VIDEO-KIMLIGI.md. A font name does not load its file; retain bundled Inter Variable and JetBrains Mono Variable until an alternative is licensed, loaded and checked. An absent logo remains an empty string. Get style approval before rendering.

## E. Audio

### 09 — Narration · Required choice

**Question:** Would you like your own voice, a synthetic voice or a silent start? For synthetic voice, describe the tone and ElevenLabs access; do not share a key.

**Why:** This defines audio work and possible service costs.

**Example:** Silent first; my own recording later.

**Existing JSON keys:** `ses.saglayici`, `ses.kimlik`, `ses.model`, `ses.hece_sn`, `ses.lufs`

**Write / conditions:** Record silent/own/synthetic, tone and approvals in yonetim/VIDEO-KIMLIGI.md. JSON audio parameters are not an enable switch. Leave kimlik empty if unconfigured; do not run audio tools for silent setup. Select a real voice ID and available model only if chosen. Keys stay outside JSON. Paid-preview permission and listening approval are separate; follow KURULUM.md limitations.

### 10 — Music and effects · Optional

**Question:** Do you want music or sound effects? You can point to files you want to use.

**Why:** Audio needs rights checks and listening approval.

**Example:** No music; perhaps a few soft clicks.

**Existing JSON keys:** None; use management documents.

**Write / conditions:** Write choices and approved file paths in yonetim/VIDEO-KIMLIGI.md. Skip means off. There is no ses.muzik or ses.efekt flag. Unheard candidates are not approved. Paid effects need separate scope/cost approval.

## F. Writing

### 11 — Who writes · Required choice

**Question:** Will you write scripts, should this model write them, or would you like a second model such as Codex?

**Why:** This assigns writing, design and review.

**Example:** This model writes first, then designs; I review.

**Existing JSON keys:** None; use management documents.

**Write / conditions:** Use yonetim/ROLLER.md: manager, writer, production, review and publication owner. Roles do not automatically start separate paid sessions. Without a second model, write and design sequentially.

## G. Publishing and approval

### 12 — Review method · Required

**Question:** We will show each video before uploading or publishing. Is a local preview file suitable?

**Why:** You need to review the actual text, visuals and audio.

**Example:** Yes; show the video, title and description locally.

**Existing JSON keys:** None; use management documents.

**Write / conditions:** Record preview method and explicit upload/publication approval in yonetim/ROLLER.md. There is no JSON approval switch. API access, silence and --yes are not approval. Get permission before sending a preview to an external service.

### 13 — YouTube connection · Optional

**Question:** Would you like the YouTube API now, later, or manual uploads?

**Why:** Local production does not require a connected account.

**Example:** Manual uploads for now.

**Existing JSON keys:** `youtube.oynatma_listesi`, `youtube.kategori`, `youtube.etiketler`, `youtube.yayin_saatleri`, `youtube.utc_farki`, `youtube.yapay_zeka_beyani`, `youtube.cocuklara_ozel`, `youtube.aciklama_zorunlu`

**Write / conditions:** Record now/later/manual in yonetim/ROLLER.md; skipped means later. JSON fields are metadata defaults, not credentials or automation switches. Keep their types; discuss playlist/category/tags/times/offset/disclosures only when needed. Confirm disclosures per video. youtube.cocuklara_ozel remains null until decided; the uploader requires the owner's explicit true/false choice. OAuth needs approved scopes from KURULUM.md; do not upload the sample.

### 14 — Optional tools · Optional

**Question:** Do you want daily YouTube analytics or agent-post communication? Both can wait until after the sample.

**Why:** These are optional additions.

**Example:** Later; first the sample.

**Existing JSON keys:** None; use management documents.

**Write / conditions:** Record choices in yonetim/ROLLER.md; skipped means off. Analytics needs OAuth and an approved schedule; the script does not schedule itself. Agent-post is separate: verify existing setup, use unique identities and one local watcher, and never call a model for an empty inbox. Do not invent an installer.

## H. Machine

### 15 — Machine and usage limits · Required checks; usage preferences optional

**Question:** I will check tools and disk space locally. Are there account, quota or work limits you want me to follow?

**Why:** This keeps the trial small and identifies missing tools.

**Example:** One job at a time; a silent sample first.

**Existing JSON keys:** `chrome`

**Write / conditions:** Record observed OS, architecture, versions, free space, check time and agreed limits in yonetim/ROLLER.md. Use kanal.json.chrome for a custom executable or CHROME_YOLU in the process environment / local .env. Existing process variables take precedence over .env. Initial concurrency is one. Unmeasured values stay unknown; do not infer plans or quotas.

## After the interview

Summarize the four files and present a style card. After approval, follow KURULUM.md for the local 10-second sample. Report skipped options and unresolved constraints. Ask about the first real video after the user reviews the sample.
