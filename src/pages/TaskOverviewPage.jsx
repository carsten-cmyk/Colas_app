/**
 * TaskOverviewPage
 * Main page displaying tasks, contacts, and navigation
 * 
 * Features:
 * - Stacked task cards with overlap effect
 * - Contact cards with profile images
 * - Bottom navigation bar
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContactCard from '../components/ContactCard';
import TaskCard from '../components/TaskCard';

function TaskOverviewPage() {
  const navigate = useNavigate();

  // Sample data - would come from API/database in production
  const contacts = [
    {
      name: 'Henrik Thor, Projektleder Colas',
      phone: '23 99 14 48',
      image: '/images/Henrik.png',
      variant: 'default'
    },
    {
      name: 'Ole Jensen, Formand Lolland',
      phone: '21 90 90 43',
      image: '/images/Ole.png',
      variant: 'variant2'
    },
    {
      name: 'Jens Olufsen, Fabrik Køge',
      phone: '60 20 18 18',
      image: '/images/Fabrik.png',
      variant: 'variant3'
    }
  ];

  const tasks = [
    {
      id: 1,
      date: '12. Februar 2026',
      location: 'Uddannelsescenter Syd, Lolland',
      tons: '75 Tons',
      time: '05.30',
      destination: 'Fabrik Køge → Lolland',
      variant: 'default'
    },
    {
      id: 2,
      date: '12. Februar 2026',
      location: 'Nature Energy, Lolland',
      tons: '84 Tons',
      time: '12.30',
      destination: 'Fabrik Køge → Lolland',
      variant: 'variant2'
    },
    {
      id: 3,
      date: '12. Februar 2026',
      location: 'Uddannelsescenter Syd, Lolland',
      tons: '30 Tons',
      time: '05.30',
      destination: 'Fabrik Køge → Lolland',
      variant: 'variant3'
    }
  ];

  const handleTaskClick = (taskId) => {
    navigate(`/task/${taskId}`);
  };

  const [activeNav, setActiveNav] = useState('home');

  const navItems = [
    { id: 'home', icon: '/images/home_menu.svg', label: 'Home' },
    { id: 'besked', icon: '/images/besked_menu.svg', label: 'Beskeder' },
    { id: 'opgaver', icon: '/images/opgaver_menu.svg', label: 'Opgaver' },
    { id: 'tidsregistrering', icon: '/images/tidsregistrering_menu.svg', label: 'Tidsregistrering' },
    { id: 'kontakt', icon: '/images/kontakt_menu.svg', label: 'Kontakt' }
  ];

  return (
    <div className="app-container">
      {/* Logo Area */}
      <div className="logo-area">
        <img src="/images/Colas-logo_gul.svg" alt="Colas Logo" className="colas-logo-img" />
      </div>

      {/* Contact Cards Section */}
      <div className="contacts-section">
        {contacts.map((contact, idx) => (
          <ContactCard key={idx} {...contact} />
        ))}
      </div>

      {/* Tasks Section */}
      <div className="tasks-section">
        <h2 className="tasks-title">Opgaver idag</h2>
        <div className="tasks-list">
          {tasks.map((task) => (
            <TaskCard key={task.id} {...task} onClick={handleTaskClick} />
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {navItems.map(({ id, icon, label }) => (
          <button
            key={id}
            className={`nav-item ${activeNav === id ? 'active' : ''}`}
            onClick={() => {
              if (id === 'home') {
                navigate('/');
              } else {
                setActiveNav(id);
              }
            }}
            title={label}
            aria-label={label}
          >
            <img src={icon} alt={label} />
          </button>
        ))}
      </nav>
    </div>
  );
}

export default TaskOverviewPage;
