# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/62f93177-6efc-43d9-bd1e-dfcb75dfadcb

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/62f93177-6efc-43d9-bd1e-dfcb75dfadcb) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/62f93177-6efc-43d9-bd1e-dfcb75dfadcb) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Face Detection Integrity Monitoring

This project includes advanced face detection for monitoring student integrity during quizzes:

### Features
- Real-time face presence detection
- Multiple faces detection
- Gaze monitoring to detect looking away
- Head pose estimation
- Tab switching and focus loss detection

### Implementation
The face detection system uses:
- face-api.js (TensorFlow.js based)
- Client-side processing for privacy and performance
- Configurable warning thresholds

### Setup Face Detection

Before running the application, download the required face-api.js models:

```sh
# Make the download script executable
chmod +x download-face-models.sh

# Run the script to download models
./download-face-models.sh
```

This will download the necessary model files to the `public/models` directory.

### Integration Points
- `src/utils/faceDetectionUtils.ts` - Core face detection functionality
- `src/pages/TakeQuiz.tsx` - Student-side implementation
- `src/components/quiz/StudentVideoMonitor.tsx` - Professor monitoring view

### Planned Future Enhancements
- Voice activity monitoring
- Foreign object detection
- More sophisticated anti-cheating measures
- Analytics dashboard for professors
