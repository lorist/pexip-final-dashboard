version: '3.8'

services:
  nginx:
    build:
      context: . # Build from the current directory where Dockerfile is located
      dockerfile: Dockerfile
    container_name: pextest_nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      # Mount shared volume for Certbot to place challenge files
      - ./data/certbot/www:/var/www/certbot
      # Mount shared volume for Certbot to store certificates
      - ./data/certbot/conf:/etc/letsencrypt
      # Mount the pre-generated DH params file
      - ./ssl-dhparams.pem:/etc/letsencrypt/ssl-dhparams.pem:ro
    depends_on:
      - certbot # Ensure certbot service exists, but not strictly "up" for initial certs
    restart: always # Always restart Nginx if it crashes

  certbot:
    image: certbot/certbot
    container_name: pextest_certbot
    volumes:
      - ./data/certbot/www:/var/www/certbot # Shared webroot for challenges
      - ./data/certbot/conf:/etc/letsencrypt # Shared location for certs and configs
    # This entrypoint is for auto-renewal. For initial certs, you'll run it manually.
    # It attempts to renew every 12 hours.
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew --nginx; echo \"Certbot renewal complete. Reloading Nginx...\"; /usr/bin/docker exec pextest_nginx nginx -s reload; sleep 12h & wait $${!}; done;'"
    # Do not expose ports for certbot, it works by placing files Nginx serves.

volumes:
  certbot_www: # This defines the volume to share webroot files
  certbot_conf: # This defines the volume to share certificate files