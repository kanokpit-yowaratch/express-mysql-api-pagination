FROM node:18

# Create app-asia directory
RUN mkdir -p /usr/src/app-asia
WORKDIR /usr/src/app-asia

# Install app-asia dependencies
COPY package*.json /usr/src/app-asia/
RUN npm install

# Bundle app-asia source
COPY . /usr/src/app-asia

RUN npm run build

EXPOSE 3456
RUN chown -R node /usr/src/app-asia
CMD [ "npm", "start" ]