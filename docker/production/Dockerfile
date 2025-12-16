FROM serversideup/php:8.4-fpm-nginx

USER root
# install npm 
RUN curl -fsSL https://deb.nodesource.com/setup_24.x | bash - \
    && apt-get install -y nodejs

RUN install-php-extensions intl bcmath
USER www-data