import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Home from "./pages/Home";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateQuiz from "./pages/CreateQuiz";
import EditQuiz from "./pages/EditQuiz";
import JoinQuiz from "./pages/JoinQuiz";
import TakeQuiz from "./pages/TakeQuiz";
import MonitorQuiz from "./pages/MonitorQuiz";
import QuizSubmitted from "./pages/QuizSubmitted";
import Results from "./pages/Results";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster position="bottom-right" />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/app" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              
              {/* Professor routes */}
              <Route path="/create-quiz" element={
                <ProtectedRoute allowedRoles={['professor']}>
                  <CreateQuiz />
                </ProtectedRoute>
              } />
              <Route path="/edit-quiz/:quizId" element={
                <ProtectedRoute allowedRoles={['professor']}>
                  <EditQuiz />
                </ProtectedRoute>
              } />
              <Route path="/monitor-quiz/:quizId" element={
                <ProtectedRoute allowedRoles={['professor']}>
                  <MonitorQuiz />
                </ProtectedRoute>
              } />
              <Route path="/results/:quizId" element={
                <ProtectedRoute allowedRoles={['professor']}>
                  <Results />
                </ProtectedRoute>
              } />
              
              {/* Student routes */}
              <Route path="/join-quiz/:testId" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <JoinQuiz />
                </ProtectedRoute>
              } />
              <Route path="/take-quiz/:testId" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <TakeQuiz />
                </ProtectedRoute>
              } />
              <Route path="/quiz-submitted" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <QuizSubmitted />
                </ProtectedRoute>
              } />
              
              <Route path="/unauthorized" element={<Unauthorized />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
