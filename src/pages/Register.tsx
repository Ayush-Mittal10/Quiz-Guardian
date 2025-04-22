
import React from 'react';
import { RegisterForm } from '@/components/auth/RegisterForm';

const Register = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center mb-8">
        <div className="flex flex-col items-center justify-center">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Academic Quiz Guardian</h1>
            <p className="text-gray-600">Secure Academic Assessment Platform</p>
          </div>
          <RegisterForm />
        </div>
      </div>
    </div>
  );
};

export default Register;
