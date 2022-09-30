FROM node:17.0.1 AS build

# Install essential tools
RUN apt-get -qq update && \
    apt-get -qq install sudo && \
    apt-get -qq install apt-transport-https && \
    apt-get -qq install build-essential && \
    apt-get -qq install git

# install yarn
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list && \
    apt-get update && apt-get -qq install -y yarn

ARG GITHUB_TOKEN
COPY src/ /usr/src/api/src
COPY bin/ /usr/src/api/bin
COPY operations/.npmrc /usr/src/api/.npmrc
COPY yarn.lock /usr/src/api/
COPY package.json /usr/src/api/
WORKDIR /usr/src/api
RUN yarn install
RUN rm -rf .npmrc

RUN yarn cache clean

FROM node:17.0.1-alpine

COPY --from=build /usr/src/api /api

WORKDIR /api
CMD ["yarn", "start"]
