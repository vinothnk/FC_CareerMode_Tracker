# FC26 Career Console Product Definition

## Scope

FC26 Career Console is a desktop-first web app for solo FC26 console career-mode players who manually track their saves. It is not a CareerMode.xyz clone: the app should have its own workflows, information architecture, visual design, and data model.

The product is a companion tracker, not a live game database. It helps players remember what happened in a save, plan squad decisions, review season progress, and keep a long-running story coherent.

## MVP Platform

Desktop web is the primary MVP platform because career tracking involves tables, comparisons, and multi-column planning. The app must still be responsive on mobile for quick reads and small edits after matches.

Native mobile apps, browser extensions, console integrations, and automated screenshot parsing are outside MVP.

## Core Users

The primary user is a solo career-mode player on console who wants more structure than in-game menus provide. They are willing to enter data manually when the workflow is fast, predictable, and rewarding.

Early assumptions:

- The user manages one or more saves at a time.
- The user records matches, squads, transfers, academy players, and notes manually.
- The user values season history and storytelling as much as raw optimization.
- The user may use SoFIFA as a reference, but does not expect automatic synchronization with FC26.

## Manual Data

User-entered data is the source of truth for the career save:

- Save name, club, manager, platform, difficulty, currency, season, and house rules.
- Squad list, roles, overall, potential, value, wage, contract, form, morale notes, and development plans.
- Fixtures, results, scorers, assists, cards, injuries, substitutions, and match notes.
- Transfers, loans, shortlist targets, academy prospects, release decisions, and contract decisions.
- Season objectives, league position, cup progress, budget, trophies, and narrative notes.

## SoFIFA-Assisted Data

SoFIFA data is optional reference data, not the product's primary data source. Import behavior should be conservative:

- User-triggered player lookup, not bulk background harvesting.
- Store minimum useful fields: player identity, source URL, lookup date, age, position, nation, club, overall, potential, value, wage, and selected attributes if permitted.
- Keep imported reference snapshots separate from user-entered save data.
- Show source attribution and refresh date wherever imported values appear.
- Let users override imported values because console saves diverge quickly.

## Legal And Ethical Constraints

Scraping and storage must respect SoFIFA's current terms, robots guidance, rate limits, and attribution expectations. If a page or endpoint is disallowed, the feature should be disabled or redesigned.

Implementation constraints:

- Do not copy CareerMode.xyz layouts, trade dress, proprietary wording, or data presentation.
- Do not bulk scrape SoFIFA as a default app behavior.
- Prefer user-provided URLs or search terms with explicit lookup actions.
- Cache only what is necessary for the user's save workflow.
- Store source URL and capture date with imported records.
- Provide a deletion path for cached third-party reference data.
- Keep user-created career data clearly owned by the user.

## Feature Backlog

### MVP

- Create, rename, archive, and switch between career saves.
- Manual squad table with player roles, ratings, potential, value, wage, contract status, and notes.
- Manual fixture log with date, competition, opponent, score, scorers, assists, cards, injuries, and notes.
- Season dashboard with record, league position, top scorers, top assists, budget, and objectives.
- Transfer shortlist with target status, estimated cost, priority, and decision notes.
- Local-first persistence for early development.
- CSV export for save backup.

### v1

- SoFIFA-assisted player lookup with attribution, source URL, and refresh history.
- CSV import for users moving from spreadsheets.
- Player progression history across seasons.
- Youth academy and loan development workflows.
- Contract renewal and expiry reminders.
- Optional account sync across desktop and mobile browsers.
- Shareable read-only season report.

### Later

- Generated season recaps from manually entered events.
- Multi-save comparison and challenge templates.
- Community tactics, sliders, and house-rule library.
- Rich dashboards for squad depth, minutes, form, and development.
- Screenshot-assisted match capture if accuracy, consent, and policy constraints are solved.
- Public career pages with privacy controls.

## Immediate Development Slice

The first implementation should prove the product direction with a static but realistic dashboard:

- Product-specific landing surface with active save summary.
- Manual vs SoFIFA-assisted data boundaries.
- Legal and ethical guardrails.
- Feature backlog split into MVP, v1, and later.
- Responsive layout for desktop and mobile.
