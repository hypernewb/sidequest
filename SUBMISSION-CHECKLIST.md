# SideQuest submission checklist

Audited 30 October 2026. This is a release checklist, not a claim that an entry has been submitted.

## Deadline and official references

Submit by **31 October 2026 at 11:45 AM Singapore time**, equivalent to 30 October at 11:45 PM EDT or 31 October at 03:45 UTC.

- [Official competition overview and requirements](https://qloo.devpost.com/)
- [Official rules](https://qloo.devpost.com/rules)
- [Schedule](https://qloo.devpost.com/details/dates)
- [Submission portal](https://devpost.com/submit-to/31054-qloo-agent-hackathon/manage/submissions)

The current Agentic competition does not require a demo video. Do not confuse it with the earlier Qloo LLM competition's video requirements. The 2:05 narrated video is an optional supporting asset.

## Required release work, in order

| Requirement | Audit result | Next action |
| --- | --- | --- |
| Working Qloo-powered agentic application | Implemented; prior functional checks documented | Run the final signed-out production walkthrough after access changes. |
| Externally hosted and accessible demo | BLOCKED. Sites reports custom access, not public | Change audience deliberately and verify a new visitor can use the core flow. The overview explicitly excludes private-access-only entries, although the rules mention testing credentials. Follow the stricter public-demo requirement. |
| Public source repository | Public GitHub repository confirmed | Push the reviewed current source. GitHub main is 442d7a7ff9a682a2f016b75dd649f6093d78e666, last pushed 26 October. Local application commit is 04321570645e02ad7791039424986f529d1bb71e, with documentation changes pending. Reconcile branches before pushing; do not force-push blindly. |
| Detectable open-source license | Local MIT text repaired | Provider notes moved to THIRD-PARTY-NOTICES.md. Push and confirm GitHub detects MIT rather than Other. |
| Source, assets and setup instructions | README, code and environment example present | Verify a clean checkout installs, starts and documents required credentials and optional integrations. No credentials in repository or uploaded archives. |
| English feature description | DEVPOST.md rewritten | Paste it into the actual entry fields and confirm every mandatory field there. |
| Eligibility and registration | Not verified | Entrant confirms age, residency, conflicts, team representation and registration. Complete the entry, not only a saved draft. |
| Third-party authorization | Requires review | Confirm Qloo/Fever/source reuse permissions and dependency/asset notices for public distribution. Attribution alone is not permission. |
| Keep demo available for judging | Pending public release | Keep it free and usable through the end of 5 November Eastern time. Avoid disabling credentials or catalog access during judging. |

The rules and schedule give different judging end times on 5 November. Keep the demo online through the later rules time, 11:45 PM Eastern, and preferably until results are settled.

## Final public smoke check

- Open the app signed out in a fresh browser. No owner account or personal OAuth session should be required for the core demo.
- Resolve Nujabes and Iron Maiden separately. Check named evidence, current dates and source links. Do not promise fixed rankings.
- Browse physical and online finds. Verify map fallback, My day, directions, and a newly generated quest.
- Inspect practical notes and original source wording. Use a labelled simulated closure report to check replanning.
- Import an official Japanese announcement, inspect fields against the original, and check an enjoyment rating persists.
- Check mobile layout and provider failure messages. Optional Fever access must not prevent core discovery.

## Supporting assets

Finished local packet: outputs/submission-ready/ . Main video is SideQuest-submission-with-your-voice-1080p.mp4, 125 seconds, 1080p. Silent alternative, scripts, source timing and audio credits are included. The subtitle guide has approximate script timing, not a verified transcription of the recorded voice.

If using the optional video, upload to a host judges can view and paste its URL. A local file is not a public link. Recheck on-screen dates if the demo is reused later.

## What improves the entry without inventing results

The judging criteria are technological implementation, design, potential impact and quality of the idea. Lead with a specific audience and the useful difference Qloo makes. Show contrasting tastes and how they alter recommendations, then a complete path from discovery to a plan. Link evaluation evidence honestly. Do not claim a 35 percent lift, field-tested venue policies, guaranteed three-stop routes, perfect translation or universal live verification.

## File cleanup

78 obsolete video takes, render segments and capture tests were moved into outputs/demo-video/archive/2026-10-30/ . Nothing was deleted. cleanup-manifest.json records original paths, archive paths, sizes and SHA-256 hashes. The current source takes, edit scripts and audio stems remain in outputs/demo-video/ so the final cut can be reproduced. Nine final delivery assets were copied to outputs/submission-ready/ and checked byte-for-byte using SHA-256.

Source code, provider credentials, dependencies, databases, managed attachments, other projects and research/evaluation evidence were left in place. This cleanup covers SideQuest, not the user's whole computer.
