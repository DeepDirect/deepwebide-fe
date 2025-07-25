import React from 'react';
import './DateDivider.scss';

interface DateDividerProps {
  date: string;
}

const DateDivider: React.FC<DateDividerProps> = ({ date }) => {
  return (
    <div className="date-divider">
      <span className="date-divider__text">{date}</span>
    </div>
  );
};

export default DateDivider;
