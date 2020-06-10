function timeAgo(dateParam) {
  if (!dateParam) {
    return null;
  }

  const date = typeof dateParam === 'object' ? dateParam : new Date(dateParam);
  const today = new Date();
  const seconds = Math.round((today - date) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const months = Math.round(days / 30.416);
  const years = Math.round(days / 365);

  if (seconds < 60) {
    const plurality = seconds === 1 ? '' : 's';
    return `${ seconds } second${plurality} ago`;
  } else if (minutes < 60) {
    const plurality = minutes === 1 ? '' : 's';
    return `${ minutes } minute${plurality} ago`;
  } else if (hours < 24) {
    const plurality = hours === 1 ? '' : 's';
    return `${ hours } hour${plurality} ago`;
  } else if (days < 31) {
    const plurality = days === 1 ? '' : 's';
    return `${ days } day${plurality} ago`;
  } else if (months < 24) {
    const plurality = months === 1 ? '' : 's';
    return `${ months } month${plurality} ago`;
  }

  const plurality = years === 1 ? '' : 's';
  return `${ years } year${plurality} ago`;
}
