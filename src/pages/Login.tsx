
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center mb-8">
        <div className="flex flex-col items-center justify-center">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Academic Quiz Guardian</h1>
            <p className="text-gray-600">Secure Academic Assessment Platform</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default Login;
