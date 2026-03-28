// Location utility functions

export const requestLocationPermission = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        resolve(location);
      },
      (error) => {
        let errorMessage = 'Unable to retrieve location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
          default:
            errorMessage = 'An unknown error occurred.';
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

export const getCityFromCoordinates = async (lat, lng) => {
  try {
    // Using reverse geocoding API (you can use Google Maps API or other services)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await response.json();
    
    return {
      city: data.address?.city || data.address?.town || data.address?.village || 'Unknown',
      state: data.address?.state || '',
      country: data.address?.country || ''
    };
  } catch (error) {
    console.error('Error getting city:', error);
    return { city: 'Unknown', state: '', country: '' };
  }
};

export const updateUserLocation = async (api, location) => {
  try {
    const cityData = await getCityFromCoordinates(location.lat, location.lng);
    
    await api.put('/users/profile', {
      location: {
        city: cityData.city,
        state: cityData.state,
        coordinates: {
          lat: location.lat,
          lng: location.lng
        }
      }
    });
    
    return cityData;
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
};
