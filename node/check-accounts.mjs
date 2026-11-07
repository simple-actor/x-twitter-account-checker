// Which X (Twitter) accounts in a list are still active: reads each public
// profile once and prints its followers, when it last posted, how many days
// ago that was, and the first line of that newest post, then writes every
// handle to accounts.csv.
//
//   APIFY_TOKEN=... node check-accounts.mjs UniofOxford ucl uniofwarwick
//
// Read the newest post as well as the date: an account's last post is often a
// goodbye ("we no longer post here") or a pointer to a new handle.
import { writeFileSync } from 'node:fs';
import { ApifyClient } from 'apify-client';

const handles = process.argv.slice(2).map((h) => h.replace(/^@/, ''));
if (!handles.length) throw new Error('Give one or more X handles');

const client = new ApifyClient({ token: process.env.APIFY_TOKEN });
const run = await client.actor('simple.actor/x-profile-posts').call({ handles, outputFormat: 'profile' });
const { items } = await client.dataset(run.defaultDatasetId).listItems();

const GOODBYE = /no longer|not using x|new handle|moved to|find us at/i;
const tier = (d) => (d == null ? 'no posts shown' : d <= 30 ? 'active' : d <= 365 ? 'quiet' : 'silent over a year');

// One row per handle: either the account, or an error saying why it could not be read.
const rows = items.map((a) => {
    if (a.error) return { handle: a.inputUrl, status: a.error, note: a.errorDescription };
    const newest = [...(a.posts ?? [])].sort((x, y) => y.timestamp - x.timestamp)[0];
    const firstLine = newest?.text.split('\n')[0].slice(0, 90) ?? '';
    return {
        handle: a.userName,
        name: a.name,
        blueVerified: a.isBlueVerified,
        followers: a.followers,
        latestPostAt: a.latestPostAt,
        daysSinceLatestPost: a.daysSinceLatestPost,
        status: tier(a.daysSinceLatestPost),
        goodbye: newest ? GOODBYE.test(newest.text) : false,
        note: firstLine,
    };
});

for (const r of rows) {
    if (!r.name) { console.log(`${r.handle}: ${r.status} (${r.note})`); continue; }
    console.log(`@${r.handle} (${r.name}${r.blueVerified ? ', blue' : ''}): ${r.followers.toLocaleString('en-US')} followers, `
        + `last post ${r.latestPostAt?.slice(0, 10)} (${r.daysSinceLatestPost} days), ${r.status}`
        + `${r.goodbye ? ', GOODBYE POST' : ''}\n    "${r.note}"`);
}

const cols = ['handle', 'name', 'blueVerified', 'followers', 'latestPostAt', 'daysSinceLatestPost', 'status', 'goodbye', 'note'];
const cell = (x) => (x == null ? '' : `"${String(x).replace(/"/g, '""')}"`);
writeFileSync('accounts.csv', [cols.join(','), ...rows.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\n') + '\n');
console.log(`\nwrote ${rows.length} handles to accounts.csv`);
