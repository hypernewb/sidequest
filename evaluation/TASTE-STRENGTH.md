# Interest strength check

Checked on 29 October 2026 against the local Workers preview, live Qloo and the persisted official catalog. This is a functional check, not a human satisfaction benchmark.

## What changed

The primary taste setup accepts a short story or a single cultural name. Explicit English wording suggests a strength, and Qloo resolves the name. The visitor checks both before adding the interest. Existing profiles open on their editable strengths. Stumble opens on one find rather than requiring the comparison game.

Love, Like and Curious have weights 1, 0.65 and 0.4. Not using has weight 0. Avoid has weight -1. Zero and negative weights never enter Qloo as positive interests. Avoid removes named identity and franchise matches, without rejecting shared genres. Explicit strengths override older saved-event signals for the same identity.

Weights survive browser storage, API validation and Qloo metadata hydration. They scale direct and genre scores, personal ranking priority and returned Qloo contributor influence. The fixed genre tier was replaced with a proportional bonus, so a weak interest with an exact genre overlap cannot automatically jump above a favourite with a broader connection. Qloo's own affinity values remain unchanged.

The story reader recognises wording rather than using a language model. It will miss indirect references and nuanced prose. Suggestions remain editable and require confirmation; unknown strengths require an explicit choice. Only cultural name queries go to Qloo, not the original story. Raw writing is not persisted.

## Live results

All three requests returned 270 currently eligible events. The positive requests returned ready Qloo evidence. The disabled/avoid request made zero graph calls and returned no positive signals.

| Input strengths | Observation |
| --- | --- |
| Nujabes Love, Radiohead Curious | Moses Boyd's Songs For Sinners listening party reached third place. Its published jazz connection received the favourite weight. |
| Nujabes Curious, Radiohead Love | The Skaai / Jody Fontaine programme took third place; experimental genre evidence received the favourite weight. |
| Nujabes Not using, Radiohead Avoid | Neither identity appeared among positive graph inputs. Listings without a personal match were labelled wildcard. No named Radiohead event was present in this capture, so exact avoid exclusion is covered by a controlled test instead. |

The leading two events stayed the same across the positive profiles. Both artists have overlapping ambient/electronic/experimental associations in the current metadata. Scores and later ordering change, but this feature does not establish that every recommendation is good or eliminate inventory gaps. [Captured results](taste-strength-live.json) include scores, matching reasons and positive signal weights.

## Verification

- 263 automated tests passed, including actual Workers request validation.
- Controlled examples swap direct recommendation order when their strengths swap, including the single-find selector.
- A weaker exact genre match no longer gets a fixed tier above a favourite broad genre connection.
- Checks cover past love, explicit negation, quoted names, ambiguous strength, duplicate correction, storage and fresh/cached hydration.
- Live browser checks resolved Nujabes and Radiohead, saved different strengths, changed a strength and confirmed the saved labels on Stumble and after reload.
- The phone layout keeps existing interests visible before the optional story form.
