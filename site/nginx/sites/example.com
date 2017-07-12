server {
  # listen [::]:80 accept_filter=httpready; # for FreeBSD
  # listen 80 accept_filter=httpready; # for FreeBSD
  # listen [::]:80 deferred; # for Linux
  # listen 80 deferred; # for Linux
  listen 80;

  # The host name to respond to
  server_name localhost;

  # Path for static files
  root /usr/share/nginx/html;

  # Specify a charset
  charset utf-8;

  open_file_cache max=1000 inactive=5m;

  # Include the basic h5bp config set
  include h5bp/basic.conf;
}
