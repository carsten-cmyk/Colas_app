/**
 * ContactCard Component
 * Displays contact information with profile image
 * 
 * Props:
 * - name: string - Contact name and role
 * - phone: string - Phone number
 * - image: string - Image URL
 * - variant: 'default' | 'variant2' | 'variant3' - Card variant
 */

function ContactCard({ name, phone, image, variant = 'default' }) {
  const variantClasses = {
    default: 'bg-[#3d3d3d]',
    variant2: 'bg-[#3d3d3d]',
    variant3: 'bg-[#3d3d3d]'
  };

  return (
    <div className={`contact-card ${variantClasses[variant]}`}>
      <div className="contact-image-wrapper">
        <img src={image} alt={name} className="contact-image" />
      </div>
      <div className="contact-info">
        <h3 className="contact-name">{name}</h3>
        <div className="contact-phone">
          <Phone className="phone-icon" />
          <span>{phone}</span>
        </div>
      </div>
    </div>
  );
}

// Phone Icon SVG Component
function Phone({ className }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export default ContactCard;
