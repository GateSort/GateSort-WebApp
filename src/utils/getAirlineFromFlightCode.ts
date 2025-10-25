export function getAirlineFromFlightCode(flightcode?: string) : { code: string, name: string} | null {
    if (!flightcode) return null;
    const prefix = flightcode.substring(0,2).toUpperCase();

    const map: Record<string, string> = {
    "AM": "Aeroméxico",
    "Y4": "Volaris",
    "VB": "VivaAerobus",
    "AA": "American Airlines",
    "DL": "Delta Airlines",
    "UA": "United Airlines",
  };

  if (!map[prefix]) return null;
  return { code: prefix, name: map[prefix] };
}