FROM nginx:alpine

# Copy the app into nginx's web root
COPY SmartEdit.html /usr/share/nginx/html/index.html

EXPOSE 80
