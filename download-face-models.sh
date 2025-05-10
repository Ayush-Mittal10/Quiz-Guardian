#!/bin/bash

# Create models directory if it doesn't exist
mkdir -p public/models

# Base URL for models
BASE_URL="https://github.com/justadudewhohacks/face-api.js/raw/master/weights"

# Models to download
MODELS=(
  "tiny_face_detector_model-weights_manifest.json"
  "tiny_face_detector_model-shard1.bin"
  "face_landmark_68_model-weights_manifest.json"
  "face_landmark_68_model-shard1.bin"
  "face_expression_model-weights_manifest.json"
  "face_expression_model-shard1.bin"
  "face_recognition_model-weights_manifest.json"
  "face_recognition_model-shard1.bin"
  "face_recognition_model-shard2.bin"
)

# Download each model
for MODEL in "${MODELS[@]}"; do
  echo "Downloading $MODEL..."
  curl -L "$BASE_URL/$MODEL" -o "public/models/$MODEL"
done

echo "All models downloaded successfully!" 