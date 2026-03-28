import React from 'react';

const NotificationBadge = ({ count, showDot = false }) => {
  if (!count || count === 0) return null;

  if (showDot) {
    return (
      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
    );
  }

  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
      {count > 99 ? '99+' : count}
    </span>
  );
};

export default NotificationBadge;