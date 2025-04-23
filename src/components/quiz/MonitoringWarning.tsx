
import React from 'react';
import { QuizSettings } from '@/types';

interface MonitoringWarningProps {
  settings: QuizSettings;
}

export const MonitoringWarning: React.FC<MonitoringWarningProps> = ({ settings }) => {
  if (!settings.monitoringEnabled) return null;
  
  return (
    <div className="border rounded-md p-4 bg-amber-50">
      <h3 className="font-semibold mb-2">Important: Monitoring Enabled</h3>
      <p className="text-sm mb-4">
        This quiz requires camera and microphone access to monitor for academic honesty.
        The following actions will be tracked:
      </p>
      <ul className="list-disc list-inside text-sm space-y-1">
        <li>Face detection through your camera</li>
        <li>Tab switching and window focus</li>
        <li>Multiple or no faces in camera view</li>
      </ul>
      <div className="mt-4 text-sm">
        <strong>Warning:</strong> After {settings.allowedWarnings} integrity violations, your quiz will be automatically submitted.
      </div>
    </div>
  );
};
