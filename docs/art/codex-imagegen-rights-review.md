# Rights review: Codex built-in ImageGen output in a free public web product

**CatStar issue #50 · Research date: 2026-08-23 · Reviewer: automated research agent (for meetwk0916)**

This is a terms-of-service research record, not legal advice. All citations name the
source URL, how the text was obtained (reliability tier), and the retrieval date
(2026-08-23 unless stated otherwise).

## Reliability tiers used

- **T1 — official page fetched live**: fetched directly from the official host on 2026-08-23.
- **T2 — official content via Internet Archive snapshot**: official page captured by web.archive.org; snapshot timestamp given. Snapshot text may lag the live page; each citation states its capture date.
- **T3 — secondary quote of official text** (used sparingly, never load-bearing alone).

Background: direct HTTP fetches of `openai.com` return 403 from this environment
(matching the observation recorded in `docs/art/rights-chain-checklist.md` §6 on
2026-08-09), so openai.com pages below are T2 via Wayback. `learn.chatgpt.com`,
`developers.openai.com`, and their `.md` endpoints are official OpenAI hosts that
fetch cleanly (T1).

---

## 1. Bottom line

**Recommendation: option (a). Completing CatStar's existing records is sufficient
for a free, publicly distributed web product; a clean-source fallback for cat
assets is not required on rights grounds.** Two honesty conditions ride along:

1. **Do not present the art as human-made.** The consumer Terms of Use prohibit
   "[r]epresenting that Output was human-generated when it was not"
   ([Terms of Use](https://openai.com/policies/terms-of-use/), T2, archived
   2026-08-21). Keep an accurate "art generated with AI" statement in the public
   product (e.g., about/credits page).
2. **Review before shipping.** CatStar has recorded scoped and historical human
   review rounds, but its separate sixty-combination first-release matrix is
   still open (Sharing & Publication Policy expects manual review before
   sharing; see §5).

The immutable terms snapshot is now archived in-repo and referenced by the
ledger rows. The remaining gates are procedural: finish the sixty-combination
review, receive and intake the orange-tabby production source, and close the
project-wide public rights gate (Issues #56/#60/#61).

## 2. Which regime governs images generated inside a Codex agent session

Built-in ImageGen inside Codex runs on the signed-in user's **ChatGPT account and
plan limits**, not on API billing:

> "Built-in image generation uses `gpt-image-2` and counts toward your general
> Codex usage limits. […] For larger batches, set `OPENAI_API_KEY` in your
> environment and ask ChatGPT to generate images through the API so API pricing
> applies."

— [learn.chatgpt.com/docs/image-generation](https://learn.chatgpt.com/docs/image-generation.md),
official ChatGPT/Codex documentation, **T1**, retrieved 2026-08-23 (same sentence
present in Wayback captures of 2026-08-12 and 2026-08-14, T2).

> "Image generation counts toward the same general usage limits as local messages
> and cloud chats. […] Image generation isn't available on the Free plan. When you
> use Codex with an API key, API pricing applies to image generation instead of
> included ChatGPT usage limits."

— [learn.chatgpt.com/docs/pricing](https://learn.chatgpt.com/docs/pricing.md),
**T1**, retrieved 2026-08-23. Its availability matrix lists "Image generation and
editing" as available on Plus / Pro / Business / Enterprise plans (and via API).

> "You can also generate and edit images in Codex."

— [help.openai.com/en/articles/11084440-images-in-chatgpt](https://help.openai.com/en/articles/11084440-images-in-chatgpt),
**T2**, archived 2026-08-13.

**Conclusion:** an individual generating images inside Codex sessions is using a
ChatGPT-plan feature, so the **consumer Terms of Use regime** governs. The
API/developer-platform regime (OpenAI Services Agreement) would govern only the
explicit API-key path or Business/Enterprise seats. Where they diverge, both grant
the same output ownership (§3), so the practical answer for CatStar does not turn
on the choice.

### Divergence points between the three regimes

| Aspect | Consumer ChatGPT/Codex (Terms of Use) | API / Business (OpenAI Services Agreement, eff. 2026-01-01) |
| --- | --- | --- |
| Scope | "your use of ChatGPT, DALL·E, and OpenAI's other services for individuals" (T2, archived 2026-08-21) | "only applies to use of OpenAI's APIs, ChatGPT Enterprise, ChatGPT Business […] and other services for customers who are businesses and developers, and does not apply to OpenAI services used by consumers or individuals" (T2, archived 2026-08-21) |
| Output ownership | "you (a) retain your ownership rights in Input and (b) own the Output. We hereby assign to you all our right, title, and interest, if any, in and to Output." (§Ownership of content, T2 2026-08-21) | §4.1: same grant to Customer (T2 2026-08-21) |
| Output IP indemnity | none for consumers | §1 API and §3(b) Enterprise/Business indemnify Customer's use/distribution of Output against third-party IP claims, with carve-outs (T2, archived 2026-08-20) |
| Feature carve-outs | Voice Output: "non-commercial use only", excluded from rights assignment; code output may carry third-party/open-source licenses (Service Terms §4, T2 2026-08-20). Images carry **no** such carve-out | same Service Terms text applies |

The Service Terms bridge both regimes ("Capitalized terms not defined here will
have the meanings in the Terms of Use, the OpenAI Services Agreement, or other
agreement…"), updated 2026-06-12 (T2, archived 2026-08-20).

## 3. Output ownership

Consumer Terms of Use (T2, archived 2026-08-21; the es-US variant the repo cites,
effective January 1, 2026, carries the identical clause — T2, archived 2026-02-10):

> "Your content. You may provide input to the Services ("Input"), and receive
> output from the Services based on the Input ("Output"). Input and Output are
> collectively "Content". […]
> Ownership of content. As between you and OpenAI, and to the extent permitted by
> applicable law, you (a) retain your ownership rights in Input and (b) own the
> Output. We hereby assign to you all our right, title, and interest, if any, in
> and to Output.
> Similarity of content. Due to the nature of our Services and artificial
> intelligence generally, Output may not be unique and other users may receive
> similar output from our Services. Our assignment above does not extend to other
> users' output or any Third Party Output."

Implications for CatStar:

- The project owner holds whatever rights OpenAI had in the generated images,
  expressly assigned; "to the extent permitted by applicable law" preserves local
  law questions (e.g., whether purely AI-generated images attract copyright at
  all — a general-law matter outside these terms, noted in §7).
- The grant is **non-exclusive**: other people could lawfully generate similar
  cats. CatStar's protection is its recorded identity/pipeline, not exclusivity.

## 4. Commercial use

Nothing in the consumer Terms conditions or forbids commercial exploitation of
Output. The prohibitions list targets misuse of the *Services*, not distribution
of owned Output: don't sell/lease the Services, don't "[a]utomatically or
programmatically extract[] data or Output", don't represent Output as
human-generated, don't use Output to train competing models (T2, archived
2026-08-21). OpenAI's help center states it plainly:

> "Subject to the Content Policy and Terms, you own the output you create with
> ChatGPT, including the right to reprint, sell, and merchandise – regardless of
> whether output was generated through a free or paid plan."

— [help.openai.com/en/articles/6783457-what-is-chatgpt](https://help.openai.com/en/articles/6783457-what-is-chatgpt),
**T2**, archived 2026-08-11.

If the Services *are* used commercially, a Business Use addendum inside the same
Terms adds a liability cap, indemnity by businesses, and California governing law;
it does not revoke ownership or add attribution duties (T2, archived 2026-08-21).
A free (unpaid) public web release sits comfortably inside permitted use either
way.

## 5. Attribution and AI-disclosure

- **No OpenAI attribution is required for images:**

  > "**Credit is optional.** You do not need to credit OpenAI for generated
  > images, though you can explain how an asset was made when that context is
  > useful."

  — learn.chatgpt.com/docs/image-generation, **T1**, 2026-08-23; identical text in
  Wayback captures of 2026-08-12 and 2026-08-14 (**T2**).

- The words "attribute/attribution" do not appear in the extracted text of the
  Terms of Use, Services Agreement, Service Terms, or Usage Policies (all T2,
  see source table).
- The incorporated [Sharing & Publication Policy](https://openai.com/policies/sharing-publication-policy/)
  (updated 2022-11-14; listed among the ToU's service-specific terms, T2 archived
  2026-08-12 / 2026-08-21) asks that shared generations be **manually reviewed**
  first, **attributed to your name/company**, and marked as AI-generated "in a way
  no user could reasonably miss".
- The ToU prohibition on representing Output as human-generated (T2 2026-08-21)
  and the images/videos policy page's rule against obscuring that content is
  AI-generated ([creating-images-and-videos-in-line-with-our-policies](https://openai.com/policies/creating-images-and-videos-in-line-with-our-policies/),
  updated 2025-07-22, T2 archived 2025-10-20) reinforce the same expectation.

**Net rule:** attribute the work to yourself, disclose AI involvement honestly,
credit OpenAI only if you want to.

## 6. Model-version disclosure

No clause requires OpenAI to expose the underlying model version per generation,
and no clause makes ownership depend on knowing it. For the record, contemporaneous
official documentation identifies the model during CatStar's generation window
(assets generated 2026-08-08–15):

- Wayback captures of learn.chatgpt.com/docs/image-generation dated **2026-08-12**
  and **2026-08-14** both state "Built-in image generation uses `gpt-image-2`"
  (**T2**). `gpt-image-2` became available "today in the API and in Codex" per
  OpenAI's community announcement of 2026-04-21 (**T3**, secondary).
- Therefore the best-supported record for the ledger rows reading "exact version
  not exposed" is: *"built-in Codex ImageGen; version not exposed per-generation;
  contemporaneous official docs (archived 2026-08-12/14) identify gpt-image-2."*

## 7. Evidence state and residual risk

Completed evidence:

1. The immutable, hashed OpenAI Terms snapshot is archived under
   `docs/art/rights-snapshots/`; supporting Terms, Service Terms, Sharing &
   Publication Policy, and Usage Policies captures are indexed alongside it.
2. Per-asset records already in `docs/art/rights-and-provenance.md`: provider/tool
   name, generation dates, prompts/briefs, transformation lineage, third-party
   non-imitation assertions, human approvals.
3. Applicable Terms-evidence rows reference the archived snapshot, this review,
   and the contemporaneous model-version evidence (§6).

Still required before public release: public copy must state that the art is
AI-generated (honesty condition, §5). The project-wide checklist owns that
closure confirmation.

Residual risks if the model version stays unrecorded (and generally):

- **Low impact on ownership/commercial use**: the ownership grant is
  version-independent; nothing hinges on which GPT Image model served the request.
- **Evidentiary gap only**: if a dispute ever required proving what produced the
  assets, the per-generation version is unrecoverable; contemporaneous docs (§6)
  narrow but do not eliminate this.
- **Non-exclusivity** (ToU Similarity clause): similar outputs may appear elsewhere;
  no protection claimed against them.
- **Copyright uncertainty for purely AI-generated images** is a question of
  applicable law, not of OpenAI's terms (outside this ticket's primary-source
  scope); the assignment clause matters only "to the extent permitted by
  applicable law".
- **No consumer IP indemnity**: the Output-indemnity in the Service Terms runs to
  API/Enterprise/Business customers, not consumers — the owner bears infringement
  exposure personally, mitigated by the recorded non-imitation assertions.
- **Terms drift**: material adverse changes get ≥30 days' notice (ToU Changes
  section); the immutable snapshot fixes the evidence position as of retrieval.

## Source table (all retrieved 2026-08-23)

| # | Source (URL) | Tier / capture | Key content | SHA-256 of archived copy* |
| --- | --- | --- | --- | --- |
| 1 | https://openai.com/policies/terms-of-use/ | T2, Wayback 2026-08-21 | Scope; Content/Ownership/Similarity; prohibitions; Business Use Addendum | `91b508905f4f57373afb42481937eb51ca6fc5c54e94f6cfa1ceec8d944b3887` |
| 2 | https://openai.com/es-US/policies/row-terms-of-use/ | T2, Wayback 2026-02-10 | Same ToU, Effective 2026-01-01 (URL cited by repo) | `55deab9c74c38c8da97f66237218eef9a315747c3ee3802f7d9c1ee116667ac5` |
| 3 | https://openai.com/policies/service-terms/ | T2, Wayback 2026-08-20 (updated 2026-06-12) | §4 Codex/code-output licenses; Voice carve-out; API/Enterprise indemnities | `6c6c2efd15e5265b2a89e1651dc46469fe0f51b545ff145ee4677bce143515ee` |
| 4 | https://openai.com/policies/sharing-publication-policy/ | T2, Wayback 2026-08-12 (updated 2022-11-14) | Review-before-sharing; attribute to yourself; unmissable AI disclosure | `858d77ed320c83de2d036c713394be5693faa0a09ad382e6368468431739bf16` |
| 5 | https://openai.com/policies/business-terms/ | T2, Wayback 2026-08-21 (eff. 2026-01-01) | Services Agreement scope; §4.1 ownership | `0b78f8ac686751ece14a3a7ad5364c8105f99e514eb133451b182456785227e0` |
| 6 | https://openai.com/policies/usage-policies/ | T2, Wayback 2026-08-20 | Acceptable-use bar; enforcement | `68f86bb01794fabc7fd076f83198ba3065ab66ab2930139179cead1b570060d4` |
| 7 | https://openai.com/policies/creating-images-and-videos-in-line-with-our-policies/ | T2, Wayback 2025-10-20 (updated 2025-07-22) | Image/video guardrails; no obscuring AI use | `eb56d5ebe042b31e8c93e38c9663ec3a889b8780c5fdd864141cd6ac88581b8e` |
| 8 | https://help.openai.com/en/articles/6783457-what-is-chatgpt | T2, Wayback 2026-08-11 | "own the output … reprint, sell, and merchandise" | `4250b486a03a47dd77adabcd6d9ada59e12bf7cb1a3bc03e5bbd9ae9b8c57fa7` |
| 9 | https://help.openai.com/en/articles/11084440-images-in-chatgpt | T2, Wayback 2026-08-13 | "generate and edit images in Codex" | `5c567a64329d7896e4b8dc17997f54c3c60d11f5e58281183b9f6ec007676bb4` |
| 10 | https://learn.chatgpt.com/docs/image-generation (.md) | **T1 live** | Built-in ImageGen = gpt-image-2; Codex usage limits; credit optional | `0eedfcaca1d6cb8ed0a39b6e1b0b2dedc06e2f9b9d2bcff5c5dfffa5f6360daa` |
| 11 | https://learn.chatgpt.com/docs/pricing (.md) | **T1 live** | Plan-based limits; API-key path switches regime | `6b4514762047744781bc11e35918e453503b26c507d26818cab0069aadc3e44d` |
| 12 | learn.chatgpt.com/docs/image-generation @ Wayback | T2, 2026-08-12 | Contemporaneous model evidence | `da69fa520148f79bf38488a84f86595530fc85ad7d027fe463ddb4c2f38e34cd` |
| 13 | learn.chatgpt.com/docs/image-generation @ Wayback | T2, 2026-08-14 | Contemporaneous model evidence | `075c3a6fa432eb7491594be4eac4b3290cc9720378db567a2a07cee0138f6633` |
| 14 | https://developers.openai.com/api/docs/guides/image-generation (.md) | **T1 live** | API-regime models: gpt-image-2/1.5/1/1-mini | `cf4df21f01ee0413de266ab01be0eedb89d14645a198687923e15cf23ec40b5b` |
| 15 | community.openai.com "Introducing gpt-image-2 … in the API and Codex" | T3, search snippet | Dates gpt-image-2 availability (~2026-04-21) | n/a |

\* SHA-256 over the archived copies now retained under
`docs/art/rights-snapshots/imagegen-rights-review-sources/`; filenames and
supporting text extractions are indexed there.
