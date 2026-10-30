# SideQuest submission checklist

Updated after the public release on 30 October 2026. Public access, the GitHub release and signed-out functional checks are complete. This is not a claim that the Devpost entry has been submitted. See evaluation/PUBLIC-RELEASE.md.

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
| Working Qloo-powered agentic application | PASSED. 292 tests, TypeScript, build and public walkthrough | Review evaluation/PUBLIC-RELEASE.md for evidence and limits. |
| Externally hosted and accessible demo | PASSED. Sites access is public | Fresh Chrome contexts and anonymous HTTP calls exercised the core features without an owner login or service credential. |
| Public source repository | PASSED. Current application release pushed | Application commit 55533a6c9501b51e9787bbf32b1c8a22ab87d61e is public. Release documentation follows in GitHub. No force push was used. |
| Detectable open-source license | PASSED. GitHub recognizes MIT | Provider notices are retained separately in THIRD-PARTY-NOTICES.md. |
| Source, assets and setup instructions | README, code and environment example present | Verify a clean checkout installs, starts and documents required credentials and optional integrations. No credentials in repository or uploaded archives. |
| English feature description | DEVPOST.md rewritten | Paste it into the actual entry fields and confirm every mandatory field there. |
| Eligibility and registration | Not verified | Entrant confirms age, residency, conflicts, team representation and registration. Complete the entry, not only a saved draft. |
| Third-party authorization | Requires review | Confirm Qloo/Fever/source reuse permissions and dependency/asset notices for public distribution. Attribution alone is not permission. |
| Keep demo available for judging | Public release is live | Keep it free and usable through the end of 5 November Eastern time. Avoid disabling credentials or catalog access during judging. |

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

## Remaining operational limits

The signed-out Japanese import retained its original and extracted times and pricing, but translation was partial and the structured venue field remained missing. The UI says so. The cloud catalog updater needs the maintenance header described in .openai/catalog-maintenance.md; authorized maintenance passed, but updating the existing task was blocked by an unavailable automation-management connection. Do not claim unattended refresh is verified after this release. Clean-checkout installation was not repeated.
