# API Integration Guide - BabyGrowth AI

This document provides step-by-step instructions for integrating the frontend with your Python FastAPI backend.

## Backend Endpoints Summary

### Base URL
```
http://localhost:8000 (development)
https://api.babygrowth.com (production)
```

## 1. User Authentication

### Register New User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "parent@example.com",
  "password": "secure_password",
  "name": "John Doe"
}

Response: {
  "id": "user123",
  "email": "parent@example.com",
  "name": "John Doe",
  "token": "jwt_token_here"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "parent@example.com",
  "password": "secure_password"
}

Response: {
  "token": "jwt_token_here",
  "user": {
    "id": "user123",
    "email": "parent@example.com",
    "name": "John Doe"
  }
}
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer jwt_token_here

Response: {
  "message": "Logged out successfully"
}
```

## 2. Child Profile Management

### Get Child Profile
```http
GET /api/child
Authorization: Bearer jwt_token_here

Response: {
  "id": "child1",
  "name": "Emma Johnson",
  "dateOfBirth": "2022-06-15",
  "sex": "female",
  "userId": "user123",
  "createdAt": "2023-01-01T00:00:00Z"
}
```

### Create/Update Child Profile
```http
POST /api/child
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "name": "Emma Johnson",
  "dateOfBirth": "2022-06-15",
  "sex": "female"
}

Response: {
  "id": "child1",
  "name": "Emma Johnson",
  "dateOfBirth": "2022-06-15",
  "sex": "female",
  "userId": "user123",
  "createdAt": "2023-01-01T00:00:00Z"
}
```

### Get Specific Child
```http
GET /api/child/{childId}
Authorization: Bearer jwt_token_here

Response: {
  "id": "child1",
  "name": "Emma Johnson",
  "dateOfBirth": "2022-06-15",
  "sex": "female",
  "userId": "user123",
  "createdAt": "2023-01-01T00:00:00Z"
}
```

## 3. Growth Records

### Get All Growth Records
```http
GET /api/growth?childId=child1
Authorization: Bearer jwt_token_here

Response: [
  {
    "id": "record1",
    "childId": "child1",
    "date": "2024-12-01",
    "weight": 14.5,
    "height": 75.5,
    "notes": "Regular checkup"
  },
  {
    "id": "record2",
    "childId": "child1",
    "date": "2024-09-15",
    "weight": 13.2,
    "height": 73.0,
    "notes": "Growth check"
  }
]
```

### Create Growth Record
```http
POST /api/growth
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "childId": "child1",
  "date": "2024-12-01",
  "weight": 14.5,
  "height": 75.5,
  "notes": "Regular checkup"
}

Response: {
  "id": "record1",
  "childId": "child1",
  "date": "2024-12-01",
  "weight": 14.5,
  "height": 75.5,
  "notes": "Regular checkup",
  "createdAt": "2024-12-01T10:00:00Z"
}
```

### Update Growth Record
```http
PUT /api/growth/{recordId}
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "date": "2024-12-01",
  "weight": 14.6,
  "height": 75.7,
  "notes": "Updated measurements"
}

Response: {
  "id": "record1",
  "childId": "child1",
  "date": "2024-12-01",
  "weight": 14.6,
  "height": 75.7,
  "notes": "Updated measurements",
  "updatedAt": "2024-12-01T10:30:00Z"
}
```

### Delete Growth Record
```http
DELETE /api/growth/{recordId}
Authorization: Bearer jwt_token_here

Response: {
  "message": "Record deleted successfully"
}
```

## 4. AI Chat Assistant

### Send Message
```http
POST /api/chat
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "childId": "child1",
  "message": "My baby eats very little, what should I do?"
}

Response: {
  "id": "message1",
  "childId": "child1",
  "userMessage": "My baby eats very little, what should I do?",
  "assistantMessage": "Based on your child's profile, here are some recommendations...",
  "createdAt": "2024-12-01T10:00:00Z"
}
```

### Get Chat History
```http
GET /api/chat/history?childId=child1
Authorization: Bearer jwt_token_here

Response: [
  {
    "id": "message1",
    "userMessage": "My baby eats very little, what should I do?",
    "assistantMessage": "Based on your child's profile, here are some recommendations...",
    "createdAt": "2024-12-01T10:00:00Z"
  }
]
```

## Frontend Implementation Examples

### 1. Setup API Client

Create `lib/api-client.ts`:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

interface FetchOptions extends RequestInit {
  token?: string
}

async function apiClient(endpoint: string, options: FetchOptions = {}) {
  const { token, ...fetchOptions } = options
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  })
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`)
  }
  
  return response.json()
}

export { apiClient }
```

### 2. Fetch Child Profile

Replace in `app/page.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'

interface ChildProfile {
  id: string
  name: string
  dateOfBirth: string
  sex: string
}

export default function Dashboard() {
  const [child, setChild] = useState<ChildProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChild = async () => {
      try {
        const token = localStorage.getItem('token')
        const data = await apiClient('/api/child', { token })
        setChild(data)
      } catch (error) {
        console.error('Failed to fetch child profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchChild()
  }, [])

  if (loading) return <div>Loading...</div>
  if (!child) return <div>No child profile found</div>

  return (
    // Use real data instead of mock data
    <div>{child.name}</div>
  )
}
```

### 3. Fetch Growth Records

Replace in `app/growth/page.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'

interface GrowthRecord {
  id: string
  date: string
  weight: number
  height: number
}

export default function GrowthPage() {
  const [records, setRecords] = useState<GrowthRecord[]>([])

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const token = localStorage.getItem('token')
        const childId = localStorage.getItem('childId')
        const data = await apiClient(`/api/growth?childId=${childId}`, { token })
        setRecords(data)
      } catch (error) {
        console.error('Failed to fetch growth records:', error)
      }
    }

    fetchRecords()
  }, [])

  return (
    // Use real data instead of mock data
    <GrowthTable data={records} />
  )
}
```

### 4. Chat with AI Assistant

Replace in `components/chat-interface.tsx`:

```typescript
import { apiClient } from '@/lib/api-client'

async function sendMessage(message: string, childId: string) {
  try {
    const token = localStorage.getItem('token')
    const response = await apiClient('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message, childId }),
      token,
    })

    return response.assistantMessage
  } catch (error) {
    console.error('Failed to send message:', error)
    return 'Sorry, I could not process your request.'
  }
}
```

## Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=BabyGrowth AI
```

## Error Handling

Implement proper error handling for all API calls:

```typescript
async function handleApiError(error: Error) {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    console.error('Network error - API server may be down')
  } else {
    console.error('API Error:', error.message)
  }
  
  // Show user-friendly error message
  // toast.error('Something went wrong. Please try again.')
}
```

## Security Considerations

1. **Token Storage**: Store JWT tokens in httpOnly cookies for better security
2. **Token Refresh**: Implement token refresh logic for expired tokens
3. **CSRF Protection**: Include CSRF tokens in requests if needed
4. **Input Validation**: Validate all user inputs before sending to API
5. **Rate Limiting**: Implement client-side rate limiting to prevent abuse
6. **HTTPS**: Always use HTTPS in production

## Testing APIs

### Using cURL

```bash
# Get child profile
curl -X GET http://localhost:8000/api/child \
  -H "Authorization: Bearer your_token_here"

# Create growth record
curl -X POST http://localhost:8000/api/growth \
  -H "Authorization: Bearer your_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "childId": "child1",
    "date": "2024-12-01",
    "weight": 14.5,
    "height": 75.5
  }'
```

### Using Postman

1. Import the API endpoints into Postman
2. Set up environment variables for `base_url` and `token`
3. Use pre-request scripts for dynamic headers
4. Create collections for organized testing

## Database Schema (Reference)

### users table
```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### children table
```sql
CREATE TABLE children (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  date_of_birth DATE NOT NULL,
  sex VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
)
```

### growth_records table
```sql
CREATE TABLE growth_records (
  id VARCHAR(255) PRIMARY KEY,
  child_id VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  weight DECIMAL(5, 2),
  height DECIMAL(5, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (child_id) REFERENCES children(id)
)
```

## Next Steps

1. Set up your Python FastAPI backend with the endpoints listed above
2. Configure environment variables
3. Update components to use `apiClient` instead of mock data
4. Implement authentication with token storage
5. Add error handling and loading states
6. Test all APIs thoroughly
7. Deploy to production

For more information about FastAPI integration, see the main README.md file.
