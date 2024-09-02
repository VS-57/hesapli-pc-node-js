# Use the official Node.js image as the base image
FROM node:18

# Install necessary dependencies for Chromium and Xvfb (if needed)
RUN apt-get update && apt-get install -y \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxi6 \
    libxtst6 \
    libnss3 \
    libxrandr2 \
    libasound2 \
    libpango1.0-0 \
    libcups2 \
    libxss1 \
    libgtk-3-0 \
    libgbm-dev \
    fonts-liberation \
    libappindicator3-1 \
    xdg-utils \
    wget \
    ca-certificates \
    xvfb \
    --no-install-recommends \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json (if available)
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Set environment variable to disable Chromium sandboxing (useful for Puppeteer)
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV NODE_ENV=production

# Command to run your application, with Xvfb if needed
CMD ["xvfb-run", "--auto-servernum", "--server-args=-screen 0 1024x768x24", "npm", "start"]
