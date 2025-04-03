#!/bin/bash

# Configuration (customize as needed)
IMAGE_NAME="kwqzxs"        # Your image name
IMAGE_TAG="latest"            # Default tag
DOCKERFILE_PATH="./Dockerfile"    # Path to Dockerfile
BUILD_CONTEXT="."              # path to the build context (usually the same folder as the Dockerfile)

# Print help if no arguments are given
if [ $# -eq 0 ]; then
    echo "Usage: $0 [image_tag]"
    echo "       image_tag:  Optional tag for the Docker image. Defaults to 'latest'"
    exit 1
fi

# Check if an image tag was provided
if [ $# -gt 0 ]; then
    IMAGE_TAG="$1"
fi

REGISTRY_URL="docker.io"
FULL_IMAGE_NAME="$REGISTRY_URL/$DOCKERHUB_USERNAME/$IMAGE_NAME:$IMAGE_TAG"


# 1. Build the Docker image
echo "Building Docker image: $FULL_IMAGE_NAME"
docker build -t "$FULL_IMAGE_NAME" -f "$DOCKERFILE_PATH" "$BUILD_CONTEXT"
if [ $? -ne 0 ]; then
    echo "Error: Docker build failed."
    exit 1
fi


# 2. Log in to Docker Hub
echo "Logging in to Docker Hub..."
echo "$DOCKER_PAT" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin
if [ $? -ne 0 ]; then
    echo "Error: Docker login to Docker Hub failed."
    exit 1
fi


# 3. Push the image to Docker Hub
echo "Pushing Docker image to Docker Hub: $FULL_IMAGE_NAME"
docker push "$FULL_IMAGE_NAME"
if [ $? -ne 0 ]; then
    echo "Error: Docker push to Docker Hub failed."
    #exit 1
fi

echo "Docker image built and pushed successfully to Docker Hub."
