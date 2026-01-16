# Use Node 20 LTS
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose optional debug port (not required)
# EXPOSE 9229

# Run the bot
CMD ["node", "dist/index.js"]
