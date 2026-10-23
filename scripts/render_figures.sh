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
  echo "  $2.png  ($(identify -format '%wx%h' "$OUT/$2.png"))"
}

echo "Rendering figures from $PAPER"
# Fig. 1  pipeline (vector + raster, wide)
render "$PAPER/figures/ceg_pipeline.pdf"            ceg_pipeline            220
# Fig. 2  attention selects the task-relevant objects
render "$PAPER/figures/attention_qualitative.pdf"   attention_qualitative   220
# Fig. 3  controlled study, three sampling conditions with their rate table
render "$PAPER/fractal_study/figures/three_conditions_omega1.pdf" three_conditions 400
# Fig. 5  cable-insertion servoing error over time
render "$PAPER/figures/realworld_servoing_error.pdf" realworld_servoing_error 220
# Fig. 6  attention mass / pointing accuracy by PaliGemma layer (small vector page)
render "$PAPER/figures/attention_layer_gap.pdf"     attention_layer_gap     600

# Fig. 4  real-world tasks: a 2x2 panel figure whose fourth panel is still a
# placeholder in the paper, so crop the three finished task panels out of it.
render "$PAPER/figures/realworld_tasks.pdf"         realworld_tasks         200
crop () {             # crop <geometry> <out-basename>
  convert "$OUT/realworld_tasks.png" -crop "$1" +repage "$OUT/$2.png"
  echo "  $2.png  ($(identify -format '%wx%h' "$OUT/$2.png"))"
}
crop 1308x582+13+13   task_cable_insertion
crop 1308x582+1331+13 task_adapter_relocation
crop 1308x582+13+609  task_burette_dispensing
rm "$OUT/realworld_tasks.png"

# Denoising-flow figure is already a PNG in the paper repo; downscale the 5 MB original.
convert "$PAPER/denoising_flow.png" -resize 2000x\> -strip "$OUT/denoising_flow.png"
echo "  denoising_flow.png  ($(identify -format '%wx%h' "$OUT/denoising_flow.png"))"

# Social-preview thumbnail from the pipeline figure (1200x630, padded on white).
convert "$OUT/ceg_pipeline.png" -resize 1100x560 -background white -gravity center \
        -extent 1200x630 -strip "$OUT/og_thumb.jpg"
echo "  og_thumb.jpg"

echo "Done."
