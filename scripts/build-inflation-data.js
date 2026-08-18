/*
 * Builds src/data/inflation.json from the IMF/ADH combined CSV snapshot.
 *
 * The snapshot in src/data/source/ is the `combined_imf_database.csv` resource
 * produced by https://github.com/africadatahub/adh_inflation_database_v2 — one
 * row per country x indicator, with one column per month-end.
 *
 * Output shape (columnar, so every country shares one date axis):
 *
 *   {
 *     "dates":      ["2008-01-31", ...],          // ascending, month-end
 *     "indicators": ["PCPI_PC_CP_A_PT", ...],     // column order for `series`
 *     "countries":  { "KEN": [[4.53, null, ...], ...] }   // indicator x date
 *   }
 *
 * Run with `yarn data:build` after replacing the CSV snapshot.
 */

const fs = require('fs');
const path = require('path');

const SOURCE = path.join(__dirname, '..', 'src', 'data', 'source', 'combined_imf_database.csv');
const TARGET = path.join(__dirname, '..', 'src', 'data', 'inflation.json');

/*
 * Two spellings of the same file are in circulation, and both are accepted:
 *
 *   Straight from the pipeline   `Indicator.Code`, `Geography`, `2025-07-31`
 *   Dumped back out of CKAN      `indicator_code`, `Geography`, `unsafe_2025_07_31`
 *
 * CKAN lowercases headings, replaces dots with underscores, and prefixes any
 * column starting with a digit with `unsafe_`, so a round trip through the
 * portal renames most of the file.
 */
const DATE_COLUMN = /^(?:unsafe_)?(\d{4})[-_](\d{2})[-_](\d{2})$/;

const normalise = (heading) => heading.trim().toLowerCase().replace(/[.\-\s]/g, '_');

const findColumn = (header, ...names) => {
    let wanted = names.map(normalise);
    return header.findIndex(heading => wanted.includes(normalise(heading)));
};

// Minimal RFC 4180 reader — the indicator names contain commas ("Consumer
// Price Index, All items"), so splitting on commas alone is not enough.
function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (quoted) {
            if (char !== '"') {
                field += char;
            } else if (text[i + 1] === '"') {
                field += '"';
                i++;
            } else {
                quoted = false;
            }
            continue;
        }

        if (char === '"') {
            quoted = true;
        } else if (char === ',') {
            row.push(field);
            field = '';
        } else if (char === '\n' || char === '\r') {
            if (char === '\r' && text[i + 1] === '\n') i++;
            row.push(field);
            field = '';
            if (row.length > 1 || row[0] !== '') rows.push(row);
            row = [];
        } else {
            field += char;
        }
    }

    row.push(field);
    if (row.length > 1 || row[0] !== '') rows.push(row);

    return rows;
}

function toNumber(value) {
    if (value === '' || value === 'NaN' || value === '#N/A') return null;
    const parsed = Number(value);
    // Keep two decimals: the source carries float noise the chart never shows.
    return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : null;
}

const raw = fs.readFileSync(SOURCE, 'utf8').replace(/^﻿/, '');
const rows = parseCSV(raw);

if (rows.length < 2) {
    throw new Error(`${SOURCE} has no data rows`);
}

const header = rows[0];
const isoColumn = findColumn(header, 'Geography', 'iso_code');
const indicatorColumn = findColumn(header, 'indicator_code', 'Indicator.Code');

if (isoColumn === -1 || indicatorColumn === -1) {
    throw new Error(
        'CSV needs a country column (Geography / iso_code) and an indicator column ' +
        '(Indicator.Code / indicator_code). Found: ' + header.slice(0, 8).join(', ')
    );
}

const dateColumns = [];
header.forEach((name, index) => {
    const match = DATE_COLUMN.exec(name);
    if (match) {
        dateColumns.push({ index, date: `${match[1]}-${match[2]}-${match[3]}` });
    }
});

if (dateColumns.length === 0) {
    throw new Error('CSV has no recognisable date columns');
}

dateColumns.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

const indicators = [];
const byCountry = new Map();

rows.slice(1).forEach(row => {
    const iso = row[isoColumn];
    const indicator = row[indicatorColumn];
    if (!iso || !indicator) return;

    if (!indicators.includes(indicator)) indicators.push(indicator);
    if (!byCountry.has(iso)) byCountry.set(iso, new Map());

    byCountry.get(iso).set(indicator, dateColumns.map(({ index }) => toNumber(row[index])));
});

indicators.sort();

const empty = dateColumns.map(() => null);
const countries = {};

Array.from(byCountry.keys()).sort().forEach(iso => {
    const series = byCountry.get(iso);
    // Every country gets a full indicator x date grid, so the app never has to
    // check whether a given indicator exists before charting it.
    countries[iso] = indicators.map(indicator => series.get(indicator) || empty);
});

const output = {
    dates: dateColumns.map(({ date }) => date),
    indicators,
    countries
};

const countValues = (grid) => grid.reduce((n, series) => n + series.filter(v => v !== null).length, 0);

// Compare against the file being replaced before overwriting it. A partial
// export is the failure mode worth catching here: the `reshaped` resource on
// CKAN has silently been truncated to five countries before now, and a short
// CSV would otherwise regenerate cleanly and quietly drop data from the site.
let previous = null;
if (fs.existsSync(TARGET)) {
    try {
        previous = JSON.parse(fs.readFileSync(TARGET, 'utf8'));
    } catch (error) {
        console.warn(`  (could not read the existing ${path.basename(TARGET)} to compare against)`);
    }
}

fs.writeFileSync(TARGET, JSON.stringify(output));

const total = Object.keys(countries).length * indicators.length * output.dates.length;
const populated = Object.values(countries).reduce((n, grid) => n + countValues(grid), 0);

console.log(`Wrote ${path.relative(process.cwd(), TARGET)}`);
console.log(
    `  ${Object.keys(countries).length} countries x ${indicators.length} indicators x ${output.dates.length} months` +
    ` (${output.dates[0]} to ${output.dates[output.dates.length - 1]})`
);
console.log(`  ${populated.toLocaleString()} of ${total.toLocaleString()} values present`);
console.log(`  ${(fs.statSync(TARGET).size / 1024).toFixed(0)} KB on disk`);

if (previous && previous.countries) {
    let added = Object.keys(countries).filter(iso => !previous.countries[iso]);
    let dropped = Object.keys(previous.countries).filter(iso => !countries[iso]);
    let lost = Object.keys(countries)
        .filter(iso => previous.countries[iso])
        .map(iso => ({ iso, delta: countValues(countries[iso]) - countValues(previous.countries[iso]) }))
        .filter(c => c.delta < 0);

    let previousPopulated = Object.values(previous.countries).reduce((n, grid) => n + countValues(grid), 0);
    let newMonths = output.dates.filter(d => !previous.dates.includes(d));

    console.log('\nAgainst the previous build:');
    console.log(`  ${(populated - previousPopulated >= 0 ? '+' : '') + (populated - previousPopulated).toLocaleString()} values` +
        (newMonths.length ? `, ${newMonths.length} new month(s) to ${newMonths[newMonths.length - 1]}` : ', no new months'));
    if (added.length) console.log(`  added: ${added.join(', ')}`);

    if (dropped.length || lost.length) {
        console.error('\n  ⚠ THIS BUILD LOSES DATA — check the CSV is a complete export before committing');
        if (dropped.length) console.error(`    countries gone: ${dropped.join(', ')}`);
        if (lost.length) console.error(`    fewer values: ${lost.map(c => `${c.iso} (${c.delta})`).join(', ')}`);
        process.exitCode = 1;
    }
}
