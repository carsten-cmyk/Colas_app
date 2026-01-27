/**
 * HomePage
 * Landing/welcome page with notifications and daily greeting
 *
 * Features:
 * - Hero image with Colas logo overlay
 * - Daily greeting (time-based)
 * - Activity notifications (messages, new tasks)
 * - Navigation to main app
 */

import { useNavigate } from 'react-router-dom';

function HomePage() {
  const navigate = useNavigate();

  // Sample data - would come from API/user context
  const userName = 'Jens';

  const activities = [
    {
      id: 1,
      type: 'message',
      text: 'Besked fra Ole Nielsen, PL Colas',
      icon: 'mail'
    },
    {
      id: 2,
      type: 'task',
      text: 'Ny opgave Nature Energy, Lolland',
      icon: 'truck'
    }
  ];

  return (
    <div className="app-container">
      {/* Hero Image with Logo Overlay */}
      <div className="home-hero">
        <img
          src="/images/forside_img.png"
          alt="Colas Road"
          className="home-hero-image"
        />
        {/* Logo overlay - positioned like on other pages */}
        <div className="home-logo-overlay">
          <img src="/images/Colas-logo_gul.svg" alt="Colas Logo" className="home-logo" />
        </div>
      </div>

      {/* Content Section */}
      <div className="home-content">
        {/* Weather icon and temperature */}
        <div className="home-weather-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="4" fill="white" />
            <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                  stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="home-temperature">15°</span>
        </div>

        {/* Greeting */}
        <h1 className="home-greeting">Godmorgen {userName}</h1>
        <p className="home-subtitle">Du har følgende nye aktiviteter fra Colas</p>

        {/* Activity Notifications */}
        <div className="home-activities">
          {activities.map(activity => (
            <div key={activity.id} className="home-activity-item">
              {activity.icon === 'mail' && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="home-activity-icon">
                  <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" stroke="currentColor" strokeWidth="2"/>
                </svg>
              )}
              {activity.icon === 'truck' && (
                <img src="/images/lastbil_white.svg" alt="" className="home-activity-icon-img" />
              )}
              <span className="home-activity-text">{activity.text}</span>
            </div>
          ))}
        </div>

        {/* Continue Button */}
        <button
          className="home-continue-btn"
          onClick={() => navigate('/overview')}
          aria-label="Fortsæt til opgaver"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default HomePage;
