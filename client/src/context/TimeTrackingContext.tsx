"use client";

import { createContext, useState, useContext, useEffect } from "react";
import { useSession } from "next-auth/react";

interface TimeTrackingContextType {
  isTracking: boolean;
  startTracking: () => void;
  stopTracking: () => void;
  elapsedTime: number; // Elapsed time in seconds
}

const TimeTrackingContext = createContext<TimeTrackingContextType | undefined>(
  undefined
);

export const TimeTrackingProvider = ({ children }: { children: React.ReactNode }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const { data: session } = useSession();

  // Load saved data from localStorage on startup
  useEffect(() => {
    const savedTime = localStorage.getItem("timeTracking");
    if (savedTime) {
      const { elapsed, start, sessionId } = JSON.parse(savedTime);
      setElapsedTime(elapsed);
      if (start) {
        setStartTime(start);
        setIsTracking(true);
      }
      setSessionId(sessionId);
    }
  }, []);

  // Start tracking time
  const startTracking = async () => {
    if (!isTracking && session?.user?.employeeId) {
      try {
        console.log('Starting tracking with session:', session);
        console.log('Employee ID:', session.user.employeeId);

        const response = await fetch('/api/time-tracking', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            employeeId: session.user.employeeId,
            action: 'start'
          }),
        });

        console.log('Start tracking response:', response);

        if (!response.ok) {
          const errorBody = await response.json();
          console.error('Failed to start time tracking:', errorBody);
          throw new Error('Failed to start time tracking');
        }

        const data = await response.json();
        console.log('Time tracking started:', data);
        const currentStartTime = Date.now();
        setIsTracking(true);
        setStartTime(currentStartTime);
        setSessionId(data.session_id);
        localStorage.setItem("timeTracking", JSON.stringify({
          elapsed: elapsedTime,
          start: currentStartTime,
          sessionId: data.session_id
        }));
      } catch (error) {
        console.error('Error starting time tracking:', error);
      }
    }
  };

  // Stop tracking time
  const stopTracking = async () => {
    if (isTracking && startTime && session?.user?.employeeId) {
      try {
        const finalTime = Math.floor((Date.now() - startTime) / 1000);
        
        console.log('Stopping tracking with session:', session);
        console.log('Employee ID:', session.user.employeeId);
        console.log('Final time:', finalTime);

        const response = await fetch('/api/time-tracking', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            employeeId: session.user.employeeId,
            action: 'stop',
            elapsedTime: finalTime
          }),
        });

        console.log('Stop tracking response:', response);

        if (!response.ok) {
          const errorBody = await response.json();
          console.error('Failed to stop time tracking:', errorBody);
          throw new Error('Failed to stop time tracking');
        }

        const data = await response.json();
        console.log('Time tracking stopped:', data);
        setIsTracking(false);
        setElapsedTime(finalTime);
        setStartTime(null);
        setSessionId(null);
        localStorage.setItem("timeTracking", JSON.stringify({
          elapsed: finalTime,
          start: null,
          sessionId: null
        }));
      } catch (error) {
        console.error('Error stopping time tracking:', error);
      }
    }
  };

  // Update elapsed time while tracking
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (isTracking && startTime) {
      intervalId = setInterval(() => {
        const currentElapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(currentElapsed);
        localStorage.setItem("timeTracking", JSON.stringify({
          elapsed: currentElapsed,
          start: startTime,
          sessionId: sessionId
        }));
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isTracking, startTime, sessionId]);

  return (
    <TimeTrackingContext.Provider
      value={{ isTracking, startTracking, stopTracking, elapsedTime }}
    >
      {children}
    </TimeTrackingContext.Provider>
  );
};

export const useTimeTracking = (): TimeTrackingContextType => {
  const context = useContext(TimeTrackingContext);
  if (!context) {
    throw new Error("useTimeTracking must be used within a TimeTrackingProvider");
  }
  return context;
};
