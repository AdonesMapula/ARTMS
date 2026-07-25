import { useEffect, useRef, useState } from 'react';
import { Navigation, ExternalLink, Phone, Mail, MapPin, ChevronUp, ChevronDown } from 'lucide-react';

// Company data
const COMPANY = {
  name: 'Accel4U Business Solutions Inc.',
  lat: 10.339728222641943,
  lng: 123.91182710901705,
  address: 'Unit 601, PDI Building, Gov. M. Cuenco Ave. corner J. Panis St., Kasambagan, Cebu City 6000',
  phone: '+63 919 009 4534',
  email: 'contact@accel4usolutions.com',
  website: 'https://accel4usolutions.com'
};

// Google Maps directions - will use user's current location as starting point
const GOOGLE_MAPS_URL = `https://www.google.com/maps/dir/?api=1&destination=${COMPANY.lat},${COMPANY.lng}`;

// Alternative: Open directly at the location (no directions, just show the place)
const GOOGLE_MAPS_PLACE = `https://www.google.com/maps/search/?api=1&query=${COMPANY.lat},${COMPANY.lng}`;

// Search by place name (more accurate)
const GOOGLE_MAPS_SEARCH = `https://www.google.com/maps/search/?api=1&query=PDI+Building+Gov+M+Cuenco+Ave+Cebu+City`;

export default function CompanyMap({ height = '500px' }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      script.onload = () => initializeMap();
      document.head.appendChild(script);
    } else {
      initializeMap();
    }

    function initializeMap() {
      if (!mapContainerRef.current || mapRef.current) return;

      // Create map
      const map = window.L.map(mapContainerRef.current, {
        center: [COMPANY.lat, COMPANY.lng],
        zoom: 16,
        zoomControl: true,
        scrollWheelZoom: true,
        dragging: true,
        touchZoom: true,
        doubleClickZoom: true,
      });

      mapRef.current = map;

      // Add OpenStreetMap tiles (completely free, no API key)
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Create custom marker icon (HTML/CSS)
      const customIcon = window.L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="marker-container">
            <div class="marker-pin">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
          </div>
        `,
        iconSize: [50, 50],
        iconAnchor: [25, 50],
        popupAnchor: [0, -50]
      });

      // Add marker (no popup needed - info is in the card below)
      const marker = window.L.marker([COMPANY.lat, COMPANY.lng], { 
        icon: customIcon,
        title: COMPANY.name
      }).addTo(map);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const openGoogleMaps = () => {
    // This will open Google Maps with directions from user's current location
    // Google Maps automatically detects "Your location" as the starting point
    window.open(GOOGLE_MAPS_SEARCH, '_blank');
  };

  return (
    <>
      <style>{`
        /* Custom marker styles */
        .custom-leaflet-marker {
          background: transparent !important;
          border: none !important;
        }

        .marker-container {
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: bounce 2s ease-in-out infinite;
        }

        .marker-pin {
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #060F5A 0%, #F97316 100%);
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 20px rgba(6,15,90,0.5);
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
          cursor: pointer;
        }

        .marker-pin svg {
          transform: rotate(45deg);
        }

        .marker-container:hover .marker-pin {
          transform: rotate(-45deg) scale(1.1);
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        /* Leaflet control customization */
        .leaflet-control-zoom {
          border: none !important;
          border-radius: 12px !important;
          overflow: hidden !important;
          box-shadow: 0 4px 16px rgba(6,15,90,0.15) !important;
        }

        .leaflet-control-zoom a {
          width: 36px !important;
          height: 36px !important;
          line-height: 36px !important;
          font-size: 20px !important;
          color: #060F5A !important;
          border: none !important;
        }

        .leaflet-control-zoom a:hover {
          background: #F8FAFC !important;
        }

        .leaflet-bar {
          border: none !important;
        }
      `}</style>

      <div style={{ position: 'relative', height, width: '100%', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(6,15,90,0.15)' }}>
        {/* Map Container */}
        <div 
          ref={mapContainerRef} 
          style={{ 
            width: '100%', 
            height: '100%',
            borderRadius: '20px',
            zIndex: 1
          }} 
        />

        {/* Collapsible Info Card (Drop-up) */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          right: '20px',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(6,15,90,0.2)',
          zIndex: 1000,
          overflow: 'hidden',
          transition: 'all 0.3s ease'
        }}>
          {/* Header - Always visible, clickable */}
          <div 
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              padding: '16px 20px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: isExpanded ? '1px solid #E2E8F0' : 'none',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          >
            <div style={{ flex: 1 }}>
              <h3 style={{ 
                margin: '0', 
                fontSize: '16px', 
                fontWeight: 'bold', 
                color: '#060F5A'
              }}>
                {COMPANY.name}
              </h3>
              <p style={{ 
                margin: '4px 0 0 0', 
                fontSize: '12px', 
                color: '#64748B'
              }}>
                {isExpanded ? 'Click to collapse' : 'Click to view details'}
              </p>
            </div>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(249,115,22,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.3s'
            }}>
              {isExpanded ? (
                <ChevronDown size={18} color="#F97316" />
              ) : (
                <ChevronUp size={18} color="#F97316" />
              )}
            </div>
          </div>

          {/* Expandable Content */}
          <div style={{
            maxHeight: isExpanded ? '400px' : '0',
            opacity: isExpanded ? 1 : 0,
            transition: 'max-height 0.3s ease, opacity 0.3s ease',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '20px' }}>
              {/* Address */}
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                marginBottom: '16px',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(6,15,90,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <MapPin size={18} color="#060F5A" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ 
                    margin: '0', 
                    fontSize: '11px', 
                    fontWeight: '700',
                    color: '#64748B',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Address
                  </p>
                  <p style={{ 
                    margin: '4px 0 0 0', 
                    fontSize: '13px', 
                    color: '#1E293B', 
                    lineHeight: '1.6'
                  }}>
                    {COMPANY.address}
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                marginBottom: '16px',
                alignItems: 'center'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(6,15,90,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Phone size={18} color="#060F5A" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ 
                    margin: '0', 
                    fontSize: '11px', 
                    fontWeight: '700',
                    color: '#64748B',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Phone
                  </p>
                  <a href={`tel:${COMPANY.phone.replace(/\s/g, '')}`} style={{ 
                    margin: '4px 0 0 0', 
                    fontSize: '13px', 
                    color: '#F97316',
                    textDecoration: 'none',
                    fontWeight: '600',
                    display: 'block'
                  }}>
                    {COMPANY.phone}
                  </a>
                </div>
              </div>

              {/* Email */}
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                marginBottom: '20px',
                alignItems: 'center'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(6,15,90,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Mail size={18} color="#060F5A" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ 
                    margin: '0', 
                    fontSize: '11px', 
                    fontWeight: '700',
                    color: '#64748B',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Email
                  </p>
                  <a href={`mailto:${COMPANY.email}`} style={{ 
                    margin: '4px 0 0 0', 
                    fontSize: '13px', 
                    color: '#F97316',
                    textDecoration: 'none',
                    fontWeight: '600',
                    display: 'block'
                  }}>
                    {COMPANY.email}
                  </a>
                </div>
              </div>

              {/* Get Directions Button */}
              <button
                onClick={openGoogleMaps}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px 20px',
                  background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(249,115,22,0.4)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(249,115,22,0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(249,115,22,0.4)';
                }}
              >
                <Navigation size={16} />
                Get Directions
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
