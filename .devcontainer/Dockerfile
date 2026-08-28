FROM node:20.17-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive \
    NODE_ENV=development \
    npm_config_update_notifier=false \
    npm_config_fund=false \
    npm_config_audit=false \
    npm_config_prefix=/home/node/.npm-global \
    PATH=/home/node/.npm-global/bin:$PATH

USER root

RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    curl \
    git \
    procps \
    socat \
 && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@10.18.0

RUN mkdir -p /workspace /home/node/.npm-global \
 && chown -R node:node /workspace /home/node/.npm-global

WORKDIR /workspace
USER node

CMD ["sleep", "infinity"]
