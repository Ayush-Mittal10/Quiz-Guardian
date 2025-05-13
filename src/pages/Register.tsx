import React from 'react';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Link } from 'react-router-dom';

const Register = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="Quizzly Logo" className="h-8 w-8" />
            <h1 className="text-xl font-bold text-primary">Quizzly</h1>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Create Account</h1>
            <p className="text-gray-600">Join our secure academic platform</p>
          </div>
          <RegisterForm />
        </div>
      </main>
    </div>
  );
};

export default Register;
