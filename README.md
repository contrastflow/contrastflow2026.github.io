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
| `index.html` | Title, rolling video showcase, simulation videos, and real-world iPhone showcases and setup-camera evaluation comparisons |
| `realworld-videos.html` | All 21 low/wrist evaluation comparisons, grouped by task and supplementary configuration labels |
| `static/style.css`, `static/script.js` | Styles, playback focus, and section navigation |
| `static/videos/` | All displayed browser-compatible MP4s and their video preview images |
| `media/` | Video provenance and encoding records |
| `.github/workflows/pages.yml` | GitHub Pages deployment |

## Deployment

Pushes to `main` automatically deploy the HTML pages using `scripts/build_pages.py`. The compact media live on the `pages-compact-media` branch. The full-quality media live on `main`.

In Actions, open **Deploy website to GitHub Pages**, choose **Run workflow** on `main`, and select **compact** or **full**. This choice applies to that deployment. To change the default for future pushes, set `.github/pages-variant` to `compact` or `full` on `main`.

All displayed videos are stored directly in this repository. Displayed videos are kept in `static/videos/`. Unused and earlier versions were removed on 2026-11-23 and remain in Git history (last present in commit 79ce494). Other older versions remain available in Git history.

Previous simulation composites and the original dark real-world clips are in Git history at commit 79ce494 under `static/videos/archive/pre_four_view_20261122/`, including hashes and provenance. The current simulation comparisons use separate train/test images and full policy videos.

The separate policy clips before the additional 20% trail reduction are in Git history at commit 79ce494 under `static/videos/archive/four_view_before_extra20_20261122/`.

The main Real World section shows three iPhone success clips per task, followed by two setup-camera evaluation comparisons per task. More videos buttons beneath the comparisons open each task’s full set on `realworld-videos.html`. These comparisons show low and wrist views inside each policy video, preserving the native full-frame proportions in a wider gallery. All website videos are silent; real-world clips default to 2×, with ContrastFlow Long transfer clips at 2.5×. The paired evaluations start together and hold the shorter rollout’s final frame until both finish, then restart together. `media/realworld_eval_clips.json` records trial identities, source hashes, and web encodings.

The low/wrist evaluation videos use the approved shadow lift and gentle sharpening, rendered directly from the original high-quality exports at native dimensions and frame timing. H.264 slow encodes prioritize native-resolution detail within the published-size budget, with each clip’s quality setting recorded in the media manifest. Native-resolution posters use high-quality 4:4:4 JPEGs. Original source files remain unchanged.
