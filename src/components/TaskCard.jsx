/**
 * TaskCard Component
 * Displays a task/assignment with location, tonnage, and timing
 *
 * Props:
 * - id: string/number - Task ID for navigation
 * - date: string - Date string (e.g., "12. Februar 2026")
 * - location: string - Destination/location name
 * - tons: string - Tonnage (e.g., "75 Tons")
 * - time: string - Start time (e.g., "05.30")
 * - destination: string - Route/destination (e.g., "Fabrik Køge → Lolland")
 * - variant: 'default' | 'variant2' | 'variant3' - Card background color
 * - onClick: function - Click handler for navigation
 */

function TaskCard({ id, date, location, tons, time, destination, variant = 'default', onClick }) {
  const variantClasses = {
    default: '#ece378',
    variant2: '#f7f09e',
    variant3: '#f7f2c1'
  };

  return (
    <div
      className="task-card task-card-clickable"
      style={{ backgroundColor: variantClasses[variant] }}
      onClick={() => onClick && onClick(id)}
    >
      <div className="task-date">{date}</div>
      <div className="task-content">
        <div className="task-header">
          <h4>{location}</h4>
          <span className="task-tons">{tons}</span>
        </div>
        <div className="task-time">
          <strong>Start kl {time}</strong> {destination}
        </div>
      </div>
    </div>
  );
}

export default TaskCard;
