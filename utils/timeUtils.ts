export const formatTime = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, '0')
  const mins = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, '0')
  const secs = (seconds % 60).toString().padStart(2, '0')
  return `${hrs}:${mins}:${secs}`
}

export const parseTimeString = (timeString: string): Date => {
  const [hours, minutes] = timeString.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date
}

export const isTimeBetween = (
  now: Date,
  startTime: Date,
  endTime: Date,
): boolean => {
  if (endTime < startTime) {
    endTime.setDate(endTime.getDate() + 1)
  }

  return now >= startTime && now <= endTime
}
