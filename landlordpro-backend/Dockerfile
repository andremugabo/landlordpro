# landlordpro-backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create uploads directory if it doesn't exist
RUN mkdir -p uploads

# Expose port
EXPOSE 3000

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "Running database sync..."' >> /app/start.sh && \
    echo 'node sync.js' >> /app/start.sh && \
    echo 'echo "Running database seed..."' >> /app/start.sh && \
    echo 'node seed.js' >> /app/start.sh && \
    echo 'echo "Starting server..."' >> /app/start.sh && \
    echo 'node server.js' >> /app/start.sh && \
    chmod +x /app/start.sh

# Start the application with sync and seed
CMD ["/app/start.sh"]