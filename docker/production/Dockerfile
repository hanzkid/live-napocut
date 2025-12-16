# Stage 1
FROM serversideup/php:8.4-fpm-nginx AS php-build    

USER root

RUN install-php-extensions intl bcmath

# Stage 2
FROM php-build

USER root

# Install Node.js 24 globally
RUN curl -fsSL https://deb.nodesource.com/setup_24.x | bash - \
    && apt-get install -y nodejs

# Set working directory
USER www-data
WORKDIR /var/www/html

# Copy dependency files first for better caching
COPY --chown=www-data:www-data composer.json composer.lock ./
COPY --chown=www-data:www-data package.json package-lock.json ./

# Install Composer dependencies
RUN composer install --optimize-autoloader --no-interaction --prefer-dist

# Install npm dependencies (including dev dependencies needed for build)
RUN npm ci \
    && npm cache clean --force

# Copy the rest of the application files (needed for wayfinder plugin during build)
COPY --chown=www-data:www-data . .

# RUN php artisan optimize
RUN php artisan optimize

RUN npm run build