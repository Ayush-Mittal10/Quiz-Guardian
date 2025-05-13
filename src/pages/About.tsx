import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Shield, Eye, Zap, BarChart } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-theme-gray">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="Quizzly Logo" className="h-8 w-8" />
            <h1 className="text-xl font-bold text-primary">Quizzly</h1>
          </Link>
          <Link to="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Welcome to Quizzly</h1>
          <p className="text-xl text-theme-navy max-w-3xl mx-auto">
            Your Sincere Quiz Guardian - A secure and intelligent quiz platform designed to bring integrity, 
            efficiency, and peace of mind to online assessments.
          </p>
        </div>

        {/* Story Section */}
        <Card className="mb-16">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-6">The Story Behind Quizzly</h2>
            <div className="prose max-w-none">
              <p className="text-lg mb-4">
                Hi, I'm Ayush Mittal, a third-year B.Tech student in Computer Science and Engineering at RGIPT. 
                As a tech enthusiast and lifelong learner, I've always believed that technology should solve real problems.
              </p>
              <p className="text-lg">
                The idea for Quizzly was born out of the need for a trustworthy, user-friendly quiz platform that not only 
                simplifies quiz management but also ensures fairness for everyone involved. Driven by curiosity and a "one man army" 
                spirit, I single-handedly designed and developed Quizzly from the ground up.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <Shield className="h-12 w-12 text-theme-teal mb-4" />
              <h3 className="text-xl font-bold mb-2">Security First</h3>
              <p className="text-muted-foreground">
                Every quiz is protected with customizable settings, time limits, and question randomization.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <Eye className="h-12 w-12 text-theme-teal mb-4" />
              <h3 className="text-xl font-bold mb-2">Real-Time Monitoring</h3>
              <p className="text-muted-foreground">
                Advanced features like face detection, gaze tracking, and tab-switch detection ensure honesty.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <Zap className="h-12 w-12 text-theme-teal mb-4" />
              <h3 className="text-xl font-bold mb-2">Seamless Experience</h3>
              <p className="text-muted-foreground">
                Real-time video streaming connects students and professors while maintaining privacy.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <BarChart className="h-12 w-12 text-theme-teal mb-4" />
              <h3 className="text-xl font-bold mb-2">Automated Insights</h3>
              <p className="text-muted-foreground">
                Instant grading and result analysis help focus on learning, not logistics.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tech Stack */}
        <Card className="mb-16">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-6">Tech Stack at a Glance</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">Frontend</h3>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-theme-teal rounded-full mr-2"></span>
                    React (TypeScript)
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-theme-teal rounded-full mr-2"></span>
                    Vite
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-theme-teal rounded-full mr-2"></span>
                    Tailwind CSS
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-theme-teal rounded-full mr-2"></span>
                    shadcn-ui
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">Backend</h3>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-theme-teal rounded-full mr-2"></span>
                    Supabase
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-theme-teal rounded-full mr-2"></span>
                    WebRTC
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-theme-teal rounded-full mr-2"></span>
                    face-api.js
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Note */}
        <Card className="mb-16">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-6">A Personal Note</h2>
            <div className="prose max-w-none">
              <p className="text-lg mb-6">
                Quizzly is more than just a project - it's a reflection of my dedication to building meaningful solutions 
                through technology. I'm always eager to learn, grow, and take on new challenges.
              </p>
              <div className="flex gap-4">
                <a 
                  href="https://www.linkedin.com/in/ayushmittal10" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-theme-teal hover:text-theme-teal/80 transition-colors"
                >
                  LinkedIn
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
                <a 
                  href="https://ayush-mittal.vercel.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-theme-teal hover:text-theme-teal/80 transition-colors"
                >
                  Personal Website
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Let's Make Assessments Better Together</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join us in making assessments smarter, safer, and more transparent.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-theme-teal hover:bg-theme-teal/90">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default About; 