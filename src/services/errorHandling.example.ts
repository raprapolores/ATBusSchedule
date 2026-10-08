/**
 * Example: Improved API error handling
 * 
 * This file shows how to integrate better error logging and handling
 * into your API calls and screen components.
 * 
 * Copy these patterns into your actual code!
 */

// ============================================
// EXAMPLE 1: Improved API Call with Logging
// ============================================

import { logError, getErrorMessage, APIError } from './errorHandling';

export const API_BASE = 'https://athop-app-efevdvbgbnazdyeg.canadacentral-01.azurewebsites.net/api';

export type Region = { RegionId: string; Name: string };

/**
 * Before: Minimal error info
 */
export async function fetchRegions_OLD(): Promise<Region[]> {
  const response = await fetch(`${API_BASE}/regions`);
  if (!response.ok) throw new Error('Failed to fetch regions');
  return response.json();
}

/**
 * After: Detailed logging and error context
 */
export async function fetchRegions_IMPROVED(): Promise<Region[]> {
  try {
    // Log the request being made
    console.log('API: GET /regions');
    console.log('URL:', `${API_BASE}/regions`);
    
    const response = await fetch(`${API_BASE}/regions`);
    
    // Log the response status
    console.log('Response Status:', response.status, response.statusText);
    
    if (!response.ok) {
      // Try to get error details from response body
      let errorBody = 'No error details';
      try {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          errorBody = JSON.stringify(errorData, null, 2);
        } else {
          errorBody = await response.text();
        }
      } catch (parseErr) {
        console.log('Could not parse error response body');
      }
      
      console.error('API Error Response:', errorBody);
      
      throw new APIError(
        `Failed to fetch regions: ${response.status} ${response.statusText}`,
        response.status,
        errorBody,
      );
    }
    
    const data = await response.json();
    
    // Validate response format
    if (!Array.isArray(data)) {
      throw new Error(`Expected array, got ${typeof data}`);
    }
    
    console.log(`Loaded ${data.length} regions:`, data);
    return data;
    
  } catch (error) {
    // Log the full error with context
    logError(error, 'fetchRegions');
    throw error;
  }
}

// ============================================
// EXAMPLE 2: Error Handling in React Component
// ============================================

/*
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { logError, getErrorMessage } from './services/errorHandling';

export function MyComponent() {
  const [data, setData] = useState<Region[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Clear previous state
      setError(null);
      setLoading(true);
      
      console.log('Component: Starting data load');
      
      // Call API
      const result = await fetchRegions_IMPROVED();
      setData(result);
      
      console.log('Component: Data loaded successfully');
      
    } catch (err) {
      // Log detailed error to console for debugging
      logError(err, 'MyComponent.loadData');
      
      // Get user-friendly message for display
      const message = getErrorMessage(err);
      setError(message);
      
      console.error('User will see:', message);
      
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text style={{ color: 'red' }}>Error: {error}</Text>;
  
  return (
    <View>
      {data.map((region) => (
        <Text key={region.RegionId}>{region.Name}</Text>
      ))}
    </View>
  );
}
*/

// ============================================
// EXAMPLE 3: Testing Error Handling
// ============================================

/**
 * To test error handling locally:
 * 
 * 1. Temporarily break the API in your code:
 */
export async function fetchRegions_TEST_ERROR(): Promise<Region[]> {
  // Uncomment to test error handling:
  throw new Error('Simulated error for testing');

  // Real code continues...
  const response = await fetch(`${API_BASE}/regions`);
  if (!response.ok) throw new Error('Failed to fetch regions');
  return response.json();
}

/**
 * 2. Run the app: npm start
 * 3. Watch the console - you should see:
 *    fetchRegions
 *    Message: Simulated error for testing
 *    ...
 * 4. The app UI should show the error message
 * 5. Remove the simulated error when done testing
 */

// ============================================
// EXAMPLE 4: Different Error Types
// ============================================

/**
 * Here are common errors you might see:
 */

// Network error (can't reach server)
const EXAMPLE_1 = `
fetchRegions
──────────────────────────────────────────────────
Message: API call failed: Failed to fetch
Status: 0
Original Error: TypeError: Failed to fetch
──────────────────────────────────────────────────
Cause: No internet, server down, or CORS blocked
Solution: Check internet connection, verify API URL
`;

// 404 Not Found (wrong endpoint)
const EXAMPLE_2 = `
fetchRegions
──────────────────────────────────────────────────
Message: Failed to fetch regions: 404 Not Found
Status: 404
Original Error: {"error":"Not found"}
──────────────────────────────────────────────────
Cause: Endpoint doesn't exist
Solution: Check endpoint spelling in API_BASE + path
`;

// 500 Server Error (backend crashed)
const EXAMPLE_3 = `
fetchRegions
──────────────────────────────────────────────────
Message: Failed to fetch regions: 500 Internal Server Error
Status: 500
Original Error: {"error":"Database connection failed"}
──────────────────────────────────────────────────
Cause: Backend error
Solution: Check backend logs, contact backend developer
`;

// Invalid JSON (server returned bad data)
const EXAMPLE_4 = `
fetchRegions
──────────────────────────────────────────────────
Message: Unexpected token < in JSON at position 0
Status: undefined
Original Error: SyntaxError: Unexpected token...
──────────────────────────────────────────────────
Cause: Server returned HTML instead of JSON
Solution: Check server configuration, check endpoint
`;

// ============================================
// EXAMPLE 5: Debugging Checklist
// ============================================

/**
 * When you get an API error:
 * 
 * 1. READ THE CONSOLE OUTPUT
 *    - Copy the exact error message
 *    - Note the Status code
 * 
 * 2. CHECK THE STATUS CODE
 *    0   = Network/connection problem
 *    4xx = Your request is wrong
 *    5xx = Server is broken
 * 
 * 3. TEST THE API MANUALLY
 *    - Open Postman or curl
 *    - Try: curl https://athop-app.../api/regions
 *    - See if you get data
 * 
 * 4. CHECK COMMON ISSUES
 *    - Is the API URL correct?
 *    - Is the backend running?
 *    - Do you have internet?
 *    - Is the endpoint spelled right?
 * 
 * 5. CHECK THE RESPONSE FORMAT
 *    - Does the API return what you expect?
 *    - Does the response match your type?
 */

// ============================================
// Summary: How to Use This
// ============================================

/**
 * In your actual code:
 * 
 * 1. Import the error utilities:
 *    import { logError, getErrorMessage } from './services/errorHandling';
 * 
 * 2. Add logging to API calls:
 *    console.log('API: GET /regions');
 *    
 * 3. Wrap in try/catch:
 *    try {
 *      const data = await fetchRegions();
 *    } catch (err) {
 *      logError(err, 'Loading regions');
 *      setError(getErrorMessage(err));
 *    }
 * 
 * 4. Watch the console while testing
 * 
 * 5. Use the error messages to debug
 */

export default {};
