FROM nginx

RUN apt-get update && apt-get install -y curl

RUN curl -sL https://deb.nodesource.com/setup_7.x | bash - && apt-get install -y nodejs

COPY . /src/
COPY ./nginx/. /etc/nginx

RUN cd /src && npm install && npm run build && cp -r /src/build/* /usr/share/nginx/html/
