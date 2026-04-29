FROM node:20-alpine AS base

# Install dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN npm install --production

# Copy source files
COPY . .

# Generate Prisma client and build
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
