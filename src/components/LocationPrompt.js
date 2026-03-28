import React, { useState } from 'react';
import { MapPin, X } from 'lucide-react';

const LocationPrompt = ({ onAllow, onDeny }) => {
  const [loading, setLoading] = useState(false);

  const handleAllow = async () => {
    setLoading(true);
    try {
      await onAllow();
    } catch (error) {
      console.error('Location error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="card w-full max-w-md animate-fade-in">
        <div className="card-body text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-6">
            <MapPin className="w-8 h-8 text-primary-600" />
          </div>
          
          <h2 className="text-xl font-bold text-secondary-900 mb-4">Enable Location Access</h2>
          <p className="text-secondary-600 mb-8 leading-relaxed">
            We need your location to show nearby doctors and medical stores.
            Your location will be used to provide better healthcare services.
          </p>

          <div className="space-y-3">
            <button 
              onClick={handleAllow} 
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? 'Getting Location...' : 'Allow Location'}
            </button>
            <button 
              onClick={onDeny} 
              className="btn btn-secondary w-full"
              disabled={loading}
            >
              <X className="w-4 h-4" />
              Skip for Now
            </button>
          </div>

          <p className="text-xs text-secondary-500 mt-6">
            You can change this setting later in your profile.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LocationPrompt;
