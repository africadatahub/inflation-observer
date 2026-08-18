# Africa Data Hub Inflation Observer

The Africa Data Hub Inflation Observer helps journalists, researchers, and civil society organisations explore consumer price inflation (CPI) in African countries and compare it with neighbouring nations. It is a React app that charts year-on-year percentage change for headline CPI and COICOP categories, using data from the IMF, national statistical agencies, and Africa Data Hub.

- [Production](https://www.africadatahub.org/dashboards/inflation-observer)
- [Staging](https://africadatahub.webflow.io/)
- [Upstream dataset](https://ckan.africadatahub.org/dataset/imf-africa-inflation-database)

## What the dashboard does

The app has two views, chosen from the query string:

- **Country picker** (`/`) — choose a country from the dropdown.
- **Country chart** (`?country=kenya`) — load that country’s monthly series and show a line chart.

On a country page you can:

- Switch between headline CPI and COICOP categories (food, housing, transport, health, and so on).
- Brush the x-axis to focus on a time range.
- Read the latest full-year headline rate (from the bundled annual-rates file), where one is available.
- Download the selected series as CSV, or the chart as a PNG.
- Share the page on Facebook, Twitter/X, or WhatsApp, or copy an iframe embed snippet.

All chart values are **percentage change, year on year**. Coverage runs from **2008-01** to **2025-12**, with data through **2025-10**.

Country URLs use a slug of the name in `src/data/countries.json` (spaces become hyphens). Special cases: `cote-d-ivoire` and `guinea-bissau`.

## Embedding

The dashboard is built to sit inside the Africa Data Hub site (Webflow), not to stand alone.

1. The host page provides a `#adh-embed` container. The React app mounts into `.app` inside that node.
2. `yarn build` scopes every CSS rule under a unique class (currently `unique-oo0kza` in `post-build-script.js`) so Webflow styles do not leak in or out.
3. [embed.js](https://africadatahub.github.io/adh-inflation-observer-seo/embed.js) (also copied in this repo as `embed.js`) runs on the host page. When the URL contains `?country=…`, it rewrites the page title, meta tags, Schema.org dataset markup, and an intro paragraph using the same annual-rate figures.

Visitors can also embed a country view themselves: the **Embed** button generates:

```html
<iframe width="700" height="400" src="{current-url}" frameBorder="0"></iframe>
```

## Data

There are two data layers.

| Layer | What it powers | Source |
| --- | --- | --- |
| Monthly time series | The country chart | `src/data/inflation.json`, compiled into the bundle at build time |
| Annual headline rates | “CPI for full year YYYY was X%”, plus SEO intro copy | Bundled JSON in this repo (also duplicated in `embed.js`) |

**The app makes no network requests for data.** Everything it charts is compiled into the JavaScript bundle. It was previously read from the ADH CKAN Datastore at runtime; see [Migrating off CKAN](#migrating-off-ckan) below.

Chart indicators live in `src/data/settings.json`. The default series is IMF code `PCPI_PC_CP_A_PT` (Consumer Price Index, all items). Other options are the standard COICOP groups.

### Where it lives

- **Monthly series (as shipped):** `src/data/inflation.json`, generated from the CSV snapshot in `src/data/source/combined_imf_database.csv`.
- **Monthly series (authoritative):** the [IMF Africa Inflation Database](https://ckan.africadatahub.org/dataset/imf-africa-inflation-database) resource `56d80035-ba9a-49f8-a670-70be4dd50ce4`, which the snapshot is taken from.
- **Pipeline that builds that dataset:** [adh_inflation_database_v2](https://github.com/africadatahub/adh_inflation_database_v2) (IMF CPI plus scrapes from national statistics offices / central banks).
- **Annual rates in this repo:** `src/data/annual-rates.json` (consumed by the React app) and the same objects inside `embed.js` (consumed on the host page).
- **Country list:** `src/data/countries.json` (ISO-3 + display name).

### File format

**Annual rates** (`src/data/annual-rates.csv` / `.json`) — one row per country:

| Field | Meaning |
| --- | --- |
| `country_name` | Display name |
| `country_code` | ISO-3 (JSON only; the working CSV `annual-rates-edit-csv` also has this column) |
| `2019` … `2022` | Full-year headline CPI, percent. Empty string or `#N/A` when missing |
| `last_full_year` | Latest year with a usable annual figure |
| `Extra_notes` | Optional caveat shown under the headline rate |

**Monthly series** (`src/data/inflation.json`) — columnar, so every country shares one date axis:

```json
{
  "dates":      ["2008-01-31", "2008-02-29", "..."],
  "indicators": ["PCPIA_PC_CP_A_PT", "..."],
  "countries":  { "KEN": [[4.53, null, "..."], "..."] }
}
```

`countries[iso]` is an indicator × date grid in `indicators` order, and every country gets a full grid — missing months are `null`. `Country.jsx` expands one country's grid into the `[{ date, INDICATOR_CODE: value }]` rows the chart consumes.

**Snapshot CSV** (`src/data/source/combined_imf_database.csv`) — the pipeline output, one row per country × indicator. Identifier fields include `indicator_code` and `Geography` (ISO-3); remaining columns are month-end values. CKAN prefixes those with `unsafe_` on ingest because they start with a digit, and the generator accepts either spelling. **The columns are not in chronological order** — the generator sorts them.

**Country list** (`src/data/countries.json`):

```json
{ "iso_code": "KEN", "location": "Kenya" }
```

### Regenerating the data

Monthly data is generated from the CSV snapshot:

1. Replace `src/data/source/combined_imf_database.csv` with the latest `*_combined_imf_database.csv` from the [inflation-database pipeline](https://github.com/africadatahub/adh_inflation_database_v2) (`outputs/ckan/`).
2. Run the generator:

    ```
    yarn data:build
    ```

3. Commit both the CSV and the regenerated `src/data/inflation.json`, then rebuild and redeploy — the data ships inside the bundle, so a data change needs a new build.

The generator prints the country/indicator/month counts and the date range; check them against the CSV before committing.

Annual rates are static. To refresh them:

1. Update `src/data/annual-rates.csv` (or `src/data/annual-rates-edit-csv`, which includes `country_code`).
2. Convert that table to `src/data/annual-rates.json` (same objects: year keys, `country_name`, `country_code`, `last_full_year`, `Extra_notes`). There is no conversion script in this repo.
3. Copy the same array into the `country_inflation_data` variable in `embed.js` (and into the SEO copy of that file if it is hosted separately).
4. Rebuild and redeploy so the host page and the iframe stay in sync.

If you add or rename a country, update `src/data/countries.json` as well. Slugs are derived from `location`.

### Coverage caveats

- Countries are not required to report to the IMF every month. ADH fills gaps from national releases, but some series still end earlier than others.
- The bundled monthly series covers **2008-01 to 2025-12**, with the last populated month at **2025-10**. 74% of the country × indicator × month grid is populated; the rest are genuine gaps.
- Bundled annual rates still run through **2022**, three years behind the chart above them. Several countries stop earlier (for example Eswatini 2019, Seychelles 2020; Angola, Cabo Verde, Ethiopia, Mali, and Nigeria 2021).
- Comoros, the DRC, Liberia, and Libya have `#N/A` for every bundled annual year, so the headline-rate sentence is omitted on those pages rather than printing `NaN%`.
- Eritrea and Saint Helena appear in the country picker but have no annual-rate row **and no monthly series** — those pages show a "no data" message.
- South Africa: Stats SA often publishes an urban CPI; this dataset uses **national** CPI so countries remain comparable.
- Zimbabwe: dual-currency period; the bundled note is for prices in Zimbabwe dollars.
- Malawi 2022 can be hard to compare year-on-year after a December 2021 CPI rebase. See the [Inflation Observer about page](https://www.africadatahub.org/dashboards/inflation-observer).
- Reuse is allowed with credit to the **IMF** and **Africa Data Hub**.

Questions or corrections: [info@africadatahub.org](mailto:info@africadatahub.org).

### Migrating off CKAN

The country page used to fetch its series from the ADH CKAN Datastore on every page load:

```
GET https://ckan.africadatahub.org/api/action/datastore_search?q={ISO3}&resource_id=56d80035-…
```

That was the app's only runtime data request. It now reads `src/data/inflation.json`, compiled into the bundle. The whole dataset — 53 countries, 13 indicators, 216 months — is 212 KB gzipped, less than the JavaScript that renders it, so there was no query worth serving over a network.

The two paths were checked against each other before the switch: replaying the old CKAN pivot against the live API and diffing it cell by cell gave **16,848 identical values across six countries**, same dates, same order, no rounding loss.

The cost, measured by building twice against the same dependency tree:

| Bundle | Raw | Gzipped |
| --- | --- | --- |
| Without the dataset | 1.34 MB | 362 KB |
| With the dataset | 2.10 MB | 567 KB |
| **Difference** | **+762 KB** | **+205 KB** |

In exchange there is no API key, no CORS surface, no CDN dependency, and no runtime failure mode. The trade-off is that a data refresh is now a rebuild and redeploy rather than a CKAN re-upload.

What went away with it:

- The `Authorization: process.env.CKAN` header, and the need for a `.env` at build time. **The key that was previously inlined into `dist/inflation-observer.js` on `master` is committed in public git history and should be rotated**, independently of this change.
- `settings.json`'s `api` block, and the `unsafe_YYYY_MM_DD` column-name workaround.
- `src/components/DataExplorer.jsx` and `src/pages/DataExplorer.jsx`, which also called CKAN but were never mounted and imported files that no longer exist.

Fixed along the way, all of it reachable from the code path being replaced:

- **Eritrea and Saint Helena** are in the picker but have no series — 55 countries in `countries.json` against 53 in the data. They used to throw inside the fetch and render an empty card; they now show a "no data" message.
- **Comoros, the DRC, Liberia and Libya** have annual-rates rows where every year is `#N/A` and `last_full_year` is empty, which rendered as `for the full year  was NaN%`. The sentence is omitted when there is no usable figure.
- The Schema.org `contentUrl` and the **Source** link both pointed at CKAN resource `626c5497-…`, which 404s — it no longer exists in the dataset.

Still pointing at CKAN, and needing a permanent home before the portal is retired:

- The **Source** link in `settings.json` (now the dataset landing page rather than the deleted resource).
- `includedInDataCatalog` in the Schema.org block in `Country.jsx` and `embed.js`.

## Local development

1. Install dependencies:

    ```
    yarn
    ```

2. Start Parcel:

    ```
    yarn dev
    ```

Then open a country URL such as `http://localhost:1234/?country=kenya`.

## Project structure

```
├── embed.js                 # Host-page SEO / intro script (country query param)
├── post-build-script.js     # Scopes built CSS under the unique embed class
├── netlify.toml             # SPA fallback to index.html
├── src/
│   ├── index.html           # #adh-embed mount + SEO embed.js
│   ├── index.js             # React bootstrap
│   ├── App.jsx              # Home vs Country from ?country=
│   ├── app.scss
│   ├── pages/
│   │   ├── Home.jsx         # Country picker
│   │   └── Country.jsx      # Chart, downloads, metadata
│   ├── components/
│   │   ├── CountrySelect.jsx
│   │   └── SocialMedia.jsx  # Share + iframe snippet
│   ├── data/
│   │   ├── settings.json    # Indicators and copy
│   │   ├── countries.json
│   │   ├── inflation.json   # Generated monthly series (yarn data:build)
│   │   ├── annual-rates.json
│   │   ├── annual-rates.csv
│   │   └── source/          # CSV snapshot the generator reads
│   └── utils/func.js        # location ↔ URL slug
├── scripts/
│   └── build-inflation-data.js   # CSV snapshot → src/data/inflation.json
└── dist/                    # Built CSS/JS served from GitHub Pages
```

## Hosting & deployment

The live widget is the Parcel build on **GitHub Pages** (`iframe` branch, `dist/`), embedded by **Webflow** on africadatahub.org. `netlify.toml` is present for an optional SPA host.

Built assets are renamed before publish:

| Environment | Files |
| --- | --- |
| Staging (`africadatahub.webflow.io` / `africadata.webflow.io`) | `inflation-observer.dev.css`, `inflation-observer.dev.js` |
| Production (GitHub Pages → africadatahub.org) | `inflation-observer.css`, `inflation-observer.js` |

Deploy steps:

1. Open a PR that merges `src` changes into the `iframe` branch.
2. Confirm the app on that branch with `yarn dev`. **A data-only change still needs this full cycle** — `src/data/inflation.json` is compiled into the bundle, so nothing reaches the live widget until a new build is published.
3. Stop the dev server. Delete `dist/` contents and `.parcel-cache` if a previous build is stale.
4. Run `yarn build`. The post-build script prints the scoped class (for example `unique-oo0kza`) and wraps `.app` in that class.
5. Rename or copy the hashed CSS/JS in `dist/` to the staging or production names above, then push so GitHub Pages updates.

`yarn build` copies logo/favicon assets into `dist/`, runs Parcel, then `post-build-script.js` (CSS scoping and rem → px).

## Third-party services

The app itself calls no third-party service at runtime — the data ships in the bundle.

| Service | Role |
| --- | --- |
| IMF CPI database | Historical core of the dataset |
| National statistics offices / central banks | Monthly updates scraped into the dataset |
| [ADH CKAN](https://ckan.africadatahub.org/) | Where the upstream dataset is published; no longer read at runtime |
| GitHub Pages | Hosts `dist/` and the SEO `embed.js` |
| Webflow | Production and staging Africa Data Hub pages that embed the widget |
| Font Awesome kit | Share-button icons on the country page |
| OpenUp | “Powered by” credit on the country page |

Reuse of the data requires attribution to the IMF and Africa Data Hub. The ADH project is supported by the Bill & Melinda Gates Foundation.
