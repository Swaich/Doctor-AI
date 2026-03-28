import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Search, MapPin, Zap, Stethoscope, UserCheck, Clock, Lock, X, Menu } from 'lucide-react';
import { buildApiUrl, API_ENDPOINTS } from '../../config/api';

const LandingPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Don't auto-load stores on page load - let user search when they want

  // Close mobile menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuOpen && !event.target.closest('header')) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setMobileMenuOpen(false); // Close mobile menu on search
    
    if (!searchQuery.trim()) {
      setSearchError('Please enter a search term');
      return;
    }

    setSearching(true);
    setSearchError('');
    setSearchResults([]);

    try {
      const response = await fetch(buildApiUrl(`${API_ENDPOINTS.STORES.SEARCH}?query=${encodeURIComponent(searchQuery)}`));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.message) {
        // Error response from backend
        setSearchError(data.message);
        setSearchResults([]);
      } else if (Array.isArray(data)) {
        setSearchResults(data);
        if (data.length === 0) {
          setSearchError(`No medical stores found for "${searchQuery}". Try searching for a different city, country, or store name.`);
        }
      } else {
        setSearchError('Unexpected response format');
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Failed to search stores. Please check if the backend server is running.');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchError('');
    setSearchResults([]); // Simply clear the results without making API call
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer flex-shrink-0" onClick={() => window.location.href = '/'}>
              <Stethoscope className="w-8 h-8 text-primary-500" />
              <h1 className="text-xl font-bold text-secondary-900">MegaHealth</h1>
            </div>

            {/* Medical Store Search - Hidden on mobile, shown in mobile menu */}
            <div className="hidden md:flex flex-1 max-w-2xl">
              <form onSubmit={handleSearch} className="relative w-full">
                <div className="flex items-center bg-secondary-50 border-2 border-secondary-200 rounded-xl px-4 py-2 transition-all duration-300 focus-within:border-primary-500 focus-within:bg-white focus-within:shadow-soft">
                  <MapPin className="w-5 h-5 text-secondary-400 mr-3 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search medical stores in Pakistan (e.g., Karachi, Lahore, Islamabad)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-secondary-900 placeholder-secondary-400"
                  />
                  {/* Clear button */}
                  {searchQuery && (
                    <button 
                      type="button"
                      onClick={handleClearSearch}
                      className="p-1 hover:bg-secondary-200 rounded-full transition-colors mr-2"
                    >
                      <X size={16} className="text-secondary-400" />
                    </button>
                  )}
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-sm ml-2 flex-shrink-0" 
                    disabled={searching}
                  >
                    <Search size={16} />
                    <span className="hidden lg:inline ml-1">{searching ? 'Searching...' : 'Search'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-3 flex-shrink-0">
              <button onClick={() => navigate('/login')} className="btn btn-secondary btn-sm">
                Login
              </button>
              <button onClick={() => navigate('/register')} className="btn btn-primary btn-sm">
                Sign Up
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 rounded-lg hover:bg-secondary-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu size={24} className="text-secondary-600" />
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-secondary-200 py-4 space-y-4">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="relative">
                <div className="flex items-center bg-secondary-50 border-2 border-secondary-200 rounded-xl px-4 py-3 transition-all duration-300 focus-within:border-primary-500 focus-within:bg-white focus-within:shadow-soft">
                  <MapPin className="w-5 h-5 text-secondary-400 mr-3 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search stores in Pakistan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-secondary-900 placeholder-secondary-400"
                  />
                  {/* Clear button */}
                  {searchQuery && (
                    <button 
                      type="button"
                      onClick={handleClearSearch}
                      className="p-1 hover:bg-secondary-200 rounded-full transition-colors mr-2"
                    >
                      <X size={16} className="text-secondary-400" />
                    </button>
                  )}
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-sm ml-2 flex-shrink-0" 
                    disabled={searching}
                  >
                    <Search size={16} />
                  </button>
                </div>
              </form>

              {/* Mobile Auth Buttons */}
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    navigate('/login');
                    setMobileMenuOpen(false);
                  }} 
                  className="btn btn-secondary w-full"
                >
                  Login
                </button>
                <button 
                  onClick={() => {
                    navigate('/register');
                    setMobileMenuOpen(false);
                  }} 
                  className="btn btn-primary w-full"
                >
                  Sign Up
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

        {/* Search Results */}
      {(searchResults.length > 0 || searchError) && (
        <section className="py-16 bg-secondary-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {searchError && (
              <div className="bg-danger-50 border border-danger-200 text-danger-700 px-6 py-4 rounded-xl mb-8 text-center">
                <p className="font-medium mb-2">{searchError}</p>
                <p className="text-sm text-danger-600">
                  Try searching for: "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", or any Pakistan city
                </p>
              </div>
            )}
            
            {searchResults.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-12">
                  <h2 className="text-3xl font-bold text-secondary-900 text-center flex-1">
                    {searchQuery ? `Medical Stores for "${searchQuery}"` : 'Medical Stores in Pakistan'}
                  </h2>
                  <button 
                    onClick={handleClearSearch}
                    className="p-2 hover:bg-secondary-200 rounded-full transition-colors ml-4"
                    title="Close search results"
                  >
                    <X size={24} className="text-secondary-500" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.map((store, index) => (
                    <div key={index} className="card card-hover">
                      <div className="card-body">
                        <MapPin className="w-6 h-6 text-primary-500 mb-4" />
                        <h3 className="text-lg font-semibold text-secondary-900 mb-3">{store.name}</h3>
                        <div className="mb-3 pb-3 border-b border-secondary-200">
                          <p className="text-primary-600 font-semibold">{store.city}, {store.state}</p>
                          <p className="text-secondary-500 text-sm">{store.country}</p>
                        </div>
                        <p className="text-secondary-600 text-sm mb-2 leading-relaxed">{store.street}</p>
                        
                        {/* Phone Number */}
                        {store.phone && store.phone !== 'N/A' && (
                          <p className="text-success-600 text-sm font-medium mb-2">📞 {store.phone}</p>
                        )}
                        
                        {/* Opening Hours */}
                        {store.opening_hours && store.opening_hours !== 'N/A' && (
                          <p className="text-blue-600 text-sm mb-2">🕒 {store.opening_hours}</p>
                        )}
                        
                        {/* Distance - only show if not N/A */}
                        {store.distance && store.distance !== 'N/A' && (
                          <p className="text-primary-600 font-semibold text-sm">📍 {store.distance} km away</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* Hero Section with Modern Design */}
      <section className="relative overflow-hidden py-20 bg-gradient-to-b from-secondary-50 to-white">
        {/* Background Decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-[800px] h-[800px] border border-secondary-200 rounded-full opacity-30"></div>
            <div className="absolute inset-16 border border-secondary-200 rounded-full opacity-20"></div>
            <div className="absolute inset-32 border border-secondary-200 rounded-full opacity-10"></div>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white border-2 border-secondary-200 rounded-full mb-8">
              <Activity className="w-8 h-8 text-primary-500" />
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-secondary-900 mb-6 leading-tight">
              Your Health, Our Priority
            </h1>
            
            <p className="text-lg md:text-xl text-secondary-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Connect with certified doctors online. Book consultations, get prescriptions, 
              and access quality healthcare from the comfort of your home.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <button onClick={() => navigate('/register')} className="btn btn-primary btn-lg">
                Get Started
                <Zap className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-secondary-400">
              Trusted by 25,000+ Patients Nationwide
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="rounded-2xl overflow-hidden shadow-large">
              <img 
                src="https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=1200&h=800&fit=crop&q=80" 
                alt="Professional doctors team in white coats providing healthcare services" 
                className="w-full h-auto max-h-96 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

    

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 text-center mb-16">Why Choose MegaHealth?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-8 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:bg-secondary-50">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-xl mb-6">
                <UserCheck className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-3">Expert Doctors</h3>
              <p className="text-secondary-600 leading-relaxed">Connect with certified and experienced healthcare professionals</p>
            </div>
            <div className="text-center p-8 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:bg-secondary-50">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-xl mb-6">
                <Clock className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-3">Easy Booking</h3>
              <p className="text-secondary-600 leading-relaxed">Book appointments instantly with our simple slot system</p>
            </div>
            <div className="text-center p-8 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:bg-secondary-50">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-xl mb-6">
                <Activity className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-3">Video Consultations</h3>
              <p className="text-secondary-600 leading-relaxed">Face-to-face consultations from anywhere, anytime</p>
            </div>
            <div className="text-center p-8 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:bg-secondary-50">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-xl mb-6">
                <Lock className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-3">Secure & Private</h3>
              <p className="text-secondary-600 leading-relaxed">Your health data is encrypted and completely confidential</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 text-center mb-16">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="card card-hover text-center">
              <div className="card-body">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-500 text-white rounded-full text-xl font-bold mb-6">
                  1
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-3">Sign Up</h3>
                <p className="text-secondary-600 leading-relaxed">Create your account in minutes</p>
              </div>
            </div>
            <div className="card card-hover text-center">
              <div className="card-body">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-500 text-white rounded-full text-xl font-bold mb-6">
                  2
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-3">Find a Doctor</h3>
                <p className="text-secondary-600 leading-relaxed">Browse and select from our network of specialists</p>
              </div>
            </div>
            <div className="card card-hover text-center">
              <div className="card-body">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-500 text-white rounded-full text-xl font-bold mb-6">
                  3
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-3">Book Appointment</h3>
                <p className="text-secondary-600 leading-relaxed">Choose a convenient time slot</p>
              </div>
            </div>
            <div className="card card-hover text-center">
              <div className="card-body">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-500 text-white rounded-full text-xl font-bold mb-6">
                  4
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-3">Get Consultation</h3>
                <p className="text-secondary-600 leading-relaxed">Connect via video call and receive care</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Technology Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-6">Trusted Healthcare Technology</h2>
              <p className="text-lg text-secondary-600 mb-10 leading-relaxed">
                Our platform uses cutting-edge technology to ensure secure, reliable, and 
                high-quality healthcare delivery. With end-to-end encryption and HIPAA-compliant 
                infrastructure, your health information is always protected.
              </p>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center p-6 bg-secondary-50 rounded-xl border border-secondary-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-medium">
                  <h3 className="text-2xl font-bold text-primary-600 mb-2">25,000+</h3>
                  <p className="text-secondary-600 text-sm font-medium">Happy Patients</p>
                </div>
                <div className="text-center p-6 bg-secondary-50 rounded-xl border border-secondary-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-medium">
                  <h3 className="text-2xl font-bold text-primary-600 mb-2">500+</h3>
                  <p className="text-secondary-600 text-sm font-medium">Certified Doctors</p>
                </div>
                <div className="text-center p-6 bg-secondary-50 rounded-xl border border-secondary-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-medium">
                  <h3 className="text-2xl font-bold text-primary-600 mb-2">99.9%</h3>
                  <p className="text-secondary-600 text-sm font-medium">Uptime Guarantee</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-large">
              <img 
                src="https://tse3.mm.bing.net/th/id/OIP.y6MfZGviJZLZlKOYkA_FjAHaE7?rs=1&pid=ImgDetMain&o=7&rm=3" 
                alt="Confident doctor with stethoscope ready to provide medical consultation" 
                className="w-full h-auto max-h-96 object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-500 to-primary-600 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-primary-100 mb-8">Join thousands of patients who trust MegaHealth for their healthcare needs</p>
          <button onClick={() => navigate('/register')} className="btn btn-lg bg-white text-primary-600 border-white hover:bg-primary-50 hover:border-primary-50">
            Create Free Account
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Stethoscope className="w-7 h-7 text-primary-400" />
                <h3 className="text-xl font-bold">MegaHealth</h3>
              </div>
              <p className="text-secondary-300 leading-relaxed">Quality healthcare, accessible to everyone</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4 text-white">For Patients</h4>
              <ul className="space-y-3">
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/register'); }} className="text-secondary-300 hover:text-primary-400 transition-colors">Find Doctors</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/register'); }} className="text-secondary-300 hover:text-primary-400 transition-colors">Sign Up</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }} className="text-secondary-300 hover:text-primary-400 transition-colors">Login</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4 text-white">For Doctors</h4>
              <ul className="space-y-3">
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/doctor/register'); }} className="text-secondary-300 hover:text-primary-400 transition-colors">Register as Doctor</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }} className="text-secondary-300 hover:text-primary-400 transition-colors">Doctor Login</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4 text-white">Support</h4>
              <ul className="space-y-3">
                <li><a href="#" onClick={(e) => e.preventDefault()} className="text-secondary-300 hover:text-primary-400 transition-colors">Help Center</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} className="text-secondary-300 hover:text-primary-400 transition-colors">Contact Us</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} className="text-secondary-300 hover:text-primary-400 transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-secondary-700 text-center">
            <p className="text-secondary-300">© 2025 MegaHealth Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
