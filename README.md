Cross API
===

Build
===
docker build \
--build-arg GITHUB_TOKEN=<GITHUB_TOKEN> \
-t registry.digitalocean.com/hotcross/cross-api:<TAG> \
-f ./operations/Dockerfile .
