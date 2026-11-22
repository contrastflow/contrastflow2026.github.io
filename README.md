# ContrastFlow project page

Project website for **Improving Generalist Policies via Contrastive Flow at Test-Time (ContrastFlow)**.
Static HTML with simulation and real-world videos.

Live site: https://contrastflow.github.io/contrastflow2026.github.io/

## View locally

```sh
./serve.sh            # serves on http://localhost:8000/
./serve.sh 9000       # any other port
```

Opening `index.html` directly also works because the assets use relative paths.
A regular Git clone is sufficient; no private repositories or submodules are required.

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | Title, rolling video showcase, simulation videos, and real-world task videos |
| `static/style.css`, `static/script.js` | Styles, playback focus, and section navigation |
| `static/videos/` | All displayed browser-compatible MP4s and their video preview images |
| `media/` | Video provenance and encoding records |
| `.github/workflows/pages.yml` | GitHub Pages deployment |

## Deployment

Pushes to `main` automatically deploy `index.html` and `static/` to GitHub Pages.
The workflow can also be started manually from the Actions tab.
There is no build step or dependency on the paper source repository.

All displayed videos are stored directly in this repository. Displayed videos are kept in `static/videos/`; retained previous versions are kept in `static/videos/archive/`. Other older versions remain available in Git history.

Previous simulation composites and the original dark real-world clips are preserved in `static/videos/archive/pre_four_view_20261122/`, including hashes and provenance. The current simulation comparisons use separate train/test images and full policy videos.

The separate policy clips before the additional 20% trail reduction are retained in `static/videos/archive/four_view_before_extra20_20261122/`.
