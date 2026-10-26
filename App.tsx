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
  useWindowDimensions,
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
const theme = {
  navy: '#082d46',
  navyDark: '#06263b',
  navySoft: '#e7f0f6',
  background: '#f3f6f8',
  surface: '#ffffff',
  surfaceMuted: '#eaf1f5',
  border: '#dce5ea',
  text: '#102a3a',
  textMuted: '#5c7180',
  textQuiet: '#8495a0',
};
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
  const [activeTab, setActiveTab] = useState<AppTab>('routes');
  const [activePicker, setActivePicker] = useState<PickerType | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [clock, setClock] = useState(() => new Date());
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const isMobileLayout = windowWidth < 640;

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
  const activeRoute = routes.find((route) => route.RouteId === selectedRouteId);

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
            <Text style={styles.heading}>{activeRoute?.Name || 'Your next bus'}</Text>
            <Text style={styles.subheading}>
              {activeRoute ? `Route ${activeRoute.Code} · upcoming departures` : 'Choose a route from Routes to see departures.'}
            </Text>
            <View style={styles.filtersGrid}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Live departures</Text>
                <Switch
                  value={liveTimetable}
                  onValueChange={setLiveTimetable}
                  disabled={regionsUnavailable}
                  trackColor={{ false: theme.border, true: theme.navy }}
                />
              </View>
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
                  <ActivityIndicator size="large" color={theme.navy} />
                  {loadingRegions ? <Text style={styles.emptyState}>Waiting for timetable data…</Text> : null}
                </View>
              ) : !hasRoute ? (
                <Text style={styles.emptyState}>Choose a route from Routes to see departures.</Text>
              ) : !hasRows ? (
                <Text style={styles.emptyState}>No more upcoming departures.</Text>
              ) : isMobileLayout ? (
                <View style={styles.mobileStopsList}>
                  {filteredStops.map((stop, stopIndex) => {
                    const stopTimes = rowsToDisplay
                      .map((row) => row[stopIndex])
                      .filter((time): time is string => !!time);

                    return (
                      <View key={stop.StopId} style={styles.mobileStopCard}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityState={{ selected: selectedStopId === stop.StopId }}
                          onPress={() => setSelectedStopId(selectedStopId === stop.StopId ? '' : stop.StopId)}
                          style={[
                            styles.mobileStopHeader,
                            {
                              backgroundColor: selectedStopId === stop.StopId ? theme.navy : theme.surfaceMuted,
                              borderColor: selectedStopId === stop.StopId ? theme.navy : theme.border,
                            },
                          ]}
                        >
                          <View style={styles.mobileStopTitleWrap}>
                            <Text style={[styles.mobileStopName, selectedStopId === stop.StopId && styles.mobileStopSelectedText]}>
                              {stop.Suburb}
                            </Text>
                            {stop.Code ? (
                              <Text style={[styles.mobileStopCode, selectedStopId === stop.StopId && styles.mobileStopSelectedText]}>
                                {stop.Code}
                              </Text>
                            ) : null}
                          </View>
                          <Feather
                            name={selectedStopId === stop.StopId ? 'check-circle' : 'chevron-right'}
                            size={18}
                            color={selectedStopId === stop.StopId ? theme.surface : theme.navy}
                          />
                        </Pressable>
                        {stopTimes.length > 0 ? (
                          <View style={styles.mobileTimesGrid}>
                            {stopTimes.map((time, timeIndex) => (
                              <View key={`${stop.StopId}-${time}-${timeIndex}`} style={styles.mobileTimeChip}>
                                <Text style={styles.mobileTimeText}>{time}</Text>
                                {liveTimetable ? <Text style={styles.mobileRelativeTime}>{getTimeLabel(time)}</Text> : null}
                              </View>
                            ))}
                          </View>
                        ) : (
                          <Text style={styles.mobileNoDepartures}>No upcoming departures</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={[styles.tableContainer, { width: tableWidth }]}>
                    <View style={styles.tableHeaderRow}>
                      {filteredStops.map((stop) => {
                        return (
                          <Pressable
                            key={stop.StopId}
                            accessibilityRole="button"
                            accessibilityState={{ selected: selectedStopId === stop.StopId }}
                            onPress={() => setSelectedStopId(selectedStopId === stop.StopId ? '' : stop.StopId)}
                            style={[
                              styles.tableHeaderCell,
                              {
                                width: tableColumnWidth,
                                backgroundColor: selectedStopId === stop.StopId ? theme.navy : theme.surfaceMuted,
                                borderColor: selectedStopId === stop.StopId ? theme.navyDark : theme.border,
                              },
                              selectedStopId === stop.StopId && styles.tableHeaderCellSelected,
                            ]}
                          >
                            <Text style={[
                              styles.headerStopName,
                              selectedStopId === stop.StopId && styles.tableHeaderSelectedText,
                            ]}>
                              {stop.Suburb}
                            </Text>
                            {stop.Code ? (
                              <Text style={[
                                styles.headerCode,
                                selectedStopId === stop.StopId && styles.tableHeaderSelectedText,
                              ]}>
                                {stop.Code}
                              </Text>
                            ) : null}
                          </Pressable>
                        );
                      })}
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
              <ActivityIndicator style={styles.routeLoader} color={theme.navy} />
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
          { key: 'routes', label: 'Routes', icon: 'map' },
          { key: 'timetable', label: 'Timetable', icon: 'clock' },
          { key: 'account', label: 'Account', icon: 'user' },
        ] as const).map((tab) => (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab.key }}
            onPress={() => setActiveTab(tab.key)}
            style={styles.tabButton}
          >
            <View style={[styles.tabIndicator, activeTab === tab.key && styles.tabIndicatorActive]} />
            <Feather name={tab.icon} size={21} color={activeTab === tab.key ? theme.navy : theme.textMuted} />
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
    backgroundColor: theme.surface,
    borderBottomWidth: 2,
    borderBottomColor: theme.navy,
  },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  menuIcon: {
    color: theme.navy,
    fontSize: 23,
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 2,
  },
  appName: {
    color: theme.navy,
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: theme.textMuted,
    fontSize: 12,
    marginTop: 1,
  },
  contentCard: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: theme.navyDark,
    shadowOpacity: 0.04,
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
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  tabButton: {
    flex: 1,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabIndicator: {
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  tabIndicatorActive: {
    backgroundColor: theme.navy,
  },
  tabLabel: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  tabActive: {
    color: theme.navy,
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
    borderColor: theme.border,
    borderRadius: 16,
    backgroundColor: theme.surface,
  },
  routeCardPressed: {
    backgroundColor: theme.navySoft,
    borderColor: theme.navy,
  },
  routeCode: {
    minWidth: 48,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: theme.navySoft,
  },
  routeCodeText: {
    color: theme.navy,
    fontSize: 14,
    fontWeight: '800',
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '700',
  },
  routeHint: {
    color: theme.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  routeArrow: {
    color: theme.textQuiet,
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
    backgroundColor: 'rgba(6, 38, 59, 0.42)',
  },
  sheet: {
    maxHeight: '78%',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: theme.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    marginBottom: 18,
    borderRadius: 2,
    backgroundColor: theme.border,
  },
  sheetTitle: {
    marginBottom: 10,
    color: theme.text,
    fontSize: 19,
    fontWeight: '800',
  },
  optionRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: theme.surfaceMuted,
  },
  optionText: {
    color: theme.text,
    fontSize: 15,
  },
  optionCheck: {
    color: theme.navy,
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
    backgroundColor: 'rgba(6, 38, 59, 0.42)',
  },
  drawer: {
    width: '82%',
    maxWidth: 340,
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: theme.surface,
    borderTopRightRadius: 22,
    borderBottomRightRadius: 22,
  },
  drawerBrand: {
    color: theme.navy,
    fontSize: 25,
    fontWeight: '800',
  },
  drawerCaption: {
    color: theme.textMuted,
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
    backgroundColor: theme.navySoft,
  },
  drawerItemText: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '600',
  },
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
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
    backgroundColor: theme.surfaceMuted,
  },
  adImage: {
    width: '100%',
    height: '100%',
  },
  adPlaceholder: {
    flex: 1,
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adPlaceholderText: {
    color: theme.textQuiet,
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
    backgroundColor: theme.surfaceMuted,
    display: 'flex',
  },
  panel: {
    flex: 1,
    minHeight: 600,
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: theme.navyDark,
    shadowOpacity: 0.05,
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
    color: theme.text,
    marginBottom: 6,
  },
  subheading: {
    color: theme.textMuted,
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
    backgroundColor: theme.navySoft,
    color: theme.navy,
  },
  liveBadgeInactive: {
    backgroundColor: theme.surfaceMuted,
    color: theme.textMuted,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    marginBottom: 16,
  },
  errorText: {
    color: theme.navy,
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
    color: theme.textMuted,
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
    borderColor: theme.border,
    backgroundColor: theme.surface,
    borderRadius: 12,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  pickerBoxPressed: {
    borderColor: theme.navy,
    backgroundColor: theme.surfaceMuted,
  },
  pickerBoxDisabled: {
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.background,
    borderRadius: 12,
    minHeight: 52,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: {
    color: theme.text,
    fontSize: 14,
    flex: 1,
  },
  chevron: {
    color: theme.textMuted,
    fontSize: 20,
    marginLeft: 8,
  },
  disabledText: {
    color: theme.textQuiet,
  },
  loadingBox: {
    backgroundColor: theme.surfaceMuted,
    borderRadius: 10,
    minHeight: 42,
  },
  timetableWrapper: {
    marginTop: 6,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.navy,
    textAlign: 'center',
    marginBottom: 12,
  },
  mobileStopsList: {
    gap: 12,
    paddingBottom: 10,
  },
  mobileStopCard: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    backgroundColor: theme.surface,
  },
  mobileStopHeader: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  mobileStopTitleWrap: {
    flex: 1,
  },
  mobileStopName: {
    color: theme.navy,
    fontSize: 14,
    fontWeight: '700',
  },
  mobileStopSelectedText: {
    color: theme.surface,
  },
  mobileStopCode: {
    marginTop: 2,
    color: theme.textMuted,
    fontSize: 11,
  },
  mobileTimesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
  },
  mobileTimeChip: {
    minWidth: 78,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: theme.background,
  },
  mobileTimeText: {
    color: theme.navy,
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  mobileRelativeTime: {
    marginTop: 2,
    color: theme.textMuted,
    fontSize: 11,
  },
  mobileNoDepartures: {
    paddingHorizontal: 14,
    paddingVertical: 16,
    color: theme.textMuted,
    fontSize: 13,
  },
  loaderWrap: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyState: {
    textAlign: 'center',
    color: theme.textMuted,
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
    borderColor: theme.border,
    borderRadius: 12,
    backgroundColor: theme.surface,
  },
  tableHeaderCellSelected: {
    borderColor: theme.navyDark,
    borderWidth: 2,
  },
  tableHeaderSelectedText: {
    color: theme.surface,
  },
  headerStopName: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.navy,
    textAlign: 'center',
  },
  headerCode: {
    marginTop: 4,
    fontSize: 10,
    color: theme.textMuted,
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
    backgroundColor: theme.surface,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    color: theme.text,
    fontSize: 13,
    fontWeight: '600',
  },
  relativeTime: {
    marginTop: 4,
    color: theme.textMuted,
    fontSize: 10,
  },
});
