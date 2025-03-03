#!/bin/bash

# Stop and remove the container if it exists
if docker ps -a | grep -q elsydeon; then
  echo "Stopping Elsydeon bot..."
  docker stop elsydeon
  docker rm elsydeon
  echo "Container stopped and removed."
else
  echo "Elsydeon container is not running."
fi