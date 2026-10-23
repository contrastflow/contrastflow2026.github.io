#!/usr/bin/env bash
# Serve the site locally for viewing (no deployment). Open http://localhost:8000/
cd "$(dirname "${BASH_SOURCE[0]}")"
PORT="${1:-8000}"
echo "Serving at http://localhost:$PORT/  (Ctrl-C to stop)"
exec python3 -m http.server "$PORT" --bind 127.0.0.1
