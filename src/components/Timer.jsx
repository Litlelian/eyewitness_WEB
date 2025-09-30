import { useEffect, useState } from "react";
import "./Timer.css";

export default function StepTimer({ duration = 60, onTimeout, size = 120 }) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (onTimeout) onTimeout();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeout]);

  // 計算剩餘比例
  const progress = timeLeft / duration;
  const strokeDasharray = 283; // 2 * π * 半徑(45)
  const strokeDashoffset = strokeDasharray * (1 - progress);

  return (
    <div className="step-timer" style={{ width: size, height: size }}>
      <svg className="progress-ring" width={size} height={size}>
        <circle
          className="progress-ring__circle"
          stroke={progress <= 0.2 ? "red" : progress <= 0.5 ? "orange" : "green"} // 一半後變黃，剩一點變紅
          strokeWidth="10"
          fill="transparent"
          r="45"
          cx={size / 2}
          cy={size / 2}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="step-timer__center">
        {timeLeft} s
      </div>
    </div>
  );
}
