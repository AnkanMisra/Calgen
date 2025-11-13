// Calendar utilities and scheduling logic
// Separated from main server file for better organization

export const timeRangesOverlap = (start1, end1, start2, end2) => {
  return start1 < end2 && start2 < end1;
};

export const isWithinWorkingHours = (date, constraints = {}) => {
  const { startHour = 8, endHour = 21, allowWeekends = true } = constraints;

  const hour = date.getHours();
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  return hour >= startHour && hour < endHour && (allowWeekends || !isWeekend);
};

export const findAvailableTimeSlot = (
  scheduledEvents,
  requestedStart,
  requestedDuration,
  dateRange,
  timezone,
  constraints = {},
) => {
  const {
    workingHours = { start: 8, end: 1 }, // Default: 8 AM to 1 AM next day
    buffers = { betweenEvents: 5 },
    scheduling = { searchIncrement: 15, maxAttempts: 200 },
  } = constraints;

  // Validate input dates
  if (!requestedStart || isNaN(requestedStart.getTime())) {
    console.error("Invalid requestedStart:", requestedStart);
    return null;
  }

  const requestedEnd = new Date(requestedStart);
  requestedEnd.setMinutes(requestedEnd.getMinutes() + requestedDuration);

  // Define working hours with user configurable start time and 1 AM next day end
  const workingHoursStart = new Date(requestedStart);
  workingHoursStart.setHours(workingHours.start, 0, 0, 0);

  const workingHoursEnd = new Date(requestedStart);
  // If end hour is less than start hour, it means it goes to next day
  if (workingHours.end <= workingHours.start) {
    workingHoursEnd.setDate(workingHoursEnd.getDate() + 1); // Next day
  }
  workingHoursEnd.setHours(workingHours.end, 0, 0, 0);

  // Sort existing events by start time for better scheduling
  const sortedEvents = [...scheduledEvents].sort((a, b) => a.start - b.start);

  // Try to place the event starting from the user's preferred time
  const testDate = new Date(workingHoursStart);
  let attempts = 0;
  const maxAttempts = scheduling.maxAttempts;

  while (attempts < maxAttempts) {
    const testEnd = new Date(testDate);
    testEnd.setMinutes(testEnd.getMinutes() + requestedDuration);

    // Check if within allowed hours
    if (testDate >= workingHoursStart && testEnd <= workingHoursEnd) {
      // Check for overlaps with existing events
      let hasOverlap = false;
      for (const event of sortedEvents) {
        if (timeRangesOverlap(testDate, testEnd, event.start, event.end)) {
          hasOverlap = true;
          break;
        }
      }

      if (!hasOverlap) {
        return { start: testDate, end: testEnd };
      }
    }

    // Add optimized random gap between events (15 minutes to 1 hour for better performance)
    const randomGapMinutes = Math.floor(Math.random() * 45) + 15; // 15-60 minutes (reduced from 15-135)
    testDate.setMinutes(testDate.getMinutes() + randomGapMinutes);
    attempts++;

    // If we reach the end of the day, move to next day at user's preferred time
    if (testDate > workingHoursEnd) {
      testDate.setDate(testDate.getDate() + 1);
      testDate.setHours(workingHours.start, 0, 0, 0);
    }
  }

  // If no suitable slot found, return the original time
  return { start: requestedStart, end: requestedEnd };
};

// Generate random gap between events (15 minutes to 2 hours)
export const getRandomGapMinutes = () => {
  return Math.floor(Math.random() * 120) + 15; // 15-135 minutes
};

export const generateTimeRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const range = end - start;

  if (range < 0) {
    throw new Error("End date must be after start date");
  }

  return {
    start,
    end,
    range,
    days: Math.ceil(range / (1000 * 60 * 60 * 24)),
    milliseconds: range,
  };
};

export const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${minutes} min`;
  } else if (minutes < 1440) {
    // Less than 24 hours
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  } else {
    const days = Math.floor(minutes / 1440);
    const remainingMinutes = minutes % 1440;
    const hours = Math.floor(remainingMinutes / 60);
    const mins = remainingMinutes % 60;
    if (hours > 0 && mins > 0) {
      return `${days}d ${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${days}d ${hours}h`;
    } else {
      return `${days}d`;
    }
  }
};
