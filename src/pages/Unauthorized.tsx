
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">Unauthorized Access</h1>
        <p className="text-gray-600 mb-6">
          You do not have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
      </div>
    </div>
  );
};

export default Unauthorized;
