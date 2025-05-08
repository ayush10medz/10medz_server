# Use Node official image
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of app code
COPY . .

# Expose the app port (change 3000 if your app runs on a different port)
EXPOSE 3000

# Start the app
CMD ["npm", "run", "start"]