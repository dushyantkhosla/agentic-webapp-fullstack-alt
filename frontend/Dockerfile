FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG ORIGIN=https://dashboard.${DOMAIN}
ARG PUBLIC_API_URL=http://backend:8000
ENV PUBLIC_API_URL=$PUBLIC_API_URL
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", "build"]
