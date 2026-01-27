/**
 * TaskActivePage
 * Active task view with start/pause toggle
 *
 * Features:
 * - Same as TaskDetailPage but with state management
 * - Start button transforms to Pause button on click
 * - Green pause button with smooth transition
 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function TaskActivePage() {
  const navigate = useNavigate();
  const { taskId } = useParams();
  const [isTaskStarted, setIsTaskStarted] = useState(false);

  // Sample data - would come from API/state management
  const task = {
    date: '12. Februar 2026',
    location: 'Uddannelsescenter Syd, Lolland',
    orderNumber: 'Ordrenummer 1212343',
    time: '05.30',
    factory: 'Køge Asfaltfabrik',
    factoryAddress: 'Nordhavnsvej 9\n4600 Køge',
    tons: '75 Tons',
    asphaltType: 'Asfalt 8/10H',
    destination: 'Uddannelsescenter Syd, Lolland',
    destinationAddress: 'Søvej 6 D, 4900 Nakskov',
    rounds: '3',
    hours: '6',
    info: 'Det er en kendsgerning, at man bliver distraheret af læsbart indhold på en side, når man betragter dens layout. Meningen med at bruge Lorem Ipsum.'
  };

  const handleToggleTask = () => {
    setIsTaskStarted(!isTaskStarted);
  };

  return (
    <div className="task-detail-container">
      {/* Header with logo */}
      <div className="task-detail-header">
        <img src="/images/Colas-logo_gul.svg" alt="Colas Logo" className="task-detail-logo" />
      </div>

      {/* Wrapper with padding like tasks-section */}
      <div className="task-detail-wrapper">
        {/* Main yellow card */}
        <div className="task-detail-card">
        {/* Close button */}
        <button className="task-detail-close" onClick={() => navigate('/overview')}>
          ×
        </button>

        {/* Date */}
        <div className="task-detail-date">{task.date}</div>

        {/* Title */}
        <h1 className="task-detail-title">{task.location}</h1>
        <div className="task-detail-ordernumber">{task.orderNumber}</div>

        {/* Time, Location, Amount section */}
        <div className="task-detail-info-box">
          <div className="task-detail-info-row">
            <div className="task-detail-info-label">Tidspunkt</div>
            <div className="task-detail-info-label">Sted</div>
            <div className="task-detail-info-label">Mængde</div>
          </div>
          <div className="task-detail-info-row-main">
            <div className="task-detail-info-time">
              <strong>Kl {task.time}</strong>
            </div>
            <div className="task-detail-info-location">
              <div><strong>{task.factory}</strong></div>
              <div className="task-detail-address">{task.factoryAddress}</div>
            </div>
            <div className="task-detail-info-amount">
              <div><strong>{task.tons}</strong></div>
              <div className="task-detail-asphalt-type">{task.asphaltType}</div>
            </div>
          </div>
        </div>

        {/* Navigation icons */}
        <div className="task-detail-nav-icons">
          <span>↑</span>
          <img src="/images/lastbil_black.svg" alt="Truck" className="task-detail-truck-icon" />
          <span>↓</span>
        </div>

        {/* Destination box */}
        <div className="task-detail-destination">
          <div className="task-detail-destination-name">{task.destination}</div>
          <div className="task-detail-destination-address">{task.destinationAddress}</div>
        </div>

        {/* Bar chart icon */}
        <div className="task-detail-chart-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="12" width="4" height="8" fill="currentColor" />
            <rect x="10" y="8" width="4" height="12" fill="currentColor" />
            <rect x="16" y="4" width="4" height="16" fill="currentColor" />
          </svg>
        </div>

        {/* Estimate box */}
        <div className="task-detail-estimate">
          <div className="task-detail-estimate-label">Estimat</div>
          <div className="task-detail-estimate-values">
            <span><strong>{task.rounds}</strong> Runder</span>
            <span>Timer <strong>{task.hours}</strong></span>
          </div>
        </div>

        {/* Information box */}
        <div className="task-detail-information">
          <div className="task-detail-information-label">Information</div>
          <div className="task-detail-information-text">{task.info}</div>
        </div>

        {/* Start/Pause task button */}
        <button
          className={`task-detail-start-btn ${isTaskStarted ? 'task-started' : ''}`}
          onClick={handleToggleTask}
        >
          <img src="/images/lastbil_black.svg" alt="" className="task-detail-btn-icon" />
          <span>{isTaskStarted ? 'Pause opgave' : 'Start opgave'}</span>
          <img src="/images/lastbil_black.svg" alt="" className="task-detail-btn-icon" />
        </button>

        {/* End task button */}
        <button className="task-detail-end-btn">
          <span>Afslut opgave</span>
        </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button className="nav-item">
          <img src="/images/home_menu.svg" alt="Home" />
        </button>
        <button className="nav-item">
          <img src="/images/besked_menu.svg" alt="Beskeder" />
        </button>
        <button className="nav-item active">
          <img src="/images/opgaver_menu.svg" alt="Opgaver" />
        </button>
        <button className="nav-item">
          <img src="/images/tidsregistrering_menu.svg" alt="Tidsregistrering" />
        </button>
        <button className="nav-item">
          <img src="/images/kontakt_menu.svg" alt="Kontakt" />
        </button>
      </nav>
    </div>
  );
}

export default TaskActivePage;
