import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

// Icons
import { 
  Settings, 
  Eye, 
  Video,
  ArrowRight,
  Github,
  Twitter,
  Linkedin,
  LogOut
} from 'lucide-react';

const Home = () => {
  // Get the current year for the copyright text
  const currentYear = new Date().getFullYear();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-theme-gray">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="container-theme py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="Quizzly Logo" className="h-9 w-9" />
            <span className="text-xl font-heading font-bold text-theme-navy">Quizzly</span>
          </div>
          <div className="flex items-center space-x-6">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-theme-navy">Hello, <span className="font-accent text-theme-peach">{user?.name}</span></span>
                <Link to="/dashboard">
                  <Button variant="secondary" size="default">
                    Dashboard
                  </Button>
                </Link>
                <Button variant="ghost" size="default" onClick={handleLogout} className="gap-2">
                  <LogOut size={16} />
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-theme-navy hover:text-theme-teal transition-colors">
                  Login
                </Link>
                <Link to="/register">
                  <Button variant="default" size="default">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-section bg-gradient-peach-lavender">
        <div className="container-theme grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-h1 text-black font-bold font-heading leading-tight mb-4">
              Elevate Your Quizzes
            </h1>
            <p className="text-xl text-theme-navy mb-8">
              A free, secure, and smarter way to test - better than Google Forms.
            </p>
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button 
                  className="bg-theme-teal hover:bg-theme-teal/90 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            ) : (
              <Link to="/register">
                <Button 
                  className="bg-theme-navy hover:bg-theme-navy/90 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 border-2 border-theme-peach"
                >
                  Start Quizzing
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            )}
          </div>
          <div className="flex justify-center">
            <img 
              src="/hero-image.webp" 
              alt="Teens collaborating on quizzes" 
              className="max-w-full h-auto rounded-lg shadow-lg hover-scale"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-section bg-white">
        <div className="container-theme">
          <h2 className="text-h2 font-bold text-center mb-12">
            Why It's Awesome
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="teen-card p-6">
              <div className="text-theme-teal mb-4">
                <Settings size={48} />
              </div>
              <h3 className="text-h3 font-bold text-theme-navy mb-3">Custom Quizzes</h3>
              <p className="text-theme-text-secondary">
                Timers, randomization, auto-grading. Create the perfect quiz experience.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="teen-card p-6">
              <div className="text-theme-teal mb-4">
                <Eye size={48} />
              </div>
              <h3 className="text-h3 font-bold text-theme-navy mb-3">Stay Focused</h3>
              <p className="text-theme-text-secondary">
                Tab alerts and gaze tracking. Keep distractions away during test time.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="teen-card p-6">
              <div className="text-theme-teal mb-4">
                <Video size={48} />
              </div>
              <h3 className="text-h3 font-bold text-theme-navy mb-3">Video Connect</h3>
              <p className="text-theme-text-secondary">
                Low-latency WebRTC monitoring. Get help when you need it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-section bg-theme-gray">
        <div className="container-theme">
          <h2 className="text-h2 font-bold text-theme-lavender text-center mb-12">What Students Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="teen-card p-6">
              <p className="text-theme-text-secondary italic mb-4">
                "Quizzes feel less stressful now. I can focus better without getting distracted."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-theme-peach rounded-full mr-3 flex items-center justify-center text-white font-bold">A</div>
                <div>
                  <p className="font-medium text-theme-navy">Alex</p>
                  <p className="text-sm text-theme-text-secondary font-accent">High School Student</p>
                </div>
              </div>
            </div>
            
            {/* Testimonial 2 */}
            <div className="teen-card p-6">
              <p className="text-theme-text-secondary italic mb-4">
                "My grades are up! The focused environment helps me concentrate and do better on tests."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-theme-teal rounded-full mr-3 flex items-center justify-center text-white font-bold">M</div>
                <div>
                  <p className="font-medium text-theme-navy">Mia</p>
                  <p className="text-sm text-theme-text-secondary font-accent">College Freshman</p>
                </div>
              </div>
            </div>
            
            {/* Testimonial 3 */}
            <div className="teen-card p-6">
              <p className="text-theme-text-secondary italic mb-4">
                "The interface is so much better than other quiz platforms. Modern and easy to use."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-theme-lavender rounded-full mr-3 flex items-center justify-center text-white font-bold">J</div>
                <div>
                  <p className="font-medium text-theme-navy">Jordan</p>
                  <p className="text-sm text-theme-text-secondary font-accent">High School Junior</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="py-section bg-white">
        <div className="container-theme text-center">
          <h2 className="text-h3 font-bold mb-6 text-theme-navy">Ready to make quizzes fun?</h2>
          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button 
                className="bg-theme-teal hover:bg-theme-teal/90 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Go to Your Dashboard
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          ) : (
            <Link to="/register">
              <Button 
                className="bg-theme-navy hover:bg-theme-navy/90 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 border-2 border-theme-peach"
              >
                Create a Quiz
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-theme-navy text-white py-12">
        <div className="container-theme">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src="/logo.png" alt="Quizzly Logo" className="h-8 w-8" />
                <span className="text-xl font-heading font-bold text-white">Quizzly</span>
              </div>
              <p className="text-gray-300">Secure and simple quiz management for students.</p>
            </div>
            
            <div>
              <h3 className="font-bold mb-4 text-theme-teal">Company</h3>
              <ul className="space-y-2">
              <li><Link to="/about" className="text-gray-300 hover:text-theme-teal transition-colors">About Us</Link></li>
              <li><a href="#" className="text-gray-300 hover:text-theme-teal transition-colors">Careers</a></li>
              <li><a href="#" className="text-gray-300 hover:text-theme-teal transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-4 text-theme-teal">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-theme-teal transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-300 hover:text-theme-teal transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-gray-300 hover:text-theme-teal transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-4 text-theme-teal">Connect</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-300 hover:text-theme-teal transition-colors">
                  <Github size={24} />
                </a>
                <a href="#" className="text-gray-300 hover:text-theme-teal transition-colors">
                  <Twitter size={24} />
                </a>
                <a href="#" className="text-gray-300 hover:text-theme-teal transition-colors">
                  <Linkedin size={24} />
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-300">© {currentYear} Quizzly. <span className="font-accent">Let's ace it!</span></p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home; 