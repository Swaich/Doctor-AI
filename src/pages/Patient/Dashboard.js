import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import ProfileCompletionBanner from '../../components/ProfileCompletionBanner';
import api from '../../utils/api';
import { FiUsers, FiCalendar, FiCreditCard, FiMapPin } from 'react-icons/fi';


const PatientDashboard = () => {
  const [categories, setCategories] = useState([]);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesRes, creditsRes] = await Promise.all([
        api.get('/categories'),
        api.get('/users/credits')
      ]);
      setCategories(categoriesRes.data);
      setCredits(creditsRes.data.credits);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        <span className="ml-3 text-secondary-600">Loading...</span>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="space-y-6 sm:space-y-8">
        {/* Profile Completion Banner */}
        <ProfileCompletionBanner />
        
        <div className="text-center mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-secondary-900 mb-2 sm:mb-4">Welcome to MegaHealth</h1>
          <p className="text-sm sm:text-base md:text-lg text-secondary-600 px-4">Find and consult with the best doctors from the comfort of your home</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="card card-hover">
            <div className="card-body flex items-center gap-3 sm:gap-4 p-4 sm:p-6">
              <div className="p-2 sm:p-3 bg-success-100 rounded-lg flex-shrink-0">
                <FiCreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-success-600" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-secondary-900">{credits}</h3>
                <p className="text-xs sm:text-sm text-secondary-600">Available Credits</p>
              </div>
            </div>
          </div>

          <Link to="/doctors" className="card card-hover group transition-all duration-300 hover:scale-105">
            <div className="card-body flex items-center gap-3 sm:gap-4 p-4 sm:p-6">
              <div className="p-2 sm:p-3 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors duration-200 flex-shrink-0">
                <FiUsers className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-secondary-900">Browse</h3>
                <p className="text-xs sm:text-sm text-secondary-600">Find Doctors</p>
              </div>
            </div>
          </Link>

          <Link to="/consultations" className="card card-hover group transition-all duration-300 hover:scale-105 sm:col-span-2 lg:col-span-1">
            <div className="card-body flex items-center gap-3 sm:gap-4 p-4 sm:p-6">
              <div className="p-2 sm:p-3 bg-warning-100 rounded-lg group-hover:bg-warning-200 transition-colors duration-200 flex-shrink-0">
                <FiCalendar className="w-5 h-5 sm:w-6 sm:h-6 text-warning-600" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-secondary-900">View</h3>
                <p className="text-xs sm:text-sm text-secondary-600">My Appointments</p>
              </div>
            </div>
          </Link>
        </div>

        <div className="card">
          <div className="card-header p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-secondary-900">Browse by Specialization</h2>
            <p className="text-xs sm:text-sm text-secondary-600 mt-1">Choose from our wide range of medical specialties</p>
          </div>
          <div className="card-body p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {categories.map((category) => (
                <Link
                  key={category._id}
                  to={`/doctors?category=${category._id}`}
                  className="group p-4 sm:p-6 bg-gradient-to-br from-secondary-50 to-primary-50 rounded-xl border border-secondary-200 hover:border-primary-300 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="text-center">
                    <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-200">
                      {category.icon}
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-secondary-900 mb-1 sm:mb-2 group-hover:text-primary-600 transition-colors duration-200">
                      {category.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-secondary-600 leading-relaxed">
                      {category.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PatientDashboard;
