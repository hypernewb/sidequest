# Ranking scorecard, 24 October 2026 JST

Codex performed a desk review. These are agent judgments from saved provider metadata, not human ratings, measured satisfaction or a statistically significant result.

## Twelve fictional profiles

The existing twelve-profile Qloo snapshot is dated 23 October 2026. For each profile, the local model ranked the same ID-sorted pool of five to eight places using names, categories, descriptions and addresses. It received no affinity, popularity or contributor scores. Each condition contributes its top four places. Codex scored each candidate once per profile and reused the scores wherever that candidate appeared in either condition. The evaluator was unblinded.

The Qloo condition includes the app's existing category/diversity ranking rules. It is not raw Qloo affinity in isolation. The baseline model was `bionic qwen3.5-text-9b-nsfw-rp-roleplay-i1`, temperature 0, reasoning off. It ran locally using the user's configured service.

| Condition | Relevance | Novelty | Coherence | Mean of three |
| --- | ---: | ---: | ---: | ---: |
| A: App Qloo ranking | 2.56 | 2.17 | 2.56 | 2.43 |
| B: Local-model metadata ranking | 2.79 | 2.33 | 2.79 | 2.64 |
| Descriptive relative difference | -8.2% | -7.1% | -8.2% | -7.9% |

Scores use the original 1–5 rubric. The summary averages the four candidates within a profile, then the twelve profiles equally. Relative difference is `(A / B) - 1`. Ratios of ordinal ratings are descriptive only. This test provides no support for a claimed 30–40% gain.

The strongest failures are specific. Pokémon Center DX falls below the Qloo top four despite direct Pokémon seeds. A children's play centre enters the comic-cinema shortlist. The familiar-coffee pool mostly contains character and service-themed cafés. Generic venue categories cannot establish a programme or franchise stock. The local model also makes weak choices and cannot recover candidates absent from the restricted pool.

## Original workbook comparison

The original Review tab has one Nujabes/MUJI/Spirited Away profile, eight places per list and a shared 37-place pool. Codex saved its ratings before opening the organizer's method key. A was the local-model metadata ranking. B was Qloo affinity ranking.

| Original condition | Relevance | Novelty | Coherence | Actionability |
| --- | ---: | ---: | ---: | ---: |
| A: Local model | 3.63 | 2.75 | 3.63 | 3.00 |
| B: Qloo affinity | 2.75 | 3.00 | 2.75 | 3.00 |

The agent favoured the direct Ghibli and art/design connections in A. Several cafés in B lacked supplied evidence for the named interests. Actionability remains mixed because dates, admission and current opening status were not verified in that snapshot.

## Scope and next evidence

Both tests use Qloo-derived candidate pools. They test ranking within those pools, not independent retrieval, live event matching, official drop coverage, translation accuracy, route feasibility or a person's real familiarity. Relevance and coherence ratings often coincide because the supplied evidence is sparse. Novelty represents judged unexpectedness that still fits, not observed user familiarity.

The scored workbook preserves the original sheets and adds Twelve samples and Twelve candidates. It contains all 96 row ratings, evidence, reasons and formula-linked means. A temporary rating change confirmed summary recalculation, and an error scan found no formula errors. Provider descriptions remain in the private workbook; the README and pitch use aggregate results only.

Before a quality claim, run an independently rated study with held-out profiles, an unconstrained baseline retrieval condition and users' save/reject reasons. Re-run after ranking changes rather than reusing these scores for the new implementation.
