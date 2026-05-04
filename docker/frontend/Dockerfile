# syntax=docker/dockerfile:1.6
# =====================================================================
# AAOP Frontend — Next.js 15 / MUI / Node 22-alpine (dev hot-reload)
#
# Note: this image stays as `USER root` so the entrypoint can fix
# permissions on Docker named volumes (`frontend_node_modules`,
# `frontend_next_cache`) — they are created root:root on first use, and
# would otherwise prevent the `dev` user from writing into them. The
# entrypoint then drops privileges to `dev` via `su-exec` before
# launching the Next.js server.
# =====================================================================
FROM node:22-alpine

ARG UID=1000
ARG GID=1000

# Tools needed for native deps + healthcheck + privilege drop
RUN apk add --no-cache libc6-compat curl bash git su-exec

# Match host UID/GID for clean volume permissions
RUN deluser --remove-home node 2>/dev/null || true \
 && (getent group ${GID} >/dev/null || addgroup -g ${GID} dev) \
 && (getent passwd ${UID} >/dev/null || adduser  -u ${UID} -G dev -s /bin/sh -D dev) \
 && mkdir -p /app /home/dev/.npm \
 && chown -R ${UID}:${GID} /app /home/dev

WORKDIR /app

ENV NODE_ENV=development \
    NEXT_TELEMETRY_DISABLED=1 \
    PATH=/app/node_modules/.bin:$PATH \
    AAOP_RUN_AS_UID=${UID} \
    AAOP_RUN_AS_GID=${GID}

COPY entrypoint.sh /usr/local/bin/aaop-frontend-entrypoint
RUN chmod +x /usr/local/bin/aaop-frontend-entrypoint

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/aaop-frontend-entrypoint"]
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0", "-p", "3000"]
