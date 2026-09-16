FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source
COPY . .

# Expose backend port
EXPOSE 5000

# Default environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Start server
CMD ["npm", "start"]
