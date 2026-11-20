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
# Fig. 1  two-pass method figure
render "$PAPER/figures/two_pass_method_figure.pdf"   method_overview          150
# Fig. 2  attention selects the task-relevant objects (simulation)
render "$PAPER/figures/attention_qualitative.pdf"    attention_qualitative    220
# Fig. 3  attention on the real-world tasks
render "$PAPER/figures/real_world_attention_grid.pdf" realworld_attention     240
# Fig. 4  guided denoising flow
render "$PAPER/figures/denoising_flow.pdf"           denoising_flow           300
# Fig. 5  real-world tasks (full page; the white margins are trimmed below)
pdftocairo -png -singlefile -r 200 "$PAPER/figures/real_world_tasks_d1.pdf" "$OUT/realworld_tasks"
convert "$OUT/realworld_tasks.png" -trim +repage -resize 2000x\> -strip "$OUT/realworld_tasks.png"
echo "  realworld_tasks.png  ($(identify -format '%wx%h' "$OUT/realworld_tasks.png"))"
# Fig. 6  cable-insertion servoing error over time
render "$PAPER/figures/realworld_servoing_error.pdf" realworld_servoing_error 220
# Fig. 7  success vs. inference latency
render "$PAPER/figures/efficiency_success_latency_log.pdf" efficiency     220
# Fig. 8  attention mass / pointing accuracy by PaliGemma layer (small vector page)
render "$PAPER/figures/attention_layer_gap.pdf"      attention_layer_gap      600
# Appendix: controlled study, three sampling conditions
render "$PAPER/fractal_study/figures/three_conditions_omega1.pdf" three_conditions 400

# Social-preview thumbnail from the method figure (1200x630, padded on white).
convert "$OUT/method_overview.png" -resize 1100x560 -background white -gravity center \
        -extent 1200x630 -strip "$OUT/og_thumb.jpg"
echo "  og_thumb.jpg"

echo "Done."
