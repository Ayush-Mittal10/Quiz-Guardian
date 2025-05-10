# Face Detection Models

This directory should contain the face-api.js models required for face detection.

## Required Models

You need to download the following models from the face-api.js GitHub repository:

1. `tiny_face_detector_model`
2. `face_landmark_68_model`
3. `face_recognition_model`
4. `face_expression_model`

## Downloading Models

You can download the models from the official face-api.js weights repository:
https://github.com/justadudewhohacks/face-api.js/tree/master/weights

Each model folder contains:
- A weights manifest JSON file (weights_manifest.json)
- One or more binary files containing the weights (shard1.bin, shard2.bin, etc.)

## Directory Structure

The models directory should have this structure:
```
models/
├── tiny_face_detector_model-weights_manifest.json
├── tiny_face_detector_model-shard1.bin
├── face_landmark_68_model-weights_manifest.json
├── face_landmark_68_model-shard1.bin
├── face_recognition_model-weights_manifest.json
├── face_recognition_model-shard1.bin
├── face_recognition_model-shard2.bin
├── face_expression_model-weights_manifest.json
├── face_expression_model-shard1.bin
└── README.md (this file)
```

## Automated Download Script

You can use the following shell script to download all required models:

```bash
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
```

Save this script as `download-face-models.sh`, make it executable with `chmod +x download-face-models.sh`, and run it to download all required models.

## Verifying Models

After downloading, verify that all files are present in the models directory before using the application. 