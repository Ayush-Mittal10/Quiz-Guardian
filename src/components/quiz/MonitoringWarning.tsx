
import React from 'react';
import { QuizSettings } from '@/types';
import { AlertTriangle, Camera, Radio, Eye, Users } from 'lucide-react';

interface MonitoringWarningProps {
  settings: QuizSettings;
}

export const MonitoringWarning: React.FC<MonitoringWarningProps> = ({ settings }) => {
  if (!settings.monitoringEnabled) return null;
  
  return (
    <div className="border rounded-md p-4 bg-amber-50">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="text-amber-600 h-5 w-5" />
        <h3 className="font-semibold">Important: Monitoring Enabled</h3>
      </div>
      
      <p className="text-sm mb-4">
        This quiz requires camera and microphone access to monitor for academic honesty.
        The following actions will be tracked in real-time:
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="flex items-start gap-2">
          <Camera className="text-amber-600 h-4 w-4 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Face Detection</p>
            <p className="text-xs text-gray-600">Your face must be visible at all times</p>
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <Radio className="text-amber-600 h-4 w-4 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Tab Switching</p>
            <p className="text-xs text-gray-600">Do not switch to other tabs or applications</p>
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <Eye className="text-amber-600 h-4 w-4 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Gaze Monitoring</p>
            <p className="text-xs text-gray-600">Keep your eyes on the screen</p>
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <Users className="text-amber-600 h-4 w-4 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Multiple Persons</p>
            <p className="text-xs text-gray-600">Only one person should be visible in the camera</p>
          </div>
        </div>
      </div>
      
      <div className="bg-amber-100 p-3 rounded border border-amber-200">
        <p className="text-sm font-medium text-amber-800">Warning System</p>
        <p className="text-xs text-amber-700 mt-1">
          After {settings.allowedWarnings} integrity violations, your quiz will be automatically submitted.
          Violations include: switching tabs, losing focus, no face detected, multiple faces in view, or looking away from the screen.
        </p>
      </div>
    </div>
  );
};
