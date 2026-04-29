import { useNotification } from "../context/NotificationContext";

export default function Toast() {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="toast-container">
      {notifications.map((notif) => (
        <div key={notif.id} className={`toast toast-${notif.type}`}>
          <p>{notif.message}</p>
          <button
            className="toast-close"
            onClick={() => removeNotification(notif.id)}
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
