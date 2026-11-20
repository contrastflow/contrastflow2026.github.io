#!/usr/bin/env bash
# Render the paper's PDF figures (from the `paper/` submodule) to PNGs for the website.
#
# Requires: pdftocairo (poppler-utils) and ImageMagick `convert`.
# Usage:    scripts/render_figures.sh            # from the repo root
#
# The paper repo is the single source of truth for figures; everything written to
# static/images/ by this script is derived output and is committed so the site can
# be viewed without running this script.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PAPER="$ROOT/paper"
OUT="$ROOT/static/images"
mkdir -p "$OUT"

if [ ! -f "$PAPER/paper.tex" ]; then
  echo "paper/ submodule is empty. Run: git submodule update --init" >&2
  exit 1
fi

render () {           # render <pdf> <out-basename> <dpi>
  pdftocairo -png -singlefile -r "$3" "$1" "$OUT/$2"
  convert "$OUT/$2.png" -resize 2400x\> -strip "$OUT/$2.png"
  echo "  $2.png  ($(identify -format '%wx%h' "$OUT/$2.png"))"
}

echo "Rendering figures from $PAPER"
# crop <pdf> <out-basename> <dpi> <x> <y> <w> <h>   (pixel box at that dpi, mirrors the paper's \includegraphics trim)
crop () {
  pdftocairo -png -singlefile -r "$3" -x "$4" -y "$5" -W "$6" -H "$7" "$1" "$OUT/$2"
  convert "$OUT/$2.png" -resize 2400x\> -strip "$OUT/$2.png"
  echo "  $2.png  ($(identify -format '%wx%h' "$OUT/$2.png"))"
}
F="$PAPER/figures"
# Fig. 1  teaser / method: masked vs. full velocity and the guided velocity
render "$F/two_row_method_figure.pdf"        method_overview          200
# Fig. 2  RoboLab "put the onion on the plate": attention tracks the subgoal
render "$F/robolab_onion_subgoal.pdf"        robolab_onion_subgoal    300
# Fig. 3  LIBERO-PRO position swap rollouts
render "$F/liberopro_rollouts.pdf"           liberopro_rollouts       300
# Fig. 4  sensitivity to guidance strength and masking ratio
render "$F/pi05_omega_mask_sensitivity.pdf"  sensitivity              300
# Fig. 5  (a) guided denoising flow + (b) success over noise initialisations, side by side
render "$F/denoising_flow.pdf"               denoising_flow           300
render "$F/study_spread_performance.pdf"     study_spread             300
convert \( "$OUT/denoising_flow.png" -resize x343 -background white -gravity east -splice 24x0 \) \
        \( "$OUT/study_spread.png" -resize x343 \) -background white +append -strip "$OUT/denoising_study.png"
rm "$OUT/denoising_flow.png" "$OUT/study_spread.png"
echo "  denoising_study.png  ($(identify -format '%wx%h' "$OUT/denoising_study.png"))"
# Fig. 6  four real-world tasks (paper trim: 4pt left/right, 56pt top, 106pt bottom)
crop "$F/real_world_four_task_diagram.pdf"   realworld_tasks          200  11 156 2644 1050
# Fig. 7  real-world attention (paper trim: 180pt bottom)
crop "$F/real_world_attention_grid.pdf"      realworld_attention      200   3   0 2664 1000
# Fig. 8  success vs. inference latency
render "$F/latency_clusters.pdf"             efficiency               400
# Supplementary: cable-insertion servoing error, more RoboLab rollouts
render "$F/realworld_servoing_error.pdf"     realworld_servoing_error 220
render "$F/robolab_qualitative.pdf"          robolab_qualitative      300

# Social-preview thumbnail from the method figure (1200x630, padded on white).
convert "$OUT/method_overview.png" -resize 1100x560 -background white -gravity center \
        -extent 1200x630 -strip "$OUT/og_thumb.jpg"
echo "  og_thumb.jpg"

echo "Done."
