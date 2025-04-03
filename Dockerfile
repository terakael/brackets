# Use a lightweight nginx image as a base
FROM nginx:alpine

# Remove the default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

COPY index.html /usr/share/nginx/html/
COPY font.ttf /usr/share/nginx/html/
COPY src/. /usr/share/nginx/html/src/

# Expose port 80 (default nginx port)
EXPOSE 80
