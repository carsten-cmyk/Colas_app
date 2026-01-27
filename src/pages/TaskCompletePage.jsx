/**
 * TaskCompletePage
 * Task completion summary with time registration
 *
 * Features:
 * - Task summary (rounds, distance, tonnage)
 * - Time breakdown (driving, waiting, pause)
 * - Comments section
 * - Complete and approve button
 */

import { useNavigate, useParams } from 'react-router-dom';

function TaskCompletePage() {
  const navigate = useNavigate();
  const { taskId } = useParams();

  // Sample data - would come from API/state management
  const task = {
    date: '12. Februar 2026',
    location: 'Uddannelsescenter Syd, Lolland',
    orderNumber: 'Ordrenummer 1212343',
    rounds: 3,
    distance: '76 KM',
    tonnage: '73 Tons',
    timeBreakdown: [
      { hours: 3, activity: 'Kørsel' },
      { hours: 2, activity: 'Ventetid' },
      { hours: 2, activity: 'Pause' }
    ],
    comments: 'Vi var forsinket på E45 og så derfor har opgaven taget længere tid end estimeret.'
  };

  const handleComplete = () => {
    // Would save time registration to backend
    navigate('/overview');
  };

  return (
    <div className="task-detail-container">
      {/* Header with logo */}
      <div className="task-detail-header">
        <img src="/images/Colas-logo_gul.svg" alt="Colas Logo" className="task-detail-logo" />
      </div>

      {/* Wrapper with padding */}
      <div className="task-detail-wrapper">
        {/* Main yellow card */}
        <div className="task-detail-card task-complete-card">
          {/* Close button */}
          <button className="task-detail-close" onClick={() => navigate('/overview')}>
            ×
          </button>

          {/* Date */}
          <div className="task-detail-date">{task.date}</div>

          {/* Title */}
          <h1 className="task-detail-title">{task.location}</h1>
          <div className="task-detail-ordernumber">{task.orderNumber}</div>

          {/* Timeline with statistics */}
          <div className="task-complete-timeline">
            <div className="timeline-line"></div>

            <div className="timeline-item">
              <div className="timeline-dot"></div>
              <img src="/images/lastbil_black.svg" alt="" className="timeline-icon" />
              <span className="timeline-value">{task.rounds} Runder</span>
            </div>

            <div className="timeline-item">
              <div className="timeline-dot"></div>
              <img src="/images/lastbil_black.svg" alt="" className="timeline-icon" />
              <span className="timeline-value">{task.distance}</span>
            </div>

            <div className="timeline-item">
              <div className="timeline-dot"></div>
              <img src="/images/lastbil_black.svg" alt="" className="timeline-icon" />
              <span className="timeline-value">{task.tonnage}</span>
            </div>
          </div>

          {/* Chart icon */}
          <div className="task-detail-chart-icon" style={{ marginTop: '12px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="12" width="4" height="8" fill="currentColor" />
              <rect x="10" y="8" width="4" height="12" fill="currentColor" />
              <rect x="16" y="4" width="4" height="16" fill="currentColor" />
            </svg>
          </div>

          {/* Time breakdown section */}
          <div className="task-complete-section">
            <div className="task-complete-section-header">Timeforbrug</div>
            <div className="task-complete-table">
              <div className="task-complete-table-header">
                <span>Timer</span>
                <span>Aktivitet</span>
                <span>Ret</span>
              </div>
              {task.timeBreakdown.map((item, idx) => (
                <div key={idx} className="task-complete-table-row">
                  <span className="time-value">{item.hours}</span>
                  <span className="activity-value">{item.activity}</span>
                  <span className="edit-icon">✎</span>
                </div>
              ))}
            </div>
          </div>

          {/* Comments section */}
          <div className="task-complete-section comments-section">
            <div className="task-complete-section-header">Kommentarer</div>
            <div className="task-complete-comments">
              <p>{task.comments}</p>
              <button className="voice-icon" aria-label="Voice input">
                <img src="/images/iCon24/Microphone/Mid/Sounds.svg" alt="Microphone" />
              </button>
            </div>
          </div>

          {/* Complete button */}
          <button className="task-complete-btn" onClick={handleComplete}>
            <span>Afslut og godkend</span>
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button className="nav-item" onClick={() => navigate('/')}>
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

export default TaskCompletePage;
