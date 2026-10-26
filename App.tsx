import React, { useEffect, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  dayMap,
  fetchRegions,
  fetchRoutes,
  fetchTimetables,
  type Region,
  type Route,
  type ScheduleStop,
  type Stop,
} from './src/api';

const MAX_UPCOMING_ROWS = 5;
const CLOCK_REFRESH_INTERVAL_MS = 1_000;
type AppTab = 'timetable' | 'routes' | 'account';
type PickerType = 'region' | 'route' | 'day' | 'stop';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [mappedSchedules, setMappedSchedules] = useState<ScheduleStop[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string>('');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [selectedStopId, setSelectedStopId] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveTimetable, setLiveTimetable] = useState(true);
  const [activeTab, setActiveTab] = useState<AppTab>('timetable');
  const [activePicker, setActivePicker] = useState<PickerType | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [clock, setClock] = useState(() => new Date());
  const insets = useSafeAreaInsets();

  const now = clock;
  const currentDayName = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ][now.getDay()];

  const dayOptions = Object.keys(dayMap);

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), CLOCK_REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const pickerTitle = activePicker
    ? { region: 'Choose a region', route: 'Choose a route', day: 'Choose a day', stop: 'Choose a stop' }[activePicker]
    : '';
  const pickerOptions = activePicker === 'region'
    ? regions.map((region) => ({ label: region.Name, value: region.RegionId }))
    : activePicker === 'route'
      ? routes.map((route) => ({ label: `${route.Name}  ·  ${route.Code}`, value: route.RouteId }))
      : activePicker === 'day'
        ? dayOptions.map((day) => ({ label: day, value: day }))
        : activePicker === 'stop'
          ? [{ label: 'All Stops', value: '' }, ...stops.map((stop) => ({ label: stop.Suburb, value: stop.StopId }))]
          : [];

  const tabTitle = {
    timetable: 'Timetable',
    routes: 'Routes',
    account: 'Account',
  }[activeTab];

  const selectPickerOption = (value: string) => {
    if (activePicker === 'region') {
      setSelectedRegionId(value);
      setSelectedRouteId('');
      setSelectedStopId('');
    } else if (activePicker === 'route') {
      setSelectedRouteId(value);
      setSelectedStopId('');
    } else if (activePicker === 'day') {
      setSelectedDay(value);
      setLiveTimetable(false);
    } else if (activePicker === 'stop') {
      setSelectedStopId(value);
    }

    setActivePicker(null);
  };

  const renderSelector = (type: PickerType, label: string, value: string, disabled = false) => (
    <View style={styles.selectBlock}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => setActivePicker(type)}
        style={({ pressed }) => [
          styles.pickerBox,
          disabled && styles.pickerBoxDisabled,
          pressed && !disabled && styles.pickerBoxPressed,
        ]}
      >
        <Text numberOfLines={1} style={[styles.pickerText, disabled && styles.disabledText]}>{value}</Text>
        <Text style={styles.chevron}>⌄</Text>
      </Pressable>
    </View>
  );

  useEffect(() => {
    if (liveTimetable) setSelectedDay('');
  }, [liveTimetable]);

  useEffect(() => {
    const loadRegions = async () => {
      try {
        setError(null);
        setLoadingRegions(true);
        const data = await fetchRegions();
        setRegions(data);
      } catch (loadError) {
        console.error('Failed to load regions:', loadError);
        setError('Error loading regions');
      } finally {
        setLoadingRegions(false);
      }
    };

    void loadRegions();
  }, []);

  useEffect(() => {
    if (!selectedRegionId) {
      setRoutes([]);
      setSelectedRouteId('');
      return;
    }

    const loadRoutes = async () => {
      try {
        setLoadingRoutes(true);
        const data = await fetchRoutes(selectedRegionId);
        setRoutes(data);
      } catch {
        setError('Error loading routes');
      } finally {
        setLoadingRoutes(false);
      }
    };

    loadRoutes();
  }, [selectedRegionId]);

  useEffect(() => {
    if (!selectedRouteId) {
      setMappedSchedules([]);
      setStops([]);
      return;
    }

    const loadSchedules = async () => {
      const serviceType = liveTimetable ? dayMap[currentDayName] : dayMap[selectedDay || currentDayName];

      try {
        setLoadingSchedules(true);
        const data = await fetchTimetables(selectedRouteId, serviceType);
        const selectedRoute = routes.find((r) => r.RouteId === selectedRouteId);

        const mapped: ScheduleStop[] = data.Stops.map((stop: any) => ({
          StopId: stop.StopId,
          Order: stop.Order,
          Suburb: stop.StopName,
          Code: selectedRoute?.Code || '',
          Times: stop.TimesByService?.[serviceType] || [],
        }));

        setMappedSchedules(mapped);
        setStops(
          mapped.map((s) => ({
            StopId: s.StopId,
            Order: s.Order,
            Suburb: s.Suburb,
          })),
        );
      } catch {
        setError('Error loading schedules');
      } finally {
        setLoadingSchedules(false);
      }
    };

    loadSchedules();
  }, [selectedRouteId, selectedDay, routes, liveTimetable, currentDayName]);

  const filteredStops = selectedStopId
    ? mappedSchedules.filter((s) => s.StopId === selectedStopId)
    : mappedSchedules;

  const isTimePast = (time: string) => {
    if (!time) return false;

    const [h, m] = time.split(':').map(Number);
    const departure = new Date(now);
    departure.setHours(h, m, 0, 0);
    return departure.getTime() < now.getTime();
  };

  const upcomingStops = liveTimetable
    ? filteredStops.map((stop) => ({
        ...stop,
        Times: stop.Times.filter((time) => !isTimePast(time)),
      }))
    : filteredStops;
  const maxTrips = Math.max(...upcomingStops.map((s) => s.Times?.length || 0), 0);
  const timetableRows: string[][] = [];

  for (let i = 0; i < maxTrips; i += 1) {
    const row = upcomingStops.map((s) => s.Times[i] || '');
    if (row.some(Boolean)) timetableRows.push(row);
  }

  const rowsToDisplay = liveTimetable ? timetableRows.slice(0, MAX_UPCOMING_ROWS) : timetableRows;
  const tableColumnWidth = Math.max(650 / Math.max(filteredStops.length, 1), 110);
  const tableWidth = filteredStops.length * tableColumnWidth + Math.max(filteredStops.length - 1, 0) * 6;
  const hasRoute = !!selectedRouteId;
  const hasRows = rowsToDisplay.length > 0;
  const regionsUnavailable = loadingRegions || regions.length === 0;

  const getTimeLabel = (time: string) => {
    if (!time) return '—';

    const [h, m] = time.split(':').map(Number);
    const t = new Date();
    t.setHours(h, m, 0, 0);
    const diff = Math.floor((t.getTime() - now.getTime()) / 60000);

    if (diff === 0) return 'Now';
    if (diff > 0) return diff < 60 ? `${diff}m` : `${Math.floor(diff / 60)}h ${diff % 60}m`;
    return '';
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.appHeader}>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.appName}>Auckland Bus</Text>
          <Text style={styles.headerSubtitle}>{tabTitle}</Text>
        </View>
        <Text style={[styles.liveBadge, liveTimetable ? styles.liveBadgeActive : styles.liveBadgeInactive]}>
          {liveTimetable ? 'LIVE' : 'STATIC'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {activeTab === 'timetable' ? (
          <View style={styles.contentCard}>
            <Text style={styles.heading}>Your next bus</Text>
            <Text style={styles.subheading}>Choose your route and check upcoming departures.</Text>
            <View style={styles.filtersGrid}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Live departures</Text>
                <Switch
                  value={liveTimetable}
                  onValueChange={setLiveTimetable}
                  disabled={regionsUnavailable}
                  trackColor={{ false: '#cbd5e1', true: '#2563eb' }}
                />
              </View>
              {renderSelector(
                'region',
                'Region',
                loadingRegions ? 'Loading regions…' : regions.find((region) => region.RegionId === selectedRegionId)?.Name || 'Choose a region',
                regionsUnavailable,
              )}
              {renderSelector(
                'route',
                'Route',
                loadingRoutes ? 'Loading routes…' : routes.find((route) => route.RouteId === selectedRouteId)?.Name || 'Choose a route',
                regionsUnavailable || !selectedRegionId || loadingRoutes || routes.length === 0,
              )}
              {renderSelector(
                'day',
                'Day',
                selectedDay || `Today (${currentDayName})`,
                regionsUnavailable || liveTimetable,
              )}
              {renderSelector(
                'stop',
                'Stop',
                stops.find((stop) => stop.StopId === selectedStopId)?.Suburb || 'All stops',
                regionsUnavailable || !hasRoute || loadingSchedules || stops.length === 0,
              )}
            </View>

            <View style={styles.timetableWrapper}>
              <Text style={styles.tableTitle}>
                Upcoming departures · {liveTimetable ? 'Live' : selectedDay || 'Static'}
              </Text>
              {loadingRegions || loadingSchedules ? (
                <View style={styles.loaderWrap}>
                  <ActivityIndicator size="large" color="#2563eb" />
                  {loadingRegions ? <Text style={styles.emptyState}>Waiting for timetable data…</Text> : null}
                </View>
              ) : !hasRoute ? (
                <Text style={styles.emptyState}>Choose a region and route to see departures.</Text>
              ) : !hasRows ? (
                <Text style={styles.emptyState}>No more upcoming departures.</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={[styles.tableContainer, { width: tableWidth }]}>
                    <View style={styles.tableHeaderRow}>
                      {filteredStops.map((stop) => (
                        <Pressable
                          key={stop.StopId}
                          accessibilityRole="button"
                          onPress={() => setSelectedStopId(selectedStopId === stop.StopId ? '' : stop.StopId)}
                          style={[
                            styles.tableHeaderCell,
                            { width: tableColumnWidth },
                            selectedStopId === stop.StopId && styles.tableHeaderCellSelected,
                          ]}
                        >
                          <Text style={styles.headerStopName}>{stop.Suburb}</Text>
                          {stop.Code ? <Text style={styles.headerCode}>{stop.Code}</Text> : null}
                        </Pressable>
                      ))}
                    </View>
                    {rowsToDisplay.map((row, rowIndex) => (
                      <View key={`row-${rowIndex}`} style={styles.tableRow}>
                        {row.map((time, index) => (
                          <View key={`${rowIndex}-${index}`} style={[styles.tableCell, { width: tableColumnWidth }]}>
                            <Text style={styles.timeText}>{time || '—'}</Text>
                            {liveTimetable && time
                              ? <Text style={styles.relativeTime}>{getTimeLabel(time)}</Text>
                              : null}
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        ) : null}

        {activeTab === 'routes' ? (
          <View style={styles.contentCard}>
            <Text style={styles.heading}>Find a route</Text>
            <Text style={styles.subheading}>Select a region, then choose the route you want to ride.</Text>
            <View style={styles.routeRegion}>
              {renderSelector(
                'region',
                'Region',
                loadingRegions ? 'Loading regions…' : regions.find((region) => region.RegionId === selectedRegionId)?.Name || 'Choose a region',
                regionsUnavailable,
              )}
            </View>
            {loadingRoutes ? (
              <ActivityIndicator style={styles.routeLoader} color="#2563eb" />
            ) : !selectedRegionId ? (
              <Text style={styles.emptyState}>Choose a region to browse routes.</Text>
            ) : routes.length === 0 ? (
              <Text style={styles.emptyState}>No routes are available for this region.</Text>
            ) : (
              <View style={styles.routeList}>
                {routes.map((route) => (
                  <Pressable
                    key={route.RouteId}
                    accessibilityRole="button"
                    onPress={() => {
                      setSelectedRouteId(route.RouteId);
                      setSelectedStopId('');
                      setActiveTab('timetable');
                    }}
                    style={({ pressed }) => [styles.routeCard, pressed && styles.routeCardPressed]}
                  >
                    <View style={styles.routeCode}><Text style={styles.routeCodeText}>{route.Code}</Text></View>
                    <View style={styles.routeInfo}>
                      <Text style={styles.routeName}>{route.Name}</Text>
                      <Text style={styles.routeHint}>Tap to view timetable</Text>
                    </View>
                    <Text style={styles.routeArrow}>›</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ) : null}

        {activeTab === 'account' ? (
          <View style={styles.contentCard}>
            <Text style={styles.heading}>Account</Text>
            <Text style={styles.subheading}>Sign-in and account features are not available yet.</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
        {([
          { key: 'timetable', label: 'Timetable', icon: 'clock' },
          { key: 'routes', label: 'Routes', icon: 'map' },
          { key: 'account', label: 'Account', icon: 'user' },
        ] as const).map((tab) => (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab.key }}
            onPress={() => setActiveTab(tab.key)}
            style={styles.tabButton}
          >
            <Feather name={tab.icon} size={21} color={activeTab === tab.key ? '#2563eb' : '#64748b'} />
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>

      <Modal transparent animationType="slide" visible={!!activePicker} onRequestClose={() => setActivePicker(null)}>
        <View style={styles.modalRoot}>
          <Pressable accessibilityLabel="Close picker" style={styles.modalBackdrop} onPress={() => setActivePicker(null)} />
          <View style={[styles.sheet, { paddingBottom: Math.max(24, insets.bottom + 16) }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{pickerTitle}</Text>
            <ScrollView>
              {pickerOptions.map((option) => {
                const selectedValue = activePicker === 'region'
                  ? selectedRegionId
                  : activePicker === 'route'
                    ? selectedRouteId
                    : activePicker === 'day'
                      ? selectedDay
                      : selectedStopId;
                return (
                  <Pressable
                    key={option.value || 'all-stops'}
                    accessibilityRole="button"
                    onPress={() => selectPickerOption(option.value)}
                    style={styles.optionRow}
                  >
                    <Text style={styles.optionText}>{option.label}</Text>
                    {selectedValue === option.value ? <Text style={styles.optionCheck}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appHeader: {
    minHeight: 66,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  menuIcon: {
    color: '#0f172a',
    fontSize: 23,
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 2,
  },
  appName: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 1,
  },
  contentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  bottomNav: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 4,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  tabButton: {
    flex: 1,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  tabActive: {
    color: '#2563eb',
  },
  routeRegion: {
    marginTop: 24,
    marginBottom: 16,
  },
  routeList: {
    gap: 10,
  },
  routeCard: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  routeCardPressed: {
    backgroundColor: '#eff6ff',
    borderColor: '#93c5fd',
  },
  routeCode: {
    minWidth: 48,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
  },
  routeCodeText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '800',
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
  },
  routeHint: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
  routeArrow: {
    color: '#94a3b8',
    fontSize: 27,
    marginLeft: 8,
  },
  routeLoader: {
    marginVertical: 28,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
  },
  sheet: {
    maxHeight: '78%',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    marginBottom: 18,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
  },
  sheetTitle: {
    marginBottom: 10,
    color: '#0f172a',
    fontSize: 19,
    fontWeight: '800',
  },
  optionRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  optionText: {
    color: '#1e293b',
    fontSize: 15,
  },
  optionCheck: {
    color: '#2563eb',
    fontSize: 18,
    fontWeight: '800',
  },
  drawerRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
  },
  drawer: {
    width: '82%',
    maxWidth: 340,
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderTopRightRadius: 22,
    borderBottomRightRadius: 22,
  },
  drawerBrand: {
    color: '#0f172a',
    fontSize: 25,
    fontWeight: '800',
  },
  drawerCaption: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 5,
    marginBottom: 28,
  },
  drawerItem: {
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  drawerItemActive: {
    backgroundColor: '#eff6ff',
  },
  drawerItemText: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '600',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  container: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 20,
  },
  banner: {
    width: '100%',
    height: 160,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  adImage: {
    width: '100%',
    height: '100%',
  },
  adPlaceholder: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adPlaceholderText: {
    color: '#9ca3af',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  mainRow: {
    flexDirection: 'row',
    gap: 16,
  },
  sideAd: {
    width: 160,
    height: 600,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
    display: 'flex',
  },
  panel: {
    flex: 1,
    minHeight: 600,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleWrap: {
    flex: 1,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  subheading: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
  },
  liveBadgeWrap: {
    marginLeft: 12,
  },
  liveBadge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    letterSpacing: 0.5,
    overflow: 'hidden',
  },
  liveBadgeActive: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
  },
  liveBadgeInactive: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
  },
  filtersGrid: {
    gap: 14,
    marginTop: 24,
    marginBottom: 24,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  selectBlock: {
    width: '100%',
  },
  pickerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#dbe3ee',
    backgroundColor: '#fff',
    borderRadius: 12,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  pickerBoxPressed: {
    borderColor: '#60a5fa',
    backgroundColor: '#f8fbff',
  },
  pickerBoxDisabled: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    minHeight: 52,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: {
    color: '#0f172a',
    fontSize: 14,
    flex: 1,
  },
  chevron: {
    color: '#64748b',
    fontSize: 20,
    marginLeft: 8,
  },
  disabledText: {
    color: '#94a3b8',
  },
  loadingBox: {
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    minHeight: 42,
  },
  timetableWrapper: {
    marginTop: 6,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 12,
  },
  loaderWrap: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyState: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 14,
    paddingVertical: 32,
  },
  tableContainer: {
    minWidth: 650,
    paddingBottom: 10,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  tableHeaderCell: {
    flexShrink: 0,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  tableHeaderCellSelected: {
    borderColor: '#60a5fa',
    backgroundColor: '#eff6ff',
  },
  headerStopName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  headerCode: {
    marginTop: 4,
    fontSize: 10,
    color: '#64748b',
    letterSpacing: 0.4,
  },
  tableRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  tableCell: {
    flexShrink: 0,
    minHeight: 52,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    color: '#1f2937',
    fontSize: 13,
    fontWeight: '600',
  },
  relativeTime: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 10,
  },
});
