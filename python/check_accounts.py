"""Which X (Twitter) accounts in a list are still active: reads each public
profile once and prints its followers, when it last posted, how many days ago
that was, and the first line of that newest post, then writes every handle to
accounts.csv.

    APIFY_TOKEN=... python check_accounts.py UniofOxford ucl uniofwarwick

Read the newest post as well as the date: an account's last post is often a
goodbye ("we no longer post here") or a pointer to a new handle.
"""
import csv
import os
import re
import sys

from apify_client import ApifyClient

handles = [h.lstrip("@") for h in sys.argv[1:]]
if not handles:
    sys.exit("Give one or more X handles")

client = ApifyClient(os.environ["APIFY_TOKEN"])
run = client.actor("simple.actor/x-profile-posts").call(run_input={"handles": handles, "outputFormat": "profile"})
items = list(client.dataset(run.default_dataset_id).iterate_items())

GOODBYE = re.compile(r"no longer|not using x|new handle|moved to|find us at", re.I)


def tier(d):
    if d is None:
        return "no posts shown"
    return "active" if d <= 30 else "quiet" if d <= 365 else "silent over a year"


# One row per handle: either the account, or an error saying why it could not be read.
rows = []
for a in items:
    if a.get("error"):
        rows.append({"handle": a.get("inputUrl"), "status": a["error"], "note": a.get("errorDescription")})
        continue
    posts = sorted(a.get("posts") or [], key=lambda p: p["timestamp"], reverse=True)
    newest = posts[0] if posts else None
    rows.append({
        "handle": a["userName"],
        "name": a["name"],
        "blueVerified": a["isBlueVerified"],
        "followers": a["followers"],
        "latestPostAt": a["latestPostAt"],
        "daysSinceLatestPost": a["daysSinceLatestPost"],
        "status": tier(a["daysSinceLatestPost"]),
        "goodbye": bool(newest and GOODBYE.search(newest["text"])),
        "note": newest["text"].split("\n")[0][:90] if newest else "",
    })

for r in rows:
    if not r.get("name"):
        print(f"{r['handle']}: {r['status']} ({r['note']})")
        continue
    print(f"@{r['handle']} ({r['name']}{', blue' if r['blueVerified'] else ''}): {r['followers']:,} followers, "
          f"last post {(r['latestPostAt'] or '')[:10]} ({r['daysSinceLatestPost']} days), {r['status']}"
          f"{', GOODBYE POST' if r['goodbye'] else ''}\n    \"{r['note']}\"")

cols = ["handle", "name", "blueVerified", "followers", "latestPostAt", "daysSinceLatestPost", "status", "goodbye", "note"]
with open("accounts.csv", "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=cols)
    w.writeheader()
    w.writerows(rows)
print(f"\nwrote {len(rows)} handles to accounts.csv")
