export const isWeekday = (date = new Date()) => {
  const day = date.getDay(); 
  return day >= 1 && day <= 5;
};

export const isWithinAllowedTimeRange = (date = new Date()) => {
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const min = 7 * 60 + 50;
  const max = 16 * 60 + 40;
  return currentMinutes >= min && currentMinutes <= max;
};

export const getPunctualityStatus = (date, schedule) => {
  const [hStart, mStart] = schedule.start.split(":").map(Number);
  const [hTol, mTol, sTol] = schedule.tolerance.split(":").map(Number);

  const startMinutes = hStart * 60 + mStart;
  const toleranceMinutes = hTol * 60 + mTol + sTol / 60;
  const currentMinutes = date.getHours() * 60 + date.getMinutes();

  if (currentMinutes <= startMinutes + toleranceMinutes) {
    return "puntual";
  } else {
    return "retardo";
  }
};

export const getSalidaStatus = (date, schedule) => {
  const [hOut, mOut] = schedule.end.split(":").map(Number); // <- cambio aquí
  const salidaMinutes = hOut * 60 + mOut;
  const currentMinutes = date.getHours() * 60 + date.getMinutes();

  return currentMinutes < salidaMinutes ? "incompleta" : "puntual";
};
