# syntax=docker/dockerfile:1.6
# =====================================================================
# AAOP Backend — Laravel 12 / PHP 8.3 (CLI + dev-server)
# =====================================================================
FROM php:8.3-cli-bookworm

ARG UID=1000
ARG GID=1000

ENV DEBIAN_FRONTEND=noninteractive \
    COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_HOME=/home/dev/.composer \
    PHP_MEMORY_LIMIT=512M

# ---------------------------------------------------------------------
# OS deps + PHP extensions required for Laravel 12 + AAOP
#   bcmath, pcntl, intl, zip, pdo_mysql, redis (pecl), mbstring (built-in)
# ---------------------------------------------------------------------
RUN apt-get update && apt-get install -y --no-install-recommends \
        git curl unzip ca-certificates \
        libicu-dev libzip-dev libonig-dev libpng-dev libjpeg-dev libfreetype6-dev \
        libssl-dev pkg-config default-mysql-client iputils-ping \
    && ARCH=$(uname -m) \
    && if [ "$ARCH" = "x86_64" ]; then OPA_ARCH=amd64; \
       elif [ "$ARCH" = "aarch64" ]; then OPA_ARCH=arm64; \
       else OPA_ARCH=amd64; fi \
    && curl -fsSL -o /usr/local/bin/opa "https://github.com/open-policy-agent/opa/releases/download/v0.69.0/opa_linux_${OPA_ARCH}_static" \
    && chmod +x /usr/local/bin/opa \
    && docker-php-ext-configure intl \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
         bcmath pcntl intl zip pdo_mysql opcache exif gd \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && rm -rf /var/lib/apt/lists/*

# ---------------------------------------------------------------------
# Composer (latest stable)
# ---------------------------------------------------------------------
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# ---------------------------------------------------------------------
# Non-root developer user (UID/GID match host to keep mounted files sane)
# ---------------------------------------------------------------------
RUN groupadd -g ${GID} dev || true \
    && useradd -m -u ${UID} -g ${GID} -s /bin/bash dev \
    && mkdir -p /var/www/html /home/dev/.composer/cache \
    && chown -R dev:dev /var/www/html /home/dev

# ---------------------------------------------------------------------
# php.ini (dev tuning)
# ---------------------------------------------------------------------
RUN { \
      echo "memory_limit=${PHP_MEMORY_LIMIT}"; \
      echo "upload_max_filesize=64M"; \
      echo "post_max_size=64M"; \
      echo "date.timezone=UTC"; \
      echo "display_errors=On"; \
      echo "error_reporting=E_ALL"; \
      echo "opcache.enable=0"; \
    } > /usr/local/etc/php/conf.d/zz-aaop.ini

# Bootstrap script: install Laravel skeleton if backend volume is empty,
# install composer deps if not, then `php artisan serve`.
COPY entrypoint.sh /usr/local/bin/aaop-entrypoint
RUN chmod +x /usr/local/bin/aaop-entrypoint

USER dev
WORKDIR /var/www/html

EXPOSE 8000

ENTRYPOINT ["/usr/local/bin/aaop-entrypoint"]
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
