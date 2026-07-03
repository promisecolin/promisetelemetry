#!/usr/bin/env bash
# Prints the current public URL for each Cloudflare quick tunnel started by
# docker-compose.tunnel.yml. Quick tunnel URLs are random and change every
# time the tunnel containers restart, so run this after starting/restarting
# them instead of relying on a fixed address.

set -uo pipefail

declare -A containers=(
  [app]="tunnel-cloudflared-app-1"
  [grafana]="tunnel-cloudflared-grafana-1"
  [prometheus]="tunnel-cloudflared-prometheus-1"
)

for name in app grafana prometheus; do
  container="${containers[$name]}"
  url=""

  if ! docker inspect "$container" >/dev/null 2>&1; then
    printf "%-10s not running (start it with: docker compose -p tunnel -f docker-compose.tunnel.yml up -d)\n" "$name:"
    continue
  fi

  for _ in $(seq 1 10); do
    # `docker logs` keeps history across restarts, so take the most recent
    # match (tail), not the first — otherwise a stale pre-restart URL wins.
    url=$(docker logs "$container" 2>&1 | grep -o 'https://[a-zA-Z0-9.-]*trycloudflare\.com' | tail -1)
    [ -n "$url" ] && break
    sleep 1
  done

  printf "%-10s %s\n" "$name:" "${url:-not available yet, try again in a few seconds}"
done
