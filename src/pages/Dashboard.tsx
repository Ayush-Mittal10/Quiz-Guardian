
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProfessorDashboard } from '@/components/dashboard/ProfessorDashboard';
import { StudentDashboard } from '@/components/dashboard/StudentDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-primary">Academic Quiz Guardian</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.name} ({user?.role})
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {user?.role === 'professor' ? <ProfessorDashboard /> : <StudentDashboard />}
      </main>
    </div>
  );
};

export default Dashboard;
