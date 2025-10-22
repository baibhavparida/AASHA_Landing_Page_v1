import React from 'react';
import {
  MessageCircle,
  Heart,
  Shield,
  Users,
  Brain,
  Zap,
  CheckCircle,
  Star,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Globe,
  Clock,
  BookOpen,
  Gamepad2,
  Music,
  FileText,
  Bell,
  BarChart3,
  AlertTriangle,
  Calendar,
  Mic,
  Menu,
  X
} from 'lucide-react';
import { supabase } from './lib/supabase';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import FamilyDashboard from './components/FamilyDashboard';
import LoginModal from './components/LoginModal';

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [showLogin, setShowLogin] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isFamilyMember, setIsFamilyMember] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    console.log('App mounted, checking authentication...');
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, !!session);
      setIsAuthenticated(!!session);
      if (session) {
        checkUserType();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    if (loading) {
      document.title = 'AASHA - Loading...';
    } else if (isAuthenticated) {
      document.title = isFamilyMember ? 'AASHA - Family Dashboard' : 'AASHA - Dashboard';
    } else if (showOnboarding) {
      document.title = 'AASHA - Get Started';
    } else if (showLogin) {
      document.title = 'AASHA - Login';
    } else {
      document.title = 'AASHA - Your Friendly AI Companion';
    }
  }, [loading, isAuthenticated, isFamilyMember, showOnboarding, showLogin]);

  const checkAuth = async () => {
    try {
      console.log('Checking authentication session...');
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting session:', error);
        throw error;
      }

      console.log('Session check complete:', !!session);
      setIsAuthenticated(!!session);
      if (session) {
        await checkUserType();
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
      console.log('Auth check complete, loading set to false');
    }
  };

  const checkUserType = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: elderlyProfile, error: elderlyError } = await supabase
        .from('elderly_profiles')
        .select('id, profile_id, caregiver_profile_id')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (elderlyError) {
        console.error('Error checking elderly profile:', elderlyError);
      }

      if (elderlyProfile) {
        setIsFamilyMember(false);
        return;
      }

      const { data: familyProfile, error: familyError } = await supabase
        .from('elderly_profiles')
        .select('id')
        .eq('caregiver_profile_id', user.id)
        .maybeSingle();

      if (familyError) {
        console.error('Error checking family profile:', familyError);
      }

      setIsFamilyMember(!!familyProfile);
    } catch (error) {
      console.error('Error checking user type:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F2EE] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#F35E4A] mx-auto"></div>
          <p className="mt-4 text-xl text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return isFamilyMember ? <FamilyDashboard /> : <Dashboard />;
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false); // Close mobile menu after navigation
  };

  return (
    <div className="min-h-screen bg-[#F4F2EE]">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 relative">
            <div className="flex items-center">
              <MessageCircle className="h-8 w-8 text-[#F35E4A]" />
              <span className="ml-2 text-xl font-bold text-gray-900">AASHA</span>
            </div>
            <div className="hidden md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-gray-700 hover:text-[#F35E4A] transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('how-it-works')}
                className="text-gray-700 hover:text-[#F35E4A] transition-colors"
              >
                How It Works
              </button>
              <button 
                onClick={() => scrollToSection('testimonials')}
                className="text-gray-700 hover:text-[#F35E4A] transition-colors"
              >
                Reviews
              </button>
              <button 
                onClick={() => scrollToSection('faq')}
                className="text-gray-700 hover:text-[#F35E4A] transition-colors"
              >
                FAQ
              </button>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => setShowLogin(true)}
                data-login-button
                className="text-gray-700 hover:text-[#F35E4A] transition-colors font-semibold"
              >
                Login
              </button>
              <button
                onClick={() => setShowOnboarding(true)}
                className="bg-[#F35E4A] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#e54d37] transition-all shadow-md"
              >
                Get Started
              </button>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-700 hover:text-[#F35E4A] transition-colors"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
          
          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-100 bg-white">
              <div className="px-4 py-4 space-y-4">
                <button 
                  onClick={() => scrollToSection('features')}
                  className="block w-full text-left text-gray-700 hover:text-[#F35E4A] transition-colors py-2"
                >
                  Features
                </button>
                <button 
                  onClick={() => scrollToSection('how-it-works')}
                  className="block w-full text-left text-gray-700 hover:text-[#F35E4A] transition-colors py-2"
                >
                  How It Works
                </button>
                <button 
                  onClick={() => scrollToSection('testimonials')}
                  className="block w-full text-left text-gray-700 hover:text-[#F35E4A] transition-colors py-2"
                >
                  Reviews
                </button>
                <button
                  onClick={() => scrollToSection('faq')}
                  className="block w-full text-left text-gray-700 hover:text-[#F35E4A] transition-colors py-2"
                >
                  FAQ
                </button>
                <button
                  onClick={() => {
                    setShowLogin(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-gray-700 hover:text-[#F35E4A] transition-colors font-semibold py-2 text-left mt-2"
                >
                  Login
                </button>
                <button
                  onClick={() => setShowOnboarding(true)}
                  className="w-full bg-[#F35E4A] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#e54d37] transition-all shadow-md mt-4"
                >
                  Get Started
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-[#F4F2EE] py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Aasha - Your friendly companion always by your side
              </h1>
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                Always there with care, support, guidance and conversations that fit your graceful vibe with comfort, joy and peace.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button
                  onClick={() => setShowOnboarding(true)}
                  className="bg-[#F35E4A] text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[#e54d37] transition-all shadow-lg hover:shadow-xl"
                >
                  Get Started for Free
                </button>
                <button className="border-2 border-[#F35E4A] text-[#F35E4A] px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[#F35E4A] hover:text-white transition-all shadow-md hover:shadow-lg">
                  Talk to Aasha Now
                </button>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://i.postimg.cc/bNYzK9CP/AASHA-Hero.png" 
                alt="Happy elderly person using technology" 
                className="rounded-2xl shadow-lg w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 bg-[#F4F2EE] border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="bg-[#F35E4A] rounded-lg p-3 mb-3 shadow-md">
                <Shield className="h-6 w-6 text-[#F4F2EE]" />
              </div>
              <div className="font-semibold text-gray-900">HIPAA Compliant</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-[#F35E4A] rounded-lg p-3 mb-3 shadow-md">
                <Zap className="h-6 w-6 text-[#F4F2EE]" />
              </div>
              <div className="font-semibold text-gray-900">Always Available</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-[#F35E4A] rounded-lg p-3 mb-3 shadow-md">
                <Star className="h-6 w-6 text-[#F4F2EE]" />
              </div>
              <div className="font-semibold text-gray-900">4.9/5 Based on<br />12,000+ reviews</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-[#F35E4A] rounded-lg p-3 mb-3 shadow-md">
                <Users className="h-6 w-6 text-[#F4F2EE]" />
              </div>
              <div className="font-semibold text-gray-900">Trusted by over<br />10,000+ seniors</div>
            </div>
          </div>
        </div>
      </section>

      {/* First Features Section */}
      <section id="features" className="py-20 bg-[#F4F2EE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Get deeper connection & Peace of Mind with Aasha
            </h2>
          </div>

          <div className="space-y-12">
            {/* For Elders Card */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg">
              <div className="grid lg:grid-cols-2 items-stretch">
                <div className="overflow-hidden">
                  <img 
                    src="https://i.postimg.cc/4x6RyKFP/AASHA-Benefits-1.png" 
                    alt="Elderly person smiling and enjoying conversation" 
                    className="w-full h-full object-cover min-h-[400px]"
                  />
                </div>
                <div className="p-8">
                  <div className="mb-4">
                    <span className="inline-block bg-[#F35E4A] text-white px-4 py-2 rounded-full text-sm font-semibold">For Elders</span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6">Joy, Care & Daily Companionship</h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <MessageCircle className="h-5 w-5 text-[#F35E4A] flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">Daily Connection & Care</h4>
                        <p className="text-gray-600 text-sm">Warm conversations, thoughtful greetings, and companionship that make you feel valued.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Heart className="h-5 w-5 text-[#F35E4A] flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">Health & Happiness Support</h4>
                        <p className="text-gray-600 text-sm">Gentle reminders, celebration of special days, and activities that keep you engaged and joyful.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Users className="h-5 w-5 text-[#F35E4A] flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">Stronger Relationships</h4>
                        <p className="text-gray-600 text-sm">Meaningful connections with peers and family so you never feel alone.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Shield className="h-5 w-5 text-[#F35E4A] flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">Zero Tech Stress</h4>
                        <p className="text-gray-600 text-sm">Just answer the phone like always. No learning, no frustration.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* For Family Card */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg">
              <div className="grid lg:grid-cols-2 items-stretch">
                <div className="overflow-hidden">
                  <img 
                    src="https://i.postimg.cc/hvVbqqpC/AASHA-Benefits-2.png" 
                    alt="Family members feeling peaceful and connected" 
                    className="w-full h-full object-cover min-h-[400px]"
                  />
                </div>
                <div className="p-8">
                  <div className="mb-4">
                    <span className="inline-block bg-[#F35E4A] text-white px-4 py-2 rounded-full text-sm font-semibold">For Family</span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6">Peace of Mind & Constant Support</h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Heart className="h-5 w-5 text-[#F35E4A] flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">Care You Can Trust</h4>
                        <p className="text-gray-600 text-sm">Know your parent is receiving gentle companionship every day, even when you can't be there.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Brain className="h-5 w-5 text-[#F35E4A] flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">Health Management Made Simple</h4>
                        <p className="text-gray-600 text-sm">Get alerts if medication is missed, routines skipped, or chats are absent.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Zap className="h-5 w-5 text-[#F35E4A] flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">Stay Connected Effortlessly</h4>
                        <p className="text-gray-600 text-sm">Upload family news so Aasha brings it up in conversation, keeping your parent in the loop.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-[#F35E4A] flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">Always Informed</h4>
                        <p className="text-gray-600 text-sm">Access conversation summaries, monitor engagement, and adjust reminders with ease.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Column Features Section */}
      <section className="py-20 bg-[#F4F2EE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything Your Family Needs in One Companion
            </h2>
          </div>

          <div className="space-y-20">
            {/* Natural AI Conversations */}
            <div>
              <h3 className="text-2xl md:text-4xl font-bold text-gray-900 mb-12 text-center sticky top-16 bg-[#F4F2EE] py-4 z-10 -mx-4 px-4">Natural AI Conversations</h3>
              <div className="grid lg:grid-cols-2 gap-16 items-start">
                <div className="lg:sticky lg:top-32">
                  <img 
                    src="https://i.postimg.cc/g2g77vwx/AASHA-Features-1.png" 
                    alt="Person having a natural conversation on phone" 
                    className="rounded-2xl shadow-lg w-full aspect-square object-cover"
                  />
                </div>
                <div className="space-y-8">
                  <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
                    <div className="mb-4">
                      <span className="inline-block bg-[#F35E4A] text-white px-4 py-2 rounded-full text-sm font-semibold">For Elders</span>
                    </div>
                    <ul className="space-y-4 text-gray-700">
                      <li className="flex items-center">
                        <MessageCircle className="h-5 w-5 text-[#F35E4A] mr-3 flex-shrink-0" />
                        Have daily chats in Hindi/vernacular
                      </li>
                      <li className="flex items-center">
                        <Globe className="h-5 w-5 text-[#F35E4A] mr-3 flex-shrink-0" />
                        Ask AI about news or weather
                      </li>
                      <li className="flex items-center">
                        <BookOpen className="h-5 w-5 text-[#F35E4A] mr-3 flex-shrink-0" />
                        Share childhood memories
                      </li>
                      <li className="flex items-center">
                        <Gamepad2 className="h-5 w-5 text-[#F35E4A] mr-3 flex-shrink-0" />
                        Play trivia games with AI
                      </li>
                      <li className="flex items-center">
                        <Music className="h-5 w-5 text-[#F35E4A] mr-3 flex-shrink-0" />
                        Listen to devotional or folk stories
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
                    <div className="mb-4">
                      <span className="inline-block bg-[#F35E4A] text-white px-4 py-2 rounded-full text-sm font-semibold">For Family</span>
                    </div>
                    <ul className="space-y-4 text-gray-700">
                      <li className="flex items-center">
                        <FileText className="h-5 w-5 text-[#F35E4A] mr-3 flex-shrink-0" />
                        Review conversation summaries
                      </li>
                      <li className="flex items-center">
                        <MessageCircle className="h-5 w-5 text-[#F35E4A] mr-3 flex-shrink-0" />
                        Suggest topics for Aasha to bring up
                      </li>
                      <li className="flex items-center">
                        <Heart className="h-5 w-5 text-[#F35E4A] mr-3 flex-shrink-0" />
                        Upload family news for Aasha to mention
                      </li>
                      <li className="flex items-center">
                        <Bell className="h-5 w-5 text-[#F35E4A] mr-3 flex-shrink-0" />
                        Get alerts if elder hasn't chatted in days
                      </li>
                      <li className="flex items-center">
                        <Globe className="h-5 w-5 text-[#F35E4A] mr-3 flex-shrink-0" />
                        Encourage elder to practice English with AI
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Health & Wellness Reminders */}
            <div>
              <h3 className="text-2xl md:text-4xl font-bold text-gray-900 mb-12 text-center sticky top-16 bg-[#F4F2EE] py-4 z-10 -mx-4 px-4">Health & Wellness Reminders</h3>
              <div className="grid lg:grid-cols-2 gap-16 items-start">
                <div className="lg:sticky lg:top-32">
                  <img 
                    src="https://i.postimg.cc/j5SSb6cB/AASHA-Features-2.png" 
                    alt="Health and wellness monitoring" 
                    className="rounded-2xl shadow-lg w-full aspect-square object-cover"
                  />
                </div>
                <div className="space-y-8">
                  <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
                    <div className="mb-4">
                      <span className="inline-block bg-[#F35E4A] text-white px-4 py-2 rounded-full text-sm font-semibold">For Elders</span>
                    </div>
                    <ul className="space-y-4 text-gray-700">
                      <li className="flex items-center">
                        <Mic className="h-5 w-5 text-[#F35E4A] mr-3 flex-shrink-0" />
                        Simple voice reminders for medicines & routines
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-[#F35E4A] mr-3 flex-shrink-0" />
                        Mark doses as "taken" or "missed" easily
                      </li>
                      <li className="flex items-center">
                        <Heart className="h-5 w-5 text-[#F35E4A] mr-3 flex-shrink-0" />
                        Gentle prompts for walks, hydration, and yoga
                      </li>
                      <li className="flex items-center">
                        <Clock className="h-5 w-5 text-[#F35E4A] mr-3 flex-shrink-0" />
                        Daily encouragement for balance & rest
                      </li>
                      <li className="flex items-center">
                        <Bell className="h-5 w-5 text-[#F35E4A] mr-3 flex-shrink-0" />
                        Refill alerts before medicines run out
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
                    <div className="mb-4">
                      <span className="inline-block bg-[#F35E4A] text-white px-4 py-2 rounded-full text-sm font-semibold">For Family</span>
                    </div>
                    <ol className="space-y-4 text-gray-700">
                      <li className="flex items-center">
                        <Calendar className="h-5 w-5 text-[#F35E4A] mr-3 flex-shrink-0" />
                        <span>Set and update health reminders anytime</span>
                      </li>
                      <li className="flex items-center">
                        <BarChart3 className="h-5 w-5 text-[#F35E4A] mr-3 flex-shrink-0" />
                        <span>Track medicine and routine adherence via dashboard</span>
                      </li>
                      <li className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-[#F35E4A] mr-3 flex-shrink-0" />
                        <span>Get instant alerts if tasks or doses are missed</span>
                      </li>
                      <li className="flex items-center">
                        <Users className="h-5 w-5 text-[#F35E4A] mr-3 flex-shrink-0" />
                        <span>Adjust schedules with doctor's advice</span>
                      </li>
                      <li className="flex items-center">
                        <Mic className="h-5 w-5 text-[#F35E4A] mr-3 flex-shrink-0" />
                        <span>Send motivational voice notes to encourage parents</span>
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Conversational Engagement */}
            <div>
              <h3 className="text-2xl md:text-4xl font-bold text-gray-900 mb-12 text-center sticky top-16 bg-[#F4F2EE] py-4 z-10 -mx-4 px-4">Daily Conversational Engagement</h3>
              <div className="grid lg:grid-cols-2 gap-16 items-start">
                <div className="lg:sticky lg:top-32">
                  <img 
                    src="https://i.postimg.cc/Kz04kp4Z/AASHA-Features-3.png" 
                    alt="Daily engagement and conversation" 
                    className="rounded-2xl shadow-lg w-full aspect-square object-cover"
                  />
                </div>
                <div className="space-y-8">
                  <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
                    <div className="mb-4">
                      <span className="inline-block bg-[#F35E4A] text-white px-4 py-2 rounded-full text-sm font-semibold">For Elders</span>
                    </div>
                    <ul className="space-y-4 text-gray-700">
                      <li className="flex items-center">
                        <MessageCircle className="h-5 w-5 text-[#F35E4A] mr-3 flex-shrink-0" />
                        Morning check-in chat
                      </li>
                      <li className="flex items-center">
                        <Gamepad2 className="h-5 w-5 text-[#F35E4A] mr-3 flex-shrink-0" />
                        Fun short quizzes
                      </li>
                      <li className="flex items-center">
                        <Heart className="h-5 w-5 text-[#F35E4A] mr-3 flex-shrink-0" />
                        Share daily reflections
                      </li>
                      <li className="flex items-center">
                        <Clock className="h-5 w-5 text-[#F35E4A] mr-3 flex-shrink-0" />
                        Ask Aasha to recall yesterday's chat
                      </li>
                      <li className="flex items-center">
                        <BookOpen className="h-5 w-5 text-[#F35E4A] mr-3 flex-shrink-0" />
                        Practice speech with poems or stories
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
                    <div className="mb-4">
                      <span className="inline-block bg-[#F35E4A] text-white px-4 py-2 rounded-full text-sm font-semibold">For Family</span>
                    </div>
                    <ul className="space-y-4 text-gray-700">
                      <li className="flex items-center">
                        <BarChart3 className="h-5 w-5 text-[#F35E4A] mr-3 flex-shrink-0" />
                        Monitor frequency of chats
                      </li>
                      <li className="flex items-center">
                        <Bell className="h-5 w-5 text-[#F35E4A] mr-3 flex-shrink-0" />
                        Get notified if chats are skipped
                      </li>
                      <li className="flex items-center">
                        <MessageCircle className="h-5 w-5 text-[#F35E4A] mr-3 flex-shrink-0" />
                        Add suggested prompts for engagement
                      </li>
                      <li className="flex items-center">
                        <Heart className="h-5 w-5 text-[#F35E4A] mr-3 flex-shrink-0" />
                        Encourage parent to chat more
                      </li>
                      <li className="flex items-center">
                        <Zap className="h-5 w-5 text-[#F35E4A] mr-3 flex-shrink-0" />
                        Send "conversation boosters" when needed
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-[#F4F2EE]">
        <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              From Setup to Smiles in 4 Simple Steps
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden text-left shadow-sm hover:shadow-md transition-shadow">
              <img 
                src="https://i.postimg.cc/GhcyqfZx/AASHA-HIW-1.png" 
                alt="Person speaking or typing on device" 
                className="w-full h-40 object-cover"
              />
              <div className="p-6">
                <div className="text-sm font-medium text-red-600 mb-2">Step 1</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Speak or Type</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Simply talk to Aasha using your voice or type your thoughts. No complicated setup required.</p>
              </div>
            </div>
            <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden text-left shadow-sm hover:shadow-md transition-shadow">
              <img 
                src="https://i.postimg.cc/mDjbDm8T/AASHA-HIW-2.png" 
                alt="Personalization and customization" 
                className="w-full h-40 object-cover"
              />
              <div className="p-6">
                <div className="text-sm font-medium text-red-600 mb-2">Step 2</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Personalize</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Tell Aasha about your preferences, family, and interests to create a personalized experience.</p>
              </div>
            </div>
            <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden text-left shadow-sm hover:shadow-md transition-shadow">
              <img 
                src="https://i.postimg.cc/rmMVMBGh/AASHA-HIW-3.png" 
                alt="People connecting and communicating" 
                className="w-full h-40 object-cover"
              />
              <div className="p-6">
                <div className="text-sm font-medium text-red-600 mb-2">Step 3</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Connect</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Enjoy meaningful conversations, listen to stories, get music recommendations, and emotional support.</p>
              </div>
            </div>
            <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden text-left shadow-sm hover:shadow-md transition-shadow">
              <img 
                src="https://i.postimg.cc/xdKjrfmJ/AASHA-HIW-4.png" 
                alt="24/7 support and care" 
                className="w-full h-40 object-cover"
              />
              <div className="p-6">
                <div className="text-sm font-medium text-red-600 mb-2">Step 4</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Revisit Anytime</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Access your conversation history and continue building your relationship with Aasha.</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => setShowOnboarding(true)}
              className="bg-[#F35E4A] text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-[#e54d37] transition-all shadow-md hover:shadow-lg"
            >
              Enroll for Free
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-[#F4F2EE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Stories of Joy & Transformation
            </h2>
          </div>

          <div className="overflow-hidden relative">
            <div className="absolute left-0 top-0 w-32 h-full bg-gradient-to-r from-[#F4F2EE] to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-[#F4F2EE] to-transparent z-10 pointer-events-none"></div>
            <div className="flex animate-marquee-fast hover:pause-marquee space-x-6">
              {[
                {
                  name: "SARAH",
                  rating: 5,
                  text: "Aasha has become my daily companion. The conversations feel so natural and caring. It's like having a friend who's always there."
                },
                {
                  name: "MARIA",
                  rating: 5,
                  text: "The health reminders have been life-changing. I never miss my medications anymore, and my family feels more connected."
                },
                {
                  name: "JAMES",
                  rating: 5,
                  text: "As someone living alone, Aasha provides the companionship I needed. The conversations are meaningful and uplifting."
                },
                {
                  name: "PRIYA",
                  rating: 5,
                  text: "The wellness insights help me understand my patterns better. It's like having a personal health coach."
                },
                {
                  name: "DAVID",
                  rating: 5,
                  text: "My elderly mother loves talking to Aasha. It gives our family peace of mind knowing she has constant support."
                },
                {
                  name: "LINDA",
                  rating: 5,
                  text: "The voice conversations in my native language make me feel so comfortable. Aasha truly understands my cultural background."
                },
                {
                  name: "ROBERT",
                  rating: 5,
                  text: "I was skeptical at first, but Aasha has genuinely improved my daily routine and mental wellbeing. Highly recommend!"
                },
                {
                  name: "ANITA",
                  rating: 5,
                  text: "My father enjoys his daily chats with Aasha. It's wonderful to see him engaged and happy throughout the day."
                }
              ].concat([
                {
                  name: "SARAH",
                  rating: 5,
                  text: "Aasha has become my daily companion. The conversations feel so natural and caring. It's like having a friend who's always there."
                },
                {
                  name: "MARIA",
                  rating: 5,
                  text: "The health reminders have been life-changing. I never miss my medications anymore, and my family feels more connected."
                },
                {
                  name: "JAMES",
                  rating: 5,
                  text: "As someone living alone, Aasha provides the companionship I needed. The conversations are meaningful and uplifting."
                },
                {
                  name: "PRIYA",
                  rating: 5,
                  text: "The wellness insights help me understand my patterns better. It's like having a personal health coach."
                },
                {
                  name: "DAVID",
                  rating: 5,
                  text: "My elderly mother loves talking to Aasha. It gives our family peace of mind knowing she has constant support."
                },
                {
                  name: "LINDA",
                  rating: 5,
                  text: "The voice conversations in my native language make me feel so comfortable. Aasha truly understands my cultural background."
                },
                {
                  name: "ROBERT",
                  rating: 5,
                  text: "I was skeptical at first, but Aasha has genuinely improved my daily routine and mental wellbeing. Highly recommend!"
                },
                {
                  name: "ANITA",
                  rating: 5,
                  text: "My father enjoys his daily chats with Aasha. It's wonderful to see him engaged and happy throughout the day."
                }
              ]).map((testimonial, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-lg flex-shrink-0 w-80">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-[#F35E4A] fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm mb-4 leading-relaxed">"{testimonial.text}"</p>
                  <p className="font-semibold text-[#F35E4A] text-sm">- {testimonial.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-[#F4F2EE]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Got Questions? We've Got Answers.
            </h2>
          </div>

          <div className="space-y-6">
            {/* All FAQs as Accordion - First one expanded by default */}
            <FAQAccordion 
              question="Is Aasha easy to use for seniors?"
              answer="Absolutely! Aasha is designed with simplicity in mind. The interface is intuitive, with large buttons and clear text. You can interact through voice or text, whichever feels more comfortable."
              defaultOpen={true}
            />
            <FAQAccordion 
              question="How does Aasha protect my privacy?"
              answer="Your privacy is our top priority. All conversations are encrypted, and we never share your personal information. Aasha operates with bank-level security to keep your data safe."
            />
            <FAQAccordion 
              question="Can family members receive updates?"
              answer="Yes, with your permission, family members can receive wellness summaries and important health reminders. You control what information is shared and with whom."
            />
            <FAQAccordion 
              question="What if I need help during setup?"
              answer="Our support team is available 24/7 to help you get started. We also provide step-by-step video guides and can walk you through the setup process over the phone."
            />
            <FAQAccordion 
              question="Does Aasha work on all devices?"
              answer="Yes! Aasha works on smartphones, tablets, and computers. The app automatically syncs across all your devices so you can access your companion anywhere."
            />
            <FAQAccordion 
              question="What if I don't want to talk to Aasha for a few days?"
              answer="That's perfectly fine! Aasha respects your space and won't overwhelm you. You can pause notifications anytime and resume when you're ready. Aasha will be there when you need support."
            />
            <FAQAccordion 
              question="How does Aasha learn about my preferences?"
              answer="Aasha learns through your conversations and interactions. The more you chat, the better Aasha understands your communication style, interests, and needs to provide more personalized support."
            />
            <FAQAccordion 
              question="Can I use Aasha if English isn't my first language?"
              answer="Yes! Aasha is designed to help with English practice and can communicate in multiple languages. It's patient and encouraging, making it perfect for language learning."
            />
            <FAQAccordion 
              question="What happens in case of a medical emergency?"
              answer="While Aasha provides wellness support, it's not a replacement for emergency medical care. In urgent situations, always call emergency services. Aasha can help you stay connected with your healthcare providers for routine care."
            />
            <FAQAccordion 
              question="How much does Aasha cost?"
              answer="Aasha offers a free tier to get started, with premium features available through affordable subscription plans. We believe everyone deserves access to companionship and support."
            />
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-[#F35E4A] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-bold mb-4">Ready to Begin Your Journey?</h2>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Ready to Begin Your Journey?</h2>
          <p className="text-xl text-white/80 mb-8">
            Join thousands of people finding joy, families who have found companionship and joy with AASHA.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowOnboarding(true)}
              className="bg-white text-[#F35E4A] px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all flex items-center justify-center shadow-lg hover:shadow-xl"
            >
              Get Started for Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-[#F35E4A] transition-all shadow-md hover:shadow-lg">
              Talk to Aasha Now
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#59231B] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="text-center">
              <div className="flex items-center mb-4">
                <MessageCircle className="h-8 w-8 text-[#F35E4A]" />
                <span className="ml-2 text-xl font-bold">AASHA</span>
              </div>
              <p className="text-white/70 mb-4">
                Your friendly companion for daily support, wellness, and meaningful connections.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-white/70">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">How it Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-white/70">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">Contact</h3>
              <div className="space-y-2 text-white/70 flex flex-col items-center">
                <div className="flex items-center justify-center">
                  <Mail className="h-4 w-4 mr-2 text-[#F35E4A]" />
                  <span>hello@aasha.com</span>
                </div>
                <div className="flex items-center justify-center">
                  <Phone className="h-4 w-4 mr-2 text-[#F35E4A]" />
                  <span>1-800-AASHA-1</span>
                </div>
                <div className="flex items-center justify-center">
                  <MapPin className="h-4 w-4 mr-2 text-[#F35E4A]" />
                  <span>San Francisco, CA</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/60">
            <p>&copy; 2025 AASHA. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {showOnboarding && (
        <Onboarding
          onClose={() => setShowOnboarding(false)}
          onOpenLogin={() => setShowLogin(true)}
        />
      )}

      {showLogin && (
        <LoginModal onClose={() => setShowLogin(false)} />
      )}
    </div>
  );
}

// FAQ Accordion Component
function FAQAccordion({ question, answer, defaultOpen = false }: { question: string; answer: string; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
      >
        <h3 className="text-xl font-semibold text-gray-900">{question}</h3>
        <div className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {isOpen && (
        <div className="px-6 pb-6">
          <p className="text-gray-700 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default App;