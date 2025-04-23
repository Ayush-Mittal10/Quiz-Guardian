
import React from 'react';

interface PermissionsStatusProps {
  permissions: {
    camera: boolean;
    microphone: boolean;
  };
}

export const PermissionsStatus: React.FC<PermissionsStatusProps> = ({ permissions }) => {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold">Permissions</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className={`border rounded-md p-3 ${permissions.camera ? 'bg-green-50' : 'bg-gray-50'}`}>
          <div className="flex justify-between items-center">
            <span>Camera</span>
            {permissions.camera ? (
              <span className="text-green-600 text-sm">Granted</span>
            ) : (
              <span className="text-amber-600 text-sm">Required</span>
            )}
          </div>
        </div>
        <div className={`border rounded-md p-3 ${permissions.microphone ? 'bg-green-50' : 'bg-gray-50'}`}>
          <div className="flex justify-between items-center">
            <span>Microphone</span>
            {permissions.microphone ? (
              <span className="text-green-600 text-sm">Granted</span>
            ) : (
              <span className="text-amber-600 text-sm">Required</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
