# A2F project page

Project website for **Grounding Generalist Policies via Attention-Guided Action Flows (A2F)**.
Static HTML, no build step. The layout is adapted from the
[Anchor-Align project page](https://github.com/anchoralignvla/anchoralignvla.github.io).

This site is **not deployed**. View it locally.

## View locally

```sh
./serve.sh            # serves on http://localhost:8000/
./serve.sh 9000       # any other port
```

Opening `index.html` directly from the file system also works, since all assets are relative.

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | The page: overview, method, controlled study, simulation and real-world results, analysis, BibTeX |
| `static/style.css`, `static/script.js` | Styles and the side-navigation script (from the template, trimmed) |
| `static/images/` | PNG renders of the paper's figures, produced by `scripts/render_figures.sh` |
| `paper/` | Git submodule: the paper's LaTeX source and figures (`adipotnis/nsf_access_robowarp`) |
| `scripts/render_figures.sh` | Renders `paper/**/*.pdf` figures to `static/images/` |

## Updating figures after the paper changes

```sh
git submodule update --remote paper      # pull the paper repo's latest main
scripts/render_figures.sh                # re-render PNGs (needs pdftocairo and ImageMagick)
git add paper static/images && git commit -m "Update figures from paper"
```

Fresh clone: `git clone --recurse-submodules <url>` or `git submodule update --init` after cloning.
The rendered PNGs are committed, so the site displays without the submodule or the tools above.

## Left to fill in

- Author list, affiliations and links in the hero block of `index.html` (search for `TODO(authors)`).
- Paper and code buttons (currently disabled) and the BibTeX entry.
- The paper's abstract is still empty, so the overview text is condensed from the introduction.
