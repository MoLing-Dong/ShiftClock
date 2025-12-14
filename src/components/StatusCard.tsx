import './StatusCard.css';

interface StatusCardProps {
  type: 'work' | 'rest' | 'weekend' | 'unknown';
  message: string;
}

export function StatusCard({ type, message }: StatusCardProps) {
  const getIcon = () => {
    switch (type) {
      case 'work':
        return '💼';
      case 'rest':
      case 'weekend':
        return '😴';
      default:
        return '❓';
    }
  };

  return (
    <div className={`status-card ${type}`}>
      <div className="status-icon">{getIcon()}</div>
      <div className="status-text">
        <h3>{message}</h3>
      </div>
    </div>
  );
}

