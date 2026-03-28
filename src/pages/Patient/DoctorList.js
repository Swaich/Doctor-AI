import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { FiArrowLeft, FiMonitor, FiSearch, FiFilter } from 'react-icons/fi';


const DoctorList = () => {
  const [doctors, setDoctors] = useState([]);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    category: '',
    minExperience: '',
    maxFee: '',
    city: '',
    consultationMode: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [allDoctors, setAllDoctors] = useState([]);

  useEffect(() => {
    fetchCategories();
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setFilters(prev => ({ ...prev, category: categoryParam }));
    }
  }, [searchParams]);

  useEffect(() => {
    fetchDoctors();
  }, [filters]);

  // Filter doctors based on search term with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!searchTerm.trim()) {
        setDoctors(allDoctors);
      } else {
        const filtered = allDoctors.filter(doctor => 
          doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doctor.specialization?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doctor.currentHospitalClinic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doctor.qualification?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doctor.currentWorkingCity?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setDoctors(filtered);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, allDoctors]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.minExperience) params.append('minExperience', filters.minExperience);
      if (filters.maxFee) params.append('maxFee', filters.maxFee);
      if (filters.city) params.append('city', filters.city);
      if (filters.consultationMode) params.append('consultationMode', filters.consultationMode);

      const response = await api.get(`/doctors?${params.toString()}`);
      setAllDoctors(response.data);
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        <div className="mb-4 sm:mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900 transition-colors text-sm sm:text-base"
            >
              <FiArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              Back
            </button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900 mb-2">Find Doctors</h1>
          <p className="text-sm sm:text-base text-secondary-600">Browse and connect with qualified healthcare professionals</p>
        </div>

        {/* Search Bar */}
        <div className="card">
          <div className="card-body p-4 sm:p-6">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search doctors by name, specialization, or hospital..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10 w-full"
              />
            </div>
          </div>
        </div>

       

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            <span className="ml-3 text-secondary-600">Loading doctors...</span>
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">👨‍⚕️</div>
            <p className="text-secondary-500 text-lg">No doctors found matching your criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {doctors.map((doctor) => (
              <div key={doctor._id} className="card card-hover">
                <div className="card-body p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                    {doctor.profilePhoto && doctor.profilePhoto.data ? (
                      <img 
                        src={`data:${doctor.profilePhoto.contentType};base64,${doctor.profilePhoto.data}`} 
                        alt={doctor.name} 
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-primary-200 flex-shrink-0" 
                      />
                    ) : (
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary-100 flex items-center justify-center text-lg sm:text-xl font-bold text-primary-600 border-2 border-primary-200 flex-shrink-0">
                        {doctor.name?.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-secondary-900 truncate">{doctor.name}</h3>
                      <p className="text-sm sm:text-base text-primary-600 font-medium truncate">{doctor.specialization?.name}</p>
                      <p className="text-xs sm:text-sm text-secondary-500 truncate">{doctor.qualification}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-secondary-600">Experience:</span>
                      <span className="font-medium text-secondary-900">{doctor.experience} years</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-secondary-600">Hospital:</span>
                      <span className="font-medium text-secondary-900 text-right truncate ml-2">{doctor.currentHospitalClinic}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-secondary-600">City:</span>
                      <span className="font-medium text-secondary-900">{doctor.currentWorkingCity}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-secondary-600">Languages:</span>
                      <span className="font-medium text-secondary-900 text-right truncate ml-2">{doctor.languagesSpoken?.join(', ')}</span>
                    </div>
                  </div>

                  {/* <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-4 gap-2">
                    <div className="flex items-center gap-1">
                      <FiStar className="w-3 h-3 sm:w-4 sm:h-4 text-warning-500" />
                      <span className="text-sm sm:text-base font-medium text-secondary-900">
                        {doctor.rating?.toFixed(1) || 'New'}
                      </span>
                      <span className="text-xs sm:text-sm text-secondary-500">
                        ({doctor.totalRatings || 0} reviews)
                      </span>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-sm sm:text-base font-bold text-success-600">{doctor.consultationFee?.video} Credits</div>
                      <div className="text-xs text-secondary-500">Video Fee</div>
                    </div>
                  </div> */}

                  <div className="flex gap-2 mb-3 sm:mb-4 flex-wrap">
                    {doctor.consultationModes?.video && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                        <FiMonitor className="w-3 h-3 mr-1" /> Video
                      </span>
                    )}
                    {doctor.consultationModes?.physical && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-700">
                         Physical
                      </span>
                    )}
                  </div>

                  <Link to={`/doctors/${doctor._id}`} className="block">
                    <button className="btn btn-primary w-full text-sm sm:text-base">
                      View Profile & Book
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DoctorList;
