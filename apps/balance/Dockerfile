# syntax=docker/dockerfile:1

ARG NODE_VERSION=18.17.1

FROM node:${NODE_VERSION}-alpine AS development
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install 
COPY . .
RUN npm run build balance

FROM node:${NODE_VERSION}-alpine AS production
ARG NODE_ENV=production 
ENV NODE_ENV=${NODE_ENV}
USER node
WORKDIR /usr/src/app
COPY --from=development /usr/src/app/package.json .
COPY --from=development /usr/src/app/node_modules ./node_modules
COPY --from=development /usr/src/app/dist ./dist

EXPOSE 3001

CMD npm run start:balance:prod
