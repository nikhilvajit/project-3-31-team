"use client";

// used for testing

import { useTimeTracking } from "../context/TimeTrackingContext";

const TimeTrackerButton: React.FC = () => {
  const { isTracking, startTracking, stopTracking, elapsedTime } = useTimeTracking();

  return (
    <div>
      <h3>Time Elapsed: {elapsedTime} seconds</h3>
      {!isTracking ? (
        <button onClick={startTracking}>Start Tracking</button>
      ) : (
        <button onClick={stopTracking}>Stop Tracking</button>
      )}
    </div>
  );
};

export default TimeTrackerButton;
