import { useEffect, useState } from "react";

export function SuccessTick() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Tiny delay so animation fires after mount
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style>{`
        @keyframes successRingDraw {
          from { stroke-dashoffset: 314; opacity: 0; }
          to   { stroke-dashoffset: 0;   opacity: 1; }
        }
        @keyframes successTickDraw {
          from { stroke-dashoffset: 80; opacity: 0; }
          to   { stroke-dashoffset: 0;  opacity: 1; }
        }
        @keyframes successPop {
          0%   { transform: scale(0.5); opacity: 0; }
          60%  { transform: scale(1.1); opacity: 1; }
          80%  { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        @keyframes successGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
          50% { box-shadow: 0 0 32px 8px rgba(16,185,129,0.25); }
        }
        .success-container {
          animation: successPop 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards,
                     successGlow 1.8s ease-in-out 0.5s infinite;
        }
        .success-ring {
          stroke-dasharray: 314;
          stroke-dashoffset: 314;
          animation: successRingDraw 0.5s cubic-bezier(0.4,0,0.2,1) 0.15s forwards;
        }
        .success-tick {
          stroke-dasharray: 80;
          stroke-dashoffset: 80;
          animation: successTickDraw 0.4s cubic-bezier(0.4,0,0.2,1) 0.55s forwards;
        }
      `}</style>

      <div
        className="success-container mx-auto my-4 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10"
        style={{ opacity: visible ? 1 : 0, transition: "opacity 0.1s" }}
      >
        <svg
          viewBox="0 0 100 100"
          className="h-24 w-24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Payment successful"
        >
          {/* Outer glow ring */}
          <circle cx="50" cy="50" r="48" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.2" />

          {/* Animated circle border */}
          <circle
            className="success-ring"
            cx="50"
            cy="50"
            r="44"
            stroke="#10b981"
            strokeWidth="4"
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />

          {/* Inner fill circle */}
          <circle cx="50" cy="50" r="38" fill="#10b981" fillOpacity="0.12" />

          {/* Animated checkmark tick */}
          <polyline
            className="success-tick"
            points="28,52 43,67 72,34"
            stroke="#10b981"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
    </>
  );
}

export default SuccessTick;

