# Advanced Assistant Responses integration repair

## Cause and contract

The Advanced model is `@cf/openai/gpt-oss-120b`. Cloudflare documents Responses format for this model, including the Workers AI binding, while Standard Qwen retains the messages/response contract.

Sources checked 2026-10-28:
- https://developers.cloudflare.com/changelog/post/2025-08-05-openai-open-models/
- https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/

The previous adapter sent `messages`/`max_tokens` and required a string `response.response`. The regression test supplied a completed Responses object with reasoning, two Hungarian `output_text` chunks and `input_tokens`/`output_tokens`. It failed with `documented response rejected: missing-response` before the production edit.

Advanced now sends `input`, `max_output_tokens: 1024`, `reasoning.effort: low`, `temperature: 0.2` and `stream: false`. The existing model, output ceiling, cost reservation and 8-credit price remain. Only completed assistant `output_text` is returned. Reasoning is omitted; failed/incomplete, empty, tool and refusal responses are rejected. Oversized output is rejected instead of silently truncated.

Standard keeps its request, response parser, 512-token output ceiling, one-credit price and original admission byte boundary.

## Automated evidence

- Initial regression RED: `output/advanced-responses-red.log`.
- 16 new tests GREEN: `output/advanced-responses-green.log`.
- Real SQLite monthly and top-up reservation/settlement tests: successful Advanced consumes 8, failures return all 8, duplicate settlement has no effect, following Standard consumes 1.
- Existing usage-settlement, weighted economics and dual-model boundary audits PASS.
- Existing `audit:ai-runtime` PASS, including admission ordering, local/distributed release, timeout refund, auth and fail-closed checks.
- Independent branch reviewer found a 33-byte Standard input-boundary regression. Reproduced separately RED, fixed, new boundary test GREEN. No Critical findings; no Important findings deferred.

## Remaining release gates

Full local release check, exact-head Linux check and authenticated staging verification must finish before results are presented for production approval. No production release is authorized by this task. Staging uses API-only deployment without database migrations; temporary branch-policy changes require owner approval and must be removed after testing.
