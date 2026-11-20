# Frame Parade

A video studio run by AI agents. Set up with one prompt.

[Türkçe](README.tr.md)

**Status: clean-folder setup verified on Windows, 20 November 2026; macOS and Linux have not been tested.** The trial produced a local silent sample with Node.js, Git and Chrome already installed. Missing-tool installation was not part of that trial.

## What is it for?

The kit aims to organize your channel's scripts, visuals, audio and production decisions in one project. Claude Code asks about your channel and how you want to work, creates a video identity and role structure from your answers, then prepares a short sample featuring your channel name.

Initial scope:

- A script → scenes → animation → review workflow for lessons, explainers and project videos.
- Landscape 16:9 and portrait 9:16 templates, with basic titles, cards, counters, arrows and buttons.
- Role templates separating writing, design/production and review responsibilities.
- Optional narration, YouTube upload and analytics tools.

You bring your own scripts, footage and identity. The distributed kit includes no configured channel, personal lesson archive, voice account or API keys.

## Requirements

| Tool | Purpose |
|---|---|
| [Claude Code](https://code.claude.com/docs/en/setup) with working access | Guided setup and work inside the project. |
| Node.js 20+ and npm | Required by package.json; see KURULUM.md for checks. |
| ffmpeg-static (installed with npm dependencies) | Supplies ffmpeg for rendering. ffprobe is separate and not required for the silent sample. |
| Google Chrome or a compatible browser detected by the kit | Headless animation rendering without desktop control; the reported trial used Chrome. |
| Git | Downloading the repository in the single-prompt workflow. |
| Internet access and free disk space | Repository/dependency downloads and local output files. The setup check reports requirements. |

Node.js is required for this kit's tools; this does not mean every Claude Code installation method requires Node.js. Use the official guide linked above for Claude Code's own installation requirements.

**Optional:** ElevenLabs for synthetic narration; the YouTube API with user authorization for account uploads/analytics; a second model for writing; agent-post for communication between models. A silent local sample is the target without these services. Claude Code and optional services use your own accounts and quotas; the kit does not provide them.

## Set up with one prompt

Paid client work is outside this license; see [LICENSE, section 4](LICENSE).

1. Create an empty project folder and open Claude Code there.
2. Open the Frame Parade repository linked below and paste the setup text into Claude Code. If the repository is unavailable, stop and check access; do not substitute another download.
3. Answer one topic at a time. You can skip optional choices and change the proposed style.
4. Review the 10-second portrait sample featuring your channel name. It will be silent if no audio is ready.

```text
Set up Frame Parade from https://github.com/nihatbirbudak/frame-parade in this empty project folder.

Assume I am new to AI. Explain each step simply, ask me to do one thing at a time, and explain technical terms when first used. Paid client work is outside the license; see LICENSE section 4.

1. If the destination is not empty or the repository is inaccessible, stop and explain. Do not delete or overwrite files or choose another repository. If Git is missing, explain how to install it and continue once it is available. Download the repository here, then read KURULUM.md, CLAUDE.md, KURALLAR.md and LICENSE at the repository root. Do not guess around missing instructions or conflicts.
2. Check the operating system, free disk space and Node.js 20+/npm, Chrome or a compatible browser, and Git. Follow the guide to install and verify the package-provided ffmpeg; check ffprobe only if a later chosen workflow needs it. Show what is missing and what would be installed. Ask for my approval before installing system software or running package installation scripts. Use existing commands from the guide; do not invent commands.
3. Follow KURULUM.md and choose kurulum/questions.md for English or kurulum/sorular.md for Turkish; use the user's language, one topic per message. Do not ask again for information I have already provided. I may skip optional choices; state any proposed defaults. Save existing runtime settings in kanal.json; save identity, references and roles in yonetim/VIDEO-KIMLIGI.md, yonetim/referanslar.md and yonetim/ROLLER.md. Follow the actual schema; do not invent JSON fields. Do not modify my source assets.
4. Review the references I provide where accessible and identify anything you cannot inspect. Present a short style card for my approval. Never request or print keys or tokens in chat or logs. Show the .env fields; I will enter the values locally. Keep secret files out of Git. Do not control my mouse or keyboard or record my desktop; render headlessly.
5. Use the approved style to produce a local 10-second, 9:16 sample featuring my channel name, and run the guide's quality checks. If no audio is ready, make a silent text sample. Before a paid voice call or other spending, ask me to approve its scope and estimated usage. If no actual output is produced, report the error and remaining step instead of claiming success.
6. Do not upload or publish during setup. Configure the YouTube API, daily analytics or agent-post only if I choose them, following the guide. Obtain approval for the concrete account permissions and scheduled task before enabling them. Use a separate mailbox identity for each task; do not duplicate watchers or call a model to check an empty inbox. Every later upload and publication also needs my explicit approval; --yes is not approval by itself.

Finish with what was set up, what was skipped, and the sample video's path. Wait for me to review it, then ask: “What should your first video be about?”
```

## Files created during setup

| File | Contents |
|---|---|
| `kanal.json` | Existing runtime identity, visual/audio parameters, YouTube metadata defaults and paths. |
| `yonetim/VIDEO-KIMLIGI.md` | The narration and visual style you approve. |
| `yonetim/referanslar.md` | Reference links and the qualities you like. |
| `yonetim/ROLLER.md` | Writing, production, review and publishing responsibilities. |

The root guide is [KURULUM.md](KURULUM.md). Setup questions are [English](kurulum/questions.md) and [Turkish](kurulum/sorular.md). Human workflow preferences live in the three yonetim/ documents above; they are not extra JSON switches. Working rules are in [KURALLAR.md](KURALLAR.md) and [CLAUDE.md](CLAUDE.md), with output checks in [KALITE-KAPISI.md](KALITE-KAPISI.md). The guide documents commands read from the current source. The reported clean-folder trial covers Windows with prerequisites present; other systems and missing-tool installation remain untested.

## Safe working rules

- Every upload and publication needs your explicit approval. Connecting the API is not permission to publish. Upload tools are intended to default to a dry run; real submission requires both approval and deliberate use of `--yes`.
- Enter API keys yourself in a local `.env` file. Do not share them in chat or logs. Any required OAuth client/token files stay in the local, Git-excluded location specified by the guide. Secrets never belong in `kanal.json`.
- No mouse or keyboard control and no desktop recording. Rendering runs headlessly.
- System installations, paid service calls and scheduled tasks are explained and submitted for approval first. Source footage stays intact.
- Review the generated text, visuals and audio yourself. Preserve the usage terms for references, music, fonts and other assets.

## Limitations

This early release is intended as a starting point for your own video workflow. It does not claim to work on every computer, support every editing task or achieve a particular view count. Automated checks cannot independently establish factual accuracy, natural speech or design quality.

Choosing Instagram or TikTok does not mean automatic publishing integrations exist for them. The initial target is local output with an optional YouTube connection. [YouTube uploads require account authorization](https://developers.google.com/youtube/v3/docs/videos/insert), and platform requirements apply separately. Daily analytics and agent-post are off by default.

## License

Frame Parade is **source-available** under the [Frame Parade Community Use License 1.0](LICENSE). The English license controls; a [Turkish summary](LISANS-OZET.tr.md) is available.

| Activity | Under this license |
|---|---|
| Use for your own projects, channels and business content | Allowed |
| Monetize your own content through ads, subscriptions or your own courses | Allowed, subject to the commercial client-work restriction |
| Modify your copy and keep private changes private | Allowed |
| Fork, submit a pull request or share a modified version free of charge | Allowed under the same license, with source code and notices |
| Give genuinely free, noncommercial setup or production help | Allowed outside paid engagements, bundles or sales promotions |
| Sell the kit or a derivative, or include it in a paid bundle | Not permitted |
| Offer paid kit hosting, API access, setup, customization or support | Not permitted |
| Produce client content as a paid agency, freelance or other commercial service | Not permitted |
| Remove the kit's license, copyright or attribution notices | Not permitted |

Free sharing must preserve the license and Frame Parade attribution, identify changes and include the covered source code. You may describe and link to a compliant free fork. Indirect charges and paid-package bonuses do not avoid the restrictions.

Your permitted videos and original content remain yours to the extent rights can exist under law. No revenue share or credit in finished videos is required by this license. Editable software templates and code remain subject to the kit's sharing conditions. Paid client production is still prohibited when posted on your own account.

Third-party components and assets retain their own licenses; separately held rights remain unaffected. See [LICENSE](LICENSE) for the complete conditions.

## Contributing

Bug fixes, documentation, translations and workflow improvements are welcome. Fork the repository and submit a focused pull request; see [CONTRIBUTING.md](CONTRIBUTING.md).

Contributions are offered under the same license, with permission for **nihatbirbudak** to use, modify, merge and redistribute them in Frame Parade under that license. Contributors retain ownership; no copyright transfer or separate relicensing permission is requested.
