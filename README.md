# davidprinz.org

Personal academic website of David Prinz, served via GitHub Pages at [davidprinz.org](https://davidprinz.org).

Built with Jekyll and a small custom theme ("Bodensee"): no jQuery, no CSS framework, self-hosted fonts.

## Structure

- `_pages/` – the content, one Markdown file per page
- `_data/navigation.yml` – the main menu
- `_layouts/` – `default` (frame), `page` (normal pages), `home` (start page with photo)
- `_includes/` – `head`, `header`, `footer`, and `math` (optional KaTeX)
- `assets/css/main.css` – all styles; colours are defined once at the top
- `assets/js/site.js` – light/dark switch and spam-protected e-mail links; `assets/js/water.js` – the water animation on the home page

## Page options (front matter)

- `badge: "Past seminar, 2024–2025"` – small label above the title
- `lead: "…"` – short intro line under the title
- `animation: water` – background animation (script in `assets/js/<name>.js`)
- `math: true` – render `$…$` formulas with KaTeX on that page

## Run locally

```
bundle install
bundle exec jekyll serve
```

Then open http://localhost:4000.

Originally based on the AcademicPages template (MIT License, see `LICENSE`). Fonts: Newsreader, IBM Plex Sans and IBM Plex Mono (SIL Open Font License).
