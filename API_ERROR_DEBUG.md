# API Error Debugging Guide

This guide shows you different ways to check and debug API call errors in your React Native app.

---

## 1. Console Logging (Simplest Method)

### Quick Check: Open the Expo Console

When running your app, Expo shows a console with all logs. Here's how to access it:

**From Terminal:**
```
npm start
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator
- `w` for web

Once the app opens, press `j` in the terminal to open the debugger, or check the console output directly in the terminal.

---

## 2. Use the Error Handling Utility

The app now includes `src/services/errorHandling.ts` with better error logging.

### Example: Using it in API calls

**Before (minimal error info):**
```typescript
try {
  const data = await fetchRegions();
  setRegions(data);
} catch {
  setError('Error loading regions');  // vague error message
}
```

**After (detailed error info):**
```typescript
import { logError, getErrorMessage, safeFetch } from '../services/errorHandling';

try {
  const data = await fetchRegions();
  setRegions(data);
} catch (err) {
  logError(err, 'Loading regions');  // prints detailed error to console
  setError(getErrorMessage(err));    // user-friendly message for UI
}
```

### What `logError()` Prints

When an error happens, you'll see in the console:

```
Loading regions
──────────────────────────────────────────────────
Message: API call failed: Network error
Status: 0
Original Error: TypeError: Failed to fetch
──────────────────────────────────────────────────
```

This tells you:
- **Message**: What went wrong
- **Status**: HTTP status code (0 means network error)
- **Original Error**: The actual JavaScript error

---

## 3. Add Logging to API Calls

Edit `src/services/api.ts` to add more logging:

```typescript
export async function fetchRegions(): Promise<Region[]> {
  try {
    console.log('Fetching regions from:', API_BASE + '/regions');
    
    const response = await fetch(`${API_BASE}/regions`);
    
    console.log('Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      throw new Error(`Failed to fetch regions: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Regions loaded:', data);
    
    return data;
  } catch (error) {
    console.error('fetchRegions error:', error);
    throw error;
  }
}
```

---

## 4. Common API Errors & Solutions

### Error: "Network error" (Status: 0)

**Cause:** No internet connection or server unreachable

**Debug:**
```typescript
console.log('Checking API_BASE:', API_BASE);
// Make sure: https://athop-app-efevdvbgbnazdyeg.canadacentral-01.azurewebsites.net/api
```

**Solution:**
- Check internet connection
- Verify the API URL is correct
- Check if the backend server is running

---

### Error: "HTTP 404 Not Found"

**Cause:** Endpoint doesn't exist or URL is wrong

**Debug:**
```typescript
console.log('Full URL:', `${API_BASE}/regions`);
// Should be: https://athop-app-efevdvbgbnazdyeg.canadacentral-01.azurewebsites.net/api/regions
```

**Solution:**
- Check the endpoint name spelling
- Verify the backend has this endpoint
- Check request parameters

---

### Error: "HTTP 500 Internal Server Error"

**Cause:** Server crashed or bug in backend

**Debug:**
```typescript
// Log the request you're sending
console.log('Request URL:', url);
console.log('Request method:', method);
console.log('Request body:', JSON.stringify(body, null, 2));
console.log('Response body:', await response.text());
```

**Solution:**
- Check the backend logs
- Verify request payload is correct
- Contact backend developer

---

### Error: "Failed to fetch" or CORS error

**Cause:** Cross-origin request blocked or network issue

**Debug:**
```typescript
// In browser DevTools > Network tab
// Check if request is being blocked
console.log('Request headers:', response.headers);
```

**Solution:**
- Ensure backend allows CORS from Expo dev server
- Use proxy if needed
- Check firewall/VPN settings

---

## 5. React Native Debugger (Advanced)

### Install React Native Debugger

```bash
# Using Homebrew (Mac)
brew install react-native-debugger

# Or download from GitHub
# https://github.com/jhen0409/react-native-debugger/releases
```

### Enable Debugging in Expo

1. Run your app: `npm start`
2. Press `d` in the terminal for developer menu
3. Select "Open Debugger"
4. React Native Debugger should open automatically

### In the Debugger

- **Console tab**: See all logs and errors
- **Network tab**: See all API requests and responses
- **Redux DevTools**: If you add Redux later

---

## 6. Improved Error Handling in TimetableScreen

Here's a better pattern to use in your screens:

```typescript
import { logError, getErrorMessage } from '../../services/errorHandling';

export default function TimetableScreen({ navigation }: Props) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRegions = async () => {
      try {
        setError(null);  // Clear previous errors
        setLoadingRegions(true);
        
        console.log('Starting region fetch...');
        const data = await fetchRegions();
        
        if (!Array.isArray(data)) {
          throw new Error('Invalid regions format from API');
        }
        
        setRegions(data);
        console.log(`Loaded ${data.length} regions`);
        
      } catch (err) {
        // Log full error details to console
        logError(err, 'Loading regions');
        
        // Show user-friendly error
        const message = getErrorMessage(err);
        setError(message);
        
      } finally {
        setLoadingRegions(false);
      }
    };

    loadRegions();
  }, []);

  // ... rest of component
}
```

---

## 7. Testing an API Error

### Simulate Network Error

Add this to `src/services/api.ts` temporarily:

```typescript
export async function fetchRegions(): Promise<Region[]> {
  // TEMPORARILY: Simulate a network error
  throw new Error('Simulated network error for testing');
  
  // Normal code continues below...
  const response = await fetch(`${API_BASE}/regions`);
  // ...
}
```

Then run the app and watch the console. You should see:
- Your error message
- The error logged to console
- The error displayed in the app UI

After testing, remove the simulated error.

---

## 8. View Network Requests (Chrome DevTools)

If running on web or using a web debugger:

1. Open browser DevTools: `F12`
2. Go to **Network** tab
3. Perform an action that makes an API call
4. Click the request in the list
5. View **Request** and **Response** tabs

**Request tab shows:**
- URL
- Method (GET, POST, etc.)
- Headers
- Body (for POST requests)

**Response tab shows:**
- Status code
- Response body (JSON data or error)
- Headers returned by server

---

## 9. Common Console Logs to Add

Add these logging patterns to help debug:

```typescript
// Before API call
console.log('REQUEST:', { url, method, headers, body });

// Success
console.log('SUCCESS:', { status, data });

// Error
console.error('ERROR:', { status, message, errorData });

// Data validation
console.log('DATA VALIDATION:', { 
  expected: 'array', 
  received: typeof data,
  length: Array.isArray(data) ? data.length : 'N/A'
});
```

---

## 10. Checklist for Debugging API Errors

When you encounter an API error:

- [ ] Open the console (press `j` in Expo)
- [ ] Look for error logs with clear error text
- [ ] Check the **Status** code:
  - `0` = Network error
  - `4xx` = Client error (your request is wrong)
  - `5xx` = Server error (backend is broken)
- [ ] Check the **Message** to understand what failed
- [ ] Look at **Response body** to see server's error details
- [ ] Try the same endpoint in a tool like Postman or curl
- [ ] Check if the backend server is running
- [ ] Verify your internet connection
- [ ] Check if the API URL is correct

---

## 11. Using the Improved Error Utility

The `errorHandling.ts` file provides these functions:

### `logError(error, context)`
```typescript
try {
  await fetchRegions();
} catch (err) {
  logError(err, 'Fetching regions');
  // Prints formatted error to console
}
```

### `getErrorMessage(error)`
```typescript
try {
  await fetchRegions();
} catch (err) {
  const msg = getErrorMessage(err);
  setError(msg);  // Safe for any error type
}
```

### `safeFetch<T>(url, options, context)`
```typescript
// Wraps fetch() with automatic logging and error handling
const data = await safeFetch<Region[]>(
  `${API_BASE}/regions`,
  undefined,
  'Loading regions'
);
```

---

## Quick Reference

| Error | Likely Cause | Fix |
|-------|--------------|-----|
| `Network error` (Status 0) | No internet or server down | Check internet, verify API URL |
| `HTTP 404` | Wrong endpoint | Check endpoint spelling in API |
| `HTTP 500` | Backend crash | Check backend logs, contact dev |
| `CORS error` | Cross-origin blocked | Enable CORS on backend |
| `Invalid JSON` | Server returned bad data | Check backend response format |
| `Type mismatch` | Data shape wrong | Verify API response schema |

---

## Next Steps

1. Open your Expo console now and watch the logs
2. Try the improved error handling in one API call
3. Simulate an error and see the detailed output
4. Add the error context parameter to all API calls
5. Check the console every time an error occurs

The key is: **Always check the console first**. Most API errors are visible there!
