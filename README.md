# ContrastFlow project page

Project website for **Improving Generalist Policies via Contrastive Flow at Test-Time (ContrastFlow)**.
Static HTML with simulation and real-world videos. The layout is adapted from the
[Anchor-Align project page](https://github.com/anchoralignvla/anchoralignvla.github.io).

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
| `index.html` | Title, abstract, simulation videos, and real-world task videos |
| `static/style.css`, `static/script.js` | Styles, playback focus, and section navigation |
| `static/videos/` | Browser-compatible MP4s and video preview images |
| `media/` | Video provenance and encoding records |
| `.github/workflows/pages.yml` | GitHub Pages deployment |

## Deployment

Pushes to `main` automatically deploy `index.html` and `static/` to GitHub Pages.
The workflow can also be started manually from the Actions tab.
There is no build step or dependency on the paper source repository.
