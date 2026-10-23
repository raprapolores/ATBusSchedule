import { fetchRegionsWithRetry } from './regionApi';

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
export type SavedUser = {
  UserId?: string;
  Name?: string;
  Email?: string;
  TotalPoints?: number;
  AzureOID?: string;
};

export const dayMap: Record<string, string> = {
  Monday: 'WEEKDAY',
  Tuesday: 'WEEKDAY',
  Wednesday: 'WEEKDAY',
  Thursday: 'WEEKDAY',
  Friday: 'WEEKDAY',
  Saturday: 'SATURDAY',
  Sunday: 'SUNDAY',
  'Public Holiday': 'SUNDAY',
  'Sunday/Public Holiday': 'SUNDAY',
};

export async function fetchRegions(): Promise<Region[]> {
  return fetchRegionsWithRetry<Region[]>(`${API_BASE}/regions`);
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

export async function saveUserToBackend(payload: Record<string, string | undefined>, token: string): Promise<SavedUser> {
  const response = await fetch(`${API_BASE}/user/login`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || `Login API failed with status ${response.status}`);
  }

  return data;
}

export async function fetchTimetables(routeId: string, serviceType: string): Promise<any> {
  const response = await fetch(
    `${API_BASE}/routes/${routeId}/timetables${serviceType ? `?serviceType=${serviceType}` : ''}`,
  );
  if (!response.ok) throw new Error('Failed to fetch schedules');
  return response.json();
}
