/**
 * Converts minutes to hours:minutes format
 * @param minutes - The duration in minutes
 * @returns A string in format "H:MM שעות" (e.g., "1:30 שעות", "2:15 שעות")
 */
export const formatDurationToHoursMinutes = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  
  // Format minutes with leading zero if needed
  const formattedMinutes = remainingMinutes.toString().padStart(2, '0');
  
  return `${hours}:${formattedMinutes} שעות`;
};

/**
 * Converts minutes to decimal hours format for calculations
 * @param minutes - The duration in minutes
 * @returns A string representing decimal hours
 */
export const formatDurationToDecimalHours = (minutes: number): string => {
  return (minutes / 60).toString();
};