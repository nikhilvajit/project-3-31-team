"use client";

import TimeTrackerButton from "../../components/timeTrackerButton";
import { TimeTrackingProvider } from "@/context/TimeTrackingContext";
import { SessionProvider } from "next-auth/react";

const HomePage = () => {
  return (
    <SessionProvider>
      <TimeTrackingProvider>
        <div>
          <h1>Welcome to the Time Tracking App</h1>
          <TimeTrackerButton />
        </div>
      </TimeTrackingProvider>
    </SessionProvider>
  );
};

export default HomePage;
