# Runs behind the post

All on 2026-11-07 (UTC), x-profile-posts build 0.1.12 (latest), default proxy,
`outputFormat: "profile"`, from the account `simple.actor` (the owner's), so
nothing was billed. The caller price uses the listing's price read the same
day: $0.0005 per `account-read`.

| Run | Input | Result | Time | Platform usage | Caller price |
|---|---|---|---|---|---|
| `jthfFYeMhCxQ02Tjr` | 24 handles: OxfordUni, Cambridge_Uni, imperialcollege, ucl, LSEnews, KingsCollegeLon, EdinburghUni, UofGlasgow, OfficialUoM, BristolUni, warwickuni, unibirmingham, UniversityLeeds, sheffielduni, unisouthampton, UniofNottingham, UniofNewcastle, LivUni, cardiffuni, QUBelfast, durham_uni, UniOfYork, QMUL, UniofExeter | 23 read, `EdinburghUni` a `protected` row | 31s | $0.0007 | $0.0115 |
| `ZlftqaVHo9PGNUNws` | UniofOxford, uniofwarwick (the right handles) | 2 read | 6s | $0.0002 | $0.001 |
| `gYzkCuC8fAhx7p3JI` | `node/check-accounts.mjs warwickuni QUBelfast` | 2 read | 5s | $0.0001 | $0.001 |
| `0ArrbQ4CrXOXL88Kl` | `python/check_accounts.py UniofNottingham EdinburghUni` | 1 read, `EdinburghUni` protected | 4s | $0.0001 | $0.0005 |

The post's numbers come from the first two runs, with `oxforduni` and
`warwickuni` replaced by the right handles from the second.

Regenerate the numbers and images: save the first two runs with
`marketing/tools/apify_api.py run` to /tmp/x-profile-posts-run.json and
/tmp/x-profile-posts-run2.json, then `python3 analyse.py` and
`python3 images/make.py`.
