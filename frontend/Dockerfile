FROM nginx:alpine

# 安装必要的工具
RUN apk add --no-cache bash sed

# Copy built frontend files
COPY dist/ /usr/share/nginx/html/

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy startup script and config template
COPY docker-entrypoint.sh /docker-entrypoint.sh

# Make startup script executable
RUN chmod +x /docker-entrypoint.sh

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Use custom entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
