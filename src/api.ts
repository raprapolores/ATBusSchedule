export const API_BASE = 'https://athop-app-efevdvbgbnazdyeg.canadacentral-01.azurewebsites.net/api';

export type Region = { RegionId: string; Name: string };
export type Route = { RouteId: string; Name: string; Code: string };
export type Stop = { StopId: string; Order: number; Suburb: string };
export type ScheduleStop = {
  StopId: string;
  Order: number;
  Suburb: string;
  Code: string;
  Times: string[];
};
export const dayMap: Record<string, string> = {
  Monday: 'WEEKDAY',
  Tuesday: 'WEEKDAY',
  Wednesday: 'WEEKDAY',
  Thursday: 'WEEKDAY',
  Friday: 'WEEKDAY',
  Saturday: 'SATURDAY',
  'Sunday/Public Holiday': 'SUNDAY',
};

export async function fetchRegions(): Promise<Region[]> {
  const response = await fetch(`${API_BASE}/regions`);
  if (!response.ok) throw new Error('Failed to fetch regions');
  return response.json();
}

export async function fetchRoutes(regionId: string): Promise<Route[]> {
  const response = await fetch(`${API_BASE}/routes?regionId=${regionId}`);
  if (!response.ok) throw new Error('Failed to fetch routes');
  return response.json();
}

export async function fetchMedia(): Promise<any[]> {
  const response = await fetch(`${API_BASE}/media`);
  if (!response.ok) throw new Error('Failed to fetch media');
  return response.json();
}

export async function fetchTimetables(routeId: string, serviceType: string): Promise<any> {
  const response = await fetch(
    `${API_BASE}/routes/${routeId}/timetables${serviceType ? `?serviceType=${serviceType}` : ''}`,
  );
  if (!response.ok) throw new Error('Failed to fetch schedules');
  return response.json();
}
