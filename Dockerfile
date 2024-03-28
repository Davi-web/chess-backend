# Fetching the minified node image on apline linux
FROM node:slim as build

# Declaring env
ENV NODE_ENV development


#Copy package.json 
COPY package*.json .

# Installing dependencies
RUN npm install
# Copying all the files in our project
COPY . .

RUN npm run build

FROM node:slim as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json .
RUN npm ci --only=production
COPY --from=build /usr/src/app/dist ./dist



# Starting our application
CMD [ "node", "dist/index.js" ]


# Exposing server port
EXPOSE 8080