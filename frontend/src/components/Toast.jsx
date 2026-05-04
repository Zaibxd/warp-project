import { useNotification } from "../context/NotificationContext";

export default function Toast() {
  const { notifications, removeNotification } = useNotification();

  const getToastStyles = (type) => {
    const borderStyles = {
      success: "border-l-4 border-emerald-500 bg-emerald-50",
      error: "border-l-4 border-red-500 bg-red-50",
      info: "border-l-4 border-blue-500 bg-blue-50",
    };

    const textStyles = {
      success: "text-emerald-800",
      error: "text-red-800",
      info: "text-blue-800",
    };

    return `${borderStyles[type] || borderStyles.info} ${textStyles[type] || textStyles.info}`;
  };

  return (
    <div className="fixed top-20 right-4 md:right-8 z-50 flex flex-col gap-3 max-w-md pointer-events-none">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`${getToastStyles(notif.type)} bg-white rounded-lg shadow-2xl p-4 flex items-center gap-3 animate-slideInRight pointer-events-auto transition-all duration-300`}
        >
          <p className="flex-1 text-sm font-medium">{notif.message}</p>
          <button
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none"
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
