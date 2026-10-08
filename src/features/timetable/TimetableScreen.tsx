import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from 'expo-vector-icons';
import { useAuth } from '../auth/useAuth';
import type { RootStackParamList } from '../../navigation/types';
import {
  dayMap,
  fetchMedia,
  fetchRegions,
  fetchRoutes,
  fetchTimetables,
  saveUserToBackend,
  type Region,
  type Route,
  type ScheduleStop,
  type SavedUser,
  type Stop,
} from '../../services/api';

const MAX_UPCOMING_ROWS = 5;
type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function TimetableScreen({ navigation }: Props) {
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
  const [savedUser, setSavedUser] = useState<SavedUser | null>(null);
  const [mediaAds, setMediaAds] = useState<any[]>([]);
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [showRouteDropdown, setShowRouteDropdown] = useState(false);
  const [showDayDropdown, setShowDayDropdown] = useState(false);
  const [showStopDropdown, setShowStopDropdown] = useState(false);
  const [schedulePage, setSchedulePage] = useState(1);

  const { login, getToken, account, logout } = useAuth();
  const hasSavedUser = useRef(false);
  const now = new Date();
  const currentDayName = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ][now.getDay()];
  const dayOptions = [
    { value: 'Monday', label: 'Monday' },
    { value: 'Tuesday', label: 'Tuesday' },
    { value: 'Wednesday', label: 'Wednesday' },
    { value: 'Thursday', label: 'Thursday' },
    { value: 'Friday', label: 'Friday' },
    { value: 'Saturday', label: 'Saturday' },
    { value: 'Sunday', label: 'Sunday' },
    { value: 'Public Holiday', label: 'Public Holiday' },
  ];
  const getFriendlyDayLabel = (day: string) =>
    dayOptions.find((option) => option.value === day)?.label ?? day;

  const closeAllDropdowns = () => {
    setShowRegionDropdown(false);
    setShowRouteDropdown(false);
    setShowDayDropdown(false);
    setShowStopDropdown(false);
  };

  const topAd = mediaAds?.[2];
  const leftAd = mediaAds?.[1];
  const rightAd = mediaAds?.[0];

  useEffect(() => {
    const loadAds = async () => {
      try {
        const data = await fetchMedia();
        setMediaAds(data);
      } catch (err) {
        console.error('Failed to load ads:', err);
      }
    };

    loadAds();
  }, []);

  useEffect(() => {
    if (liveTimetable) setSelectedDay('');
  }, [liveTimetable]);

  useEffect(() => {
    setSchedulePage(1);
  }, [selectedRouteId, selectedStopId, liveTimetable, selectedDay]);

  useEffect(() => {
    const saveUserToBackendAsync = async () => {
      if (!account || hasSavedUser.current) return;
      hasSavedUser.current = true;

      try {
        const tokenResponse = await getToken();
        const oid = account.idTokenClaims?.oid || account.localAccountId;
        const payload = {
          Name: account.name || account.username || 'User',
          Email: account.username || account.idTokenClaims?.preferred_username || '',
          AzureOID: oid,
        };

        const user = await saveUserToBackend(payload, tokenResponse.accessToken);
        setSavedUser(user);
      } catch (err) {
        console.error('Backend login save failed:', err);
        setError('Failed to save signed-in user.');
      }
    };

    saveUserToBackendAsync();
  }, [account]);

  useEffect(() => {
    const loadRegions = async () => {
      try {
        setLoadingRegions(true);
        const data = await fetchRegions();
        setRegions(data);
        console.log("DATA+ " + JSON.stringify(data));
      } catch {
        setError('Error loading regions');
      } finally {
        setLoadingRegions(false);
      }
    };

    loadRegions();
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
        console.log("ROUTES: " + JSON.stringify(data));
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
      const selectedDayKey = (selectedDay || currentDayName || 'Monday').trim();
      const serviceType = dayMap[selectedDayKey] ?? dayMap['Sunday'] ?? 'WEEKDAY';

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
        })).sort((a: ScheduleStop, b: ScheduleStop) => b.Order - a.Order);

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

  // For live timetable, filter out past times from each stop
  const processedStops = liveTimetable
    ? filteredStops.map((stop) => ({
        ...stop,
        Times: stop.Times.filter((time) => {
          if (!time) return false;
          const [h, m] = time.split(':').map(Number);
          const t = new Date();
          t.setHours(h, m, 0, 0);
          return t.getTime() >= now.getTime();
        }),
      }))
    : filteredStops;

  const maxTrips = Math.max(...processedStops.map((s) => s.Times?.length || 0), 0);
  const timetableRows: string[][] = [];

  for (let i = 0; i < maxTrips; i += 1) {
    const row = processedStops.map((s) => s.Times[i] || '');

    if (liveTimetable) {
      const allPast = row.every((time) => !time);

      if (!allPast) timetableRows.push(row);
    } else {
      timetableRows.push(row);
    }
  }

  const rowsToDisplay = liveTimetable ? timetableRows.slice(0, MAX_UPCOMING_ROWS) : timetableRows;
  const hasRoute = !!selectedRouteId;
  const hasRows = rowsToDisplay.length > 0;
  const selectedRegionName = regions.find((r) => r.RegionId === selectedRegionId)?.Name || 'Select region';
  const selectedRouteName = routes.find((r) => r.RouteId === selectedRouteId)?.Name || 'Select route';
  const selectedStopName = stops.find((s) => s.StopId === selectedStopId)?.Suburb || 'All stops';
  const selectedDayName = selectedDay || currentDayName;
  const stopPageSize = 4;
  const totalStopPages = Math.max(1, Math.ceil(processedStops.length / stopPageSize));
  const pagedStops = processedStops.slice((schedulePage - 1) * stopPageSize, schedulePage * stopPageSize);

  const getTimeLabel = (time: string) => {
    if (!time) return '—';

    const [h, m] = time.split(':').map(Number);
    const t = new Date();
    t.setHours(h, m, 0, 0);
    const diff = Math.floor((t.getTime() - now.getTime()) / 60000);

    if (diff === 0) return 'Now';
    if (diff > 0) return diff < 60 ? `${diff}m` : `${Math.floor(diff / 60)}h ${diff % 60}m`;

    const past = Math.abs(diff);
    return past < 60 ? `-${past}m` : `-${Math.floor(past / 60)}h`;
  };

  const headerUser = useMemo(() => {
    if (!account) return null;

    return {
      name: account.name || account.username || 'User',
      email: account.username || account.idTokenClaims?.preferred_username || '',
      initials: (account.name || account.username || 'U')[0].toUpperCase(),
    };
  }, [account]);

  const nextDeparture = rowsToDisplay[0]?.find((time) => !!time) || '—';

  const activePicker = showRegionDropdown
    ? {
        title: 'Select region',
        items: regions as any[],
        keyExtractor: (region: any) => region.RegionId,
        label: (region: any) => region.Name,
        isSelected: (region: any) => region.RegionId === selectedRegionId,
        onSelect: (region: any) => setSelectedRegionId(region.RegionId),
      }
    : showRouteDropdown
      ? {
          title: 'Select route',
          items: routes as any[],
          keyExtractor: (route: any) => route.RouteId,
          label: (route: any) => route.Name,
          isSelected: (route: any) => route.RouteId === selectedRouteId,
          onSelect: (route: any) => setSelectedRouteId(route.RouteId),
        }
      : showDayDropdown
        ? {
            title: 'Select day',
            items: dayOptions as any[],
            keyExtractor: (day: any) => day.value,
            label: (day: any) => day.label,
            isSelected: (day: any) => day.value === selectedDayName,
            onSelect: (day: any) => setSelectedDay(day.value),
          }
        : showStopDropdown
          ? {
              title: 'Select stop',
              items: [{ StopId: '', Suburb: 'All stops' }, ...stops] as any[],
              keyExtractor: (stop: any) => stop.StopId || 'all-stops',
              label: (stop: any) => stop.Suburb,
              isSelected: (stop: any) => stop.StopId === selectedStopId,
              onSelect: (stop: any) => setSelectedStopId(stop.StopId),
            }
          : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.mediaStrip}>
          {/* reserved for future banner/gallery content */}
        </View>

        <View style={styles.panel}>
          <View style={styles.headerRow}>
            <View style={styles.titleWrap}>
              <Text style={styles.eyebrow}>AT Hop</Text>
              <Text style={styles.heading}>Bus Timetable</Text>
            </View>

            <View style={styles.liveBadgeWrap}>
              <Text style={[styles.liveBadge, liveTimetable ? styles.liveBadgeActive : styles.liveBadgeInactive]}>
                {liveTimetable ? 'LIVE' : 'STATIC'}
              </Text>
            </View>
          </View>

          <View style={styles.userRow}>
            {account ? (
              <>
                <View style={styles.userCard}>
                  <View style={styles.avatar}><Text style={styles.avatarText}>{headerUser?.initials}</Text></View>
                  <View style={styles.userMeta}>
                    <Text style={styles.userName}>{headerUser?.name}</Text>
                    <Text style={styles.userEmail}>{headerUser?.email}</Text>
                  </View>
                </View>

                <View style={styles.pointsBadge}>
                  <Text style={styles.pointsText}>{savedUser?.TotalPoints ?? 0} pts</Text>
                </View>

                <Pressable style={styles.buttonSecondary} onPress={logout}>
                  <Text style={styles.buttonSecondaryText}>Logout</Text>
                </Pressable>
              </>
            ) : (
              <Pressable style={styles.buttonPrimary} onPress={login}>
                <Text style={styles.buttonPrimaryText}>Login</Text>
              </Pressable>
            )}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View>
                <Text style={styles.heroLabel}>Next departure</Text>
                <Text style={styles.heroTitle}>{selectedRouteName === 'Select route' ? 'Choose a route' : selectedRouteName}</Text>
              </View>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>{liveTimetable ? 'Live' : 'Plan'}</Text>
              </View>
            </View>

            <View style={styles.heroMainRow}>
              <Text style={styles.heroTime}>{nextDeparture}</Text>
              <Text style={styles.heroMeta}>{selectedStopName}</Text>
            </View>

            <View style={styles.heroActionRow}>
              <Pressable
                style={styles.heroActionButtonPrimary}
                onPress={() =>
                  navigation.navigate('RouteDetails', {
                    routeId: selectedRouteId || 'unknown',
                    routeName: selectedRouteName === 'Select route' ? 'Unknown route' : selectedRouteName,
                    stopName: selectedStopName,
                  })
                }
              >
                <Text style={styles.heroActionButtonPrimaryText}>Plan trip</Text>
              </Pressable>
              <Pressable style={styles.heroActionButtonSecondary}>
                <Text style={styles.heroActionButtonSecondaryText}>My stops</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.sectionTitle}>Trip details</Text>
              <Text style={styles.summaryTime}>{now.toTimeString().slice(0, 5)}</Text>
            </View>

            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Region</Text>
                <Text style={styles.summaryValue}>{selectedRegionName}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Route</Text>
                <Text style={styles.summaryValue}>{selectedRouteName}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Stop</Text>
                <Text style={styles.summaryValue}>{selectedStopName}</Text>
              </View>
            </View>
          </View>

          <View style={styles.filtersCard}>
            <View style={styles.filterTopRow}>
              <Text style={styles.sectionTitle}>Schedule options</Text>
              <View style={styles.modeToggle}>
                <Pressable
                  style={[styles.modeButton, liveTimetable && styles.modeButtonActive]}
                  onPress={() => setLiveTimetable(true)}
                >
                  <Text style={[styles.modeButtonText, liveTimetable && styles.modeButtonTextActive]}>Live</Text>
                </Pressable>
                <Pressable
                  style={[styles.modeButton, !liveTimetable && styles.modeButtonActive]}
                  onPress={() => setLiveTimetable(false)}
                >
                  <Text style={[styles.modeButtonText, !liveTimetable && styles.modeButtonTextActive]}>Static</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.filtersGrid}>
              <View style={styles.selectBlock}>
                <Text style={styles.label}>Region</Text>
                {loadingRegions ? (
                  <View style={styles.loadingBox} />
                ) : (
                  <View style={styles.regionPickerContainer}>
                    <View style={styles.pickerBoxRow}>
                      <Pressable
                        style={[styles.pickerBox, styles.pickerBoxFlex]}
                        onPress={() => {
                          closeAllDropdowns();
                          setShowRegionDropdown((previous) => !previous);
                        }}
                      >
                        <Text style={styles.pickerText}>{selectedRegionName}</Text>
                        {/* <Ionicons name="expand-more" size={20} color="#64748b" /> */}
                      </Pressable>
                      
                      {/* Clear button */}
                      {/* {selectedRegionId && (
                        <Pressable
                          style={styles.clearButton}
                          onPress={() => {
                            setSelectedRegionId('');
                            setShowRegionDropdown(false);
                          }}
                        >
                          <Ionicons name="close" size={18} color="#64748b" />
                        </Pressable>
                      )} */}
                    </View>
                    
                    {/* Native sheet handled below */}
                  </View>
                )}
              </View>

              <View style={styles.selectBlock}>
                <Text style={styles.label}>Route</Text>
                {loadingRoutes ? (
                  <View style={styles.loadingBox} />
                ) : (
                  <View style={styles.regionPickerContainer}>
                    <View style={styles.pickerBoxRow}>
                      <Pressable
                        style={[styles.pickerBox, styles.pickerBoxFlex]}
                        onPress={() => {
                          closeAllDropdowns();
                          setShowRouteDropdown((previous) => !previous);
                        }}
                      >
                        <Text style={styles.pickerText}>{selectedRouteName}</Text>
                        {/* <Ionicons name="expand-more" size={20} color="#64748b" /> */}
                      </Pressable>
                      
                      {/* Clear button */}
                      {/* {selectedRouteId && (
                        <Pressable
                          style={styles.clearButton}
                          onPress={() => {
                            setSelectedRouteId('');
                            setShowRouteDropdown(false);
                          }}
                        >
                          <Ionicons name="close" size={18} color="#64748b" />
                        </Pressable>
                      )} */}
                    </View>
                    
                    {/* Dropdown menu */}
                    {false && null}
                  </View>
                )}
              </View>

              <View style={styles.selectBlock}>
                <Text style={styles.label}>Day</Text>
                {liveTimetable ? (
                  <View style={styles.pickerBoxDisabled}>
                    <Text style={styles.pickerText}>{`Today (${currentDayName})`}</Text>
                  </View>
                ) : (
                  <View style={styles.regionPickerContainer}>
                    <View style={styles.pickerBoxRow}>
                      <Pressable
                        style={[styles.pickerBox, styles.pickerBoxFlex]}
                        onPress={() => {
                          closeAllDropdowns();
                          setShowDayDropdown((previous) => !previous);
                        }}
                      >
                        <Text style={styles.pickerText}>{getFriendlyDayLabel(selectedDayName)}</Text>
                        {/* <Ionicons name="expand-more" size={20} color="#64748b" /> */}
                      </Pressable>

                      {/* {selectedDay && (
                        <Pressable
                          style={styles.clearButton}
                          onPress={() => {
                            setSelectedDay('');
                            setShowDayDropdown(false);
                          }}
                        >
                          <Ionicons name="close" size={18} color="#64748b" />
                        </Pressable>
                      )} */}
                    </View>

                    {false && null}
                  </View>
                )}
              </View>

              <View style={styles.selectBlock}>
                <Text style={styles.label}>Stop</Text>
                {loadingSchedules ? (
                  <View style={styles.loadingBox} />
                ) : (
                  <View style={styles.regionPickerContainer}>
                    <View style={styles.pickerBoxRow}>
                      <Pressable
                        style={[styles.pickerBox, styles.pickerBoxFlex]}
                        onPress={() => {
                          if (liveTimetable) return;
                          closeAllDropdowns();
                          setShowStopDropdown((previous) => !previous);
                        }}
                        disabled={liveTimetable}
                      >
                        <Text style={styles.pickerText}>{selectedStopName}</Text>
                        {/* {!liveTimetable && <Ionicons name="expand-more" size={20} color="#64748b" />} */}
                      </Pressable>

                      {/* {selectedStopId && !liveTimetable && (
                        <Pressable
                          style={styles.clearButton}
                          onPress={() => {
                            setSelectedStopId('');
                            setShowStopDropdown(false);
                          }}
                        >
                          <Ionicons name="close" size={18} color="#64748b" />
                        </Pressable>
                      )} */}
                    </View>

                    {false && null}
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.timetableWrapper}>
            <Text style={styles.tableTitle}>
              {liveTimetable ? 'Live departures' : 'Scheduled departures'}
            </Text>

            {loadingSchedules ? (
              <View style={styles.loaderWrap}>
                <ActivityIndicator size="large" color="#2563eb" />
              </View>
            ) : !hasRoute ? (
              <Text style={styles.emptyState}>Please select a route</Text>
            ) : !hasRows ? (
              <Text style={styles.emptyState}>No more upcoming departures</Text>
            ) : (
              <View>
                <View style={styles.paginationHeader}>
                  <Text style={styles.paginationText}>
                    Stops {Math.min((schedulePage - 1) * stopPageSize + 1, processedStops.length)}-{Math.min(schedulePage * stopPageSize, processedStops.length)} of {processedStops.length}
                  </Text>

                  <View style={styles.paginationControls}>
                    <Pressable
                      style={[styles.pageButton, schedulePage === 1 && styles.pageButtonDisabled]}
                      onPress={() => setSchedulePage((page) => Math.max(1, page - 1))}
                      disabled={schedulePage === 1}
                    >
                      <Text style={[styles.pageButtonText, schedulePage === 1 && styles.pageButtonTextDisabled]}>Prev</Text>
                    </Pressable>

                    <Pressable
                      style={[styles.pageButton, schedulePage === totalStopPages && styles.pageButtonDisabled]}
                      onPress={() => setSchedulePage((page) => Math.min(totalStopPages, page + 1))}
                      disabled={schedulePage === totalStopPages}
                    >
                      <Text style={[styles.pageButtonText, schedulePage === totalStopPages && styles.pageButtonTextDisabled]}>Next</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.departureList}>
                  {pagedStops.map((stop) => (
                    <View key={stop.StopId} style={styles.departureCard}>
                      <View style={styles.departureCardHeader}>
                        <View style={styles.stopLabelWrap}>
                          <Text style={styles.departureLabel}>Stop</Text>
                          <Text style={styles.departureTime}>{stop.Suburb}</Text>
                        </View>

                        {stop.Code ? <Text style={styles.scheduleTag}>{stop.Code}</Text> : null}
                      </View>

                      <Text style={styles.routeSummary}>Scheduled times</Text>

                      {stop.Times && stop.Times.length > 0 ? (
                        <View style={styles.timeChipWrap}>
                          {stop.Times.map((time) => (
                            <Text key={`${stop.StopId}-${time}`} style={styles.timeChip}>
                              {time}
                            </Text>
                          ))}
                        </View>
                      ) : (
                        <Text style={styles.emptyStateSmall}>No departures for this stop</Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        transparent
        visible={!!activePicker}
        animationType="slide"
        onRequestClose={closeAllDropdowns}
      >
        <Pressable style={styles.sheetBackdrop} onPress={closeAllDropdowns} />
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{activePicker?.title}</Text>

          <ScrollView style={styles.sheetList} contentContainerStyle={styles.sheetListContent}>
            {activePicker?.items.map((item) => (
              <Pressable
                key={activePicker.keyExtractor(item)}
                style={[
                  styles.sheetItem,
                  activePicker.isSelected(item) && styles.sheetItemSelected,
                ]}
                onPress={() => {
                  activePicker.onSelect(item);
                  closeAllDropdowns();
                }}
              >
                <Text
                  style={[
                    styles.sheetItemText,
                    activePicker.isSelected(item) && styles.sheetItemTextSelected,
                  ]}
                >
                  {activePicker.label(item)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 12,
  },
  mediaStrip: {
    minHeight: 0,
  },
  panel: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 0,
    padding: 0,
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleWrap: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#007AFF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heading: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.8,
  },
  liveBadgeWrap: {
    marginLeft: 12,
  },
  liveBadge: {
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    letterSpacing: 0.7,
    overflow: 'hidden',
  },
  liveBadgeActive: {
    backgroundColor: '#E8F8EE',
    color: '#1F8F4D',
  },
  liveBadgeInactive: {
    backgroundColor: '#E5E7EB',
    color: '#4B5563',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 14,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  userMeta: {
    flexShrink: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  userEmail: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  pointsBadge: {
    backgroundColor: '#FFF4D6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 72,
    alignItems: 'center',
  },
  pointsText: {
    color: '#A65B00',
    fontWeight: '700',
    fontSize: 12,
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: '#C7D2FE',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 92,
    alignItems: 'center',
  },
  buttonSecondaryText: {
    color: '#1D4ED8',
    fontWeight: '700',
    fontSize: 13,
  },
  errorText: {
    color: '#D93025',
    marginBottom: 12,
    fontSize: 13,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroLabel: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroTitle: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  heroBadge: {
    backgroundColor: '#E8F1FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroBadgeText: {
    color: '#0F4CBA',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  heroMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  heroTime: {
    color: '#007AFF',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
  },
  heroMeta: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 120,
    textAlign: 'right',
  },
  heroActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  heroActionButtonPrimary: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flex: 1,
    alignItems: 'center',
  },
  heroActionButtonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  heroActionButtonSecondary: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flex: 1,
    alignItems: 'center',
  },
  heroActionButtonSecondaryText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  summaryTime: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '700',
  },
  summaryValue: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
  },
  filtersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 16,
    overflow: 'visible',
  },
  filterTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    padding: 4,
  },
  modeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 68,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  modeButtonText: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '700',
  },
  modeButtonTextActive: {
    color: '#007AFF',
  },
  filtersGrid: {
    flexDirection: 'column',
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 6,
  },
  selectBlock: {
    width: '100%',
    minWidth: 0,
    flex: 1,
    overflow: 'visible',
  },
  pickerBox: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 12,
    justifyContent: 'center',
    width: '100%',
  },
  pickerBoxDisabled: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  pickerText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingBox: {
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    minHeight: 44,
  },
  regionPickerContainer: {
    position: 'relative',
    zIndex: 10,
    width: '100%',
  },
  pickerBoxRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    width: '100%',
  },
  pickerBoxFlex: {
    flex: 1,
    width: '100%',
  },
  clearButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  clearButtonText: {
    fontSize: 18,
    color: '#DC2626',
    fontWeight: '700',
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.35)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
    maxHeight: '72%',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -6 },
    elevation: 18,
  },
  sheetHandle: {
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  sheetList: {
    maxHeight: 420,
  },
  sheetListContent: {
    paddingBottom: 8,
  },
  sheetItem: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: '#F9FAFB',
  },
  sheetItemSelected: {
    backgroundColor: '#E8F1FF',
  },
  sheetItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  sheetItemTextSelected: {
    color: '#007AFF',
    fontWeight: '700',
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    marginTop: 6,
    maxHeight: 300,
    overflow: 'hidden',
    zIndex: 1000,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  dropdownItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  dropdownItemTextSelected: {
    color: '#007AFF',
    fontWeight: '700',
  },
  checkmark: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '700',
    marginLeft: 8,
  },
  routeItemContent: {
    flex: 1,
  },
  routeCode: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '600',
  },
  timetableWrapper: {
    marginTop: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    padding: 12,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'left',
    marginBottom: 12,
  },
  loaderWrap: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyState: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    paddingVertical: 32,
  },
  paginationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  paginationText: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '700',
  },
  paginationControls: {
    flexDirection: 'row',
    gap: 8,
  },
  pageButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 54,
    alignItems: 'center',
  },
  pageButtonDisabled: {
    opacity: 0.45,
  },
  pageButtonText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
  },
  pageButtonTextDisabled: {
    color: '#4B5563',
  },
  departureList: {
    gap: 10,
  },
  departureCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 14,
    padding: 14,
  },
  departureCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  stopLabelWrap: {
    flex: 1,
    marginRight: 12,
  },
  departureLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.7,
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  departureTime: {
    fontSize: 18,
    fontWeight: '800',
    color: '#007AFF',
    letterSpacing: -0.4,
  },
  scheduleTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  routeSummary: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  timeChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    backgroundColor: '#E8F1FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    color: '#0057C9',
    fontSize: 12,
    fontWeight: '700',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    overflow: 'hidden',
  },
  emptyStateSmall: {
    color: '#6B7280',
    fontSize: 13,
    paddingVertical: 8,
  },
});
