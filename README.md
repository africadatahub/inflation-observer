# Africa Data Hub Inflation Observer

The Africa Data Hub Inflation Observer helps journalists, researchers, and civil society organisations explore consumer price inflation (CPI) in African countries and compare it with neighbouring nations. It is a React app that charts year-on-year percentage change for headline CPI and COICOP categories, using data from the IMF, national statistical agencies, and Africa Data Hub.

- [Production](https://www.africadatahub.org/dashboards/inflation-observer)
- [Staging](https://africadatahub.webflow.io/)
- [CKAN dataset](https://ckan.africadatahub.org/dataset/imf-africa-inflation-database)

## What the dashboard does

The app has two views, chosen from the query string:

- **Country picker** (`/`) — choose a country from the dropdown.
- **Country chart** (`?country=kenya`) — load that country’s monthly series and show a line chart.

On a country page you can:

- Switch between headline CPI and COICOP categories (food, housing, transport, health, and so on).
- Brush the x-axis to focus on a time range.
- Read the latest full-year headline rate (from the bundled annual-rates file).
- Download the selected series as CSV, or the chart as a PNG.
- Share the page on Facebook, Twitter/X, or WhatsApp, or copy an iframe embed snippet.

All chart values are **percentage change, year on year**. Historical coverage starts in 2008.

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
| Monthly time series | The country chart | CKAN Datastore API, live at runtime |
| Annual headline rates | “CPI for full year YYYY was X%”, plus SEO intro copy | Bundled JSON in this repo (also duplicated in `embed.js`) |

Chart indicators and the CKAN resource id live in `src/data/settings.json`. The default series is IMF code `PCPI_PC_CP_A_PT` (Consumer Price Index, all items). Other options are the standard COICOP groups.

The country page queries CKAN with the country’s ISO-3 code, then pivots rows (one per indicator) into date records. Date columns in the datastore look like `unsafe_2008_01_31` and are turned into `2008-01-31`.

### Where it lives

- **Monthly series (authoritative):** [IMF Africa Inflation Database](https://ckan.africadatahub.org/dataset/imf-africa-inflation-database) on the ADH CKAN portal. The app reads resource `56d80035-ba9a-49f8-a670-70be4dd50ce4` via `datastore_search`. The public CSV dump linked from the UI is resource `626c5497-a3d2-461f-9f51-8485d94e36b3`.
- **Pipeline that builds that CKAN dataset:** [adh_inflation_database_v2](https://github.com/africadatahub/adh_inflation_database_v2) (IMF CPI plus scrapes from national statistics offices / central banks).
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

**CKAN monthly resource** — one row per country × indicator. Identifier fields include `indicator_code` and the country ISO-3; remaining keys are `unsafe_YYYY_MM_DD` month-end values.

**Country list** (`src/data/countries.json`):

```json
{ "iso_code": "KEN", "location": "Kenya" }
```

### Regenerating the data

Monthly data is not generated in this repo. Update the CKAN resource through the inflation-database pipeline; this app will pick up the new series on the next page load.

Annual rates are static. To refresh them:

1. Update `src/data/annual-rates.csv` (or `src/data/annual-rates-edit-csv`, which includes `country_code`).
2. Convert that table to `src/data/annual-rates.json` (same objects: year keys, `country_name`, `country_code`, `last_full_year`, `Extra_notes`). There is no conversion script in this repo.
3. Copy the same array into the `country_inflation_data` variable in `embed.js` (and into the SEO copy of that file if it is hosted separately).
4. Rebuild and redeploy so the host page and the iframe stay in sync.

If you add or rename a country, update `src/data/countries.json` as well. Slugs are derived from `location`.

### Coverage caveats

- Countries are not required to report to the IMF every month. ADH fills gaps from national releases, but some series still end earlier than others.
- Bundled annual rates currently run through **2022**. Several countries stop earlier (for example Eswatini 2019, Seychelles 2020; Angola, Cabo Verde, Ethiopia, Mali, and Nigeria 2021).
- Comoros, the DRC, Liberia, and Libya have `#N/A` for every bundled annual year.
- Eritrea and Saint Helena appear in the country picker but have no annual-rate row.
- South Africa: Stats SA often publishes an urban CPI; this dataset uses **national** CPI so countries remain comparable.
- Zimbabwe: dual-currency period; the bundled note is for prices in Zimbabwe dollars.
- Malawi 2022 can be hard to compare year-on-year after a December 2021 CPI rebase. See the [Inflation Observer about page](https://www.africadatahub.org/dashboards/inflation-observer).
- Reuse is allowed with credit to the **IMF** and **Africa Data Hub**.

Questions or corrections: [info@africadatahub.org](mailto:info@africadatahub.org).

## Local development

1. Install dependencies:

    ```
    yarn
    ```

2. Add a `.env` in the project root with a valid CKAN API key. The country page reads `process.env.CKAN`:

    ```
    CKAN=<provided-key-here>
    ```

3. Start Parcel:

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
│   │   ├── settings.json    # Indicators, CKAN URL / resource ids, copy
│   │   ├── countries.json
│   │   ├── annual-rates.json
│   │   └── annual-rates.csv
│   └── utils/func.js        # location ↔ URL slug
└── dist/                    # Built CSS/JS served from GitHub Pages
```

`src/pages/DataExplorer.jsx` and `src/components/DataExplorer.jsx` are leftover and are not mounted.

## Hosting & deployment

The live widget is the Parcel build on **GitHub Pages** (`iframe` branch, `dist/`), embedded by **Webflow** on africadatahub.org. `netlify.toml` is present for an optional SPA host.

Built assets are renamed before publish:

| Environment | Files |
| --- | --- |
| Staging (`africadatahub.webflow.io` / `africadata.webflow.io`) | `inflation-observer.dev.css`, `inflation-observer.dev.js` |
| Production (GitHub Pages → africadatahub.org) | `inflation-observer.css`, `inflation-observer.js` |

Deploy steps:

1. Open a PR that merges `src` changes into the `iframe` branch.
2. Confirm the app on that branch with `yarn dev`.
3. Stop the dev server. Delete `dist/` contents and `.parcel-cache` if a previous build is stale.
4. Run `yarn build`. The post-build script prints the scoped class (for example `unique-oo0kza`) and wraps `.app` in that class.
5. Rename or copy the hashed CSS/JS in `dist/` to the staging or production names above, then push so GitHub Pages updates.

`yarn build` copies logo/favicon assets into `dist/`, runs Parcel, then `post-build-script.js` (CSS scoping and rem → px).

## Third-party services

| Service | Role |
| --- | --- |
| [ADH CKAN](https://ckan.africadatahub.org/) | Monthly inflation Datastore API |
| IMF CPI database | Historical core of the CKAN dataset |
| National statistics offices / central banks | Monthly updates scraped into the CKAN dataset |
| GitHub Pages | Hosts `dist/` and the SEO `embed.js` |
| Webflow | Production and staging Africa Data Hub pages that embed the widget |
| Font Awesome kit | Share-button icons on the country page |
| OpenUp | “Powered by” credit on the country page |

Reuse of the data requires attribution to the IMF and Africa Data Hub. The ADH project is supported by the Bill & Melinda Gates Foundation.
