
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProfessorDashboard } from '@/components/dashboard/ProfessorDashboard';
import { StudentDashboard } from '@/components/dashboard/StudentDashboard';
import { Header } from '@/components/layout/Header';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {user?.role === 'professor' ? <ProfessorDashboard /> : <StudentDashboard />}
      </main>
    </div>
  );
};

export default Dashboard;
