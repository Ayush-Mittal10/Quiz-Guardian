# Sincere Quiz Guardian

A secure and intelligent quiz platform with real-time integrity monitoring for educational institutions.

## Features

- **Secure Quiz Management**
  - Create and manage quizzes with customizable settings
  - Time limits and question randomization
  - Automatic grading and result analysis

- **Real-time Integrity Monitoring**
  - Face detection and presence monitoring
  - Multiple faces detection
  - Gaze tracking and head pose estimation
  - Tab switching and focus loss detection
  - Configurable warning system

- **WebRTC Video Monitoring**
  - Real-time video streaming between students and professors
  - Low-latency connection with fallback options
  - Privacy-focused implementation

## Tech Stack

- **Frontend**
  - React with TypeScript
  - Vite for build tooling
  - Tailwind CSS for styling
  - shadcn-ui for UI components

- **Backend**
  - Supabase for database and authentication
  - WebRTC for real-time video streaming
  - face-api.js for face detection

## Getting Started

### Prerequisites

- Node.js & npm
- Supabase account and project
- Modern web browser with camera access

### Installation

1. Clone the repository:
```sh
git clone <repository-url>
cd sincere-quiz-guardian
```

2. Install dependencies:
```sh
npm install
```

3. Download face detection models:
```sh
chmod +x download-face-models.sh
./download-face-models.sh
```

4. Set up environment variables:
```sh
cp .env.example .env
# Edit .env with your Supabase credentials
```

5. Start the development server:
```sh
npm run dev
```

## Project Structure

```
src/
├── components/     # React components
├── contexts/       # React contexts
├── hooks/         # Custom React hooks
├── integrations/  # Third-party integrations
├── pages/         # Page components
├── types/         # TypeScript types
└── utils/         # Utility functions
```

## Key Components

- `src/utils/faceDetectionUtils.ts` - Face detection implementation
- `src/utils/webRTCUtils.ts` - WebRTC video streaming
- `src/pages/TakeQuiz.tsx` - Student quiz interface
- `src/components/quiz/StudentVideoMonitor.tsx` - Professor monitoring view

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
