# Learning Activity Reports API Documentation

The Learning Activity Reports API provides detailed insights into student learning activities, achievements, and mentor sessions. This API is designed for parents, schools, and administrators to track student progress and engagement.

## Authentication

All endpoints require JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Student Reports

### Get Student Activities Report

Retrieve a list of student activities with details and progress.

**Request:**

```http
GET /reports/students/:studentId/activities?activityType=challenge&status=completed&startDate=2025-08-01T00:00:00.000Z&endDate=2025-09-11T23:59:59.999Z&sortOrder=desc
```

**Parameters:**

- `studentId` (path) - The ID of the student
- `activityType` (query, optional) - Type of activity to filter by: 'challenge', 'quiz', 'lesson', 'mentor_session', or 'all'
- `status` (query, optional) - Status of activities: 'completed', 'in_progress', 'not_started', or 'all'
- `startDate` (query, optional) - Start date for filtering (ISO format)
- `endDate` (query, optional) - End date for filtering (ISO format)
- `sortOrder` (query, optional) - Sort order: 'asc' or 'desc' (default: 'desc')

### Get Student Mentor Ratings Report

Retrieve a list of student mentor ratings with details.

**Request:**

```http
GET /reports/students/:studentId/ratings?startDate=2025-08-01T00:00:00.000Z&endDate=2025-09-11T23:59:59.999Z&sortOrder=desc
```

### Get Student Session Logs Report

Retrieve a list of student mentor session logs with details.

**Request:**

```http
GET /reports/students/:studentId/sessions?startDate=2025-08-01T00:00:00.000Z&endDate=2025-09-11T23:59:59.999Z&sortOrder=desc
```

### Get Student Achievements Report

Retrieve a list of student achievements with details.

**Request:**

```http
GET /reports/students/:studentId/achievements?startDate=2025-08-01T00:00:00.000Z&endDate=2025-09-11T23:59:59.999Z&sortOrder=desc
```

## Admin Reports

These endpoints are only accessible by Super Admins.

### Get Admin Learning Hours Report

Retrieve learning hours statistics across all students.

**Request:**

```http
GET /reports/admin/learning-hours?timeframe=monthly&startDate=2025-01-01T00:00:00.000Z&endDate=2025-09-11T23:59:59.999Z&schoolId=507f1f77bcf86cd799439011
```

**Parameters:**

- `timeframe` (query, optional) - Timeframe to group results by: 'daily', 'weekly', 'monthly', 'quarterly', 'yearly' (default: 'monthly')
- `startDate` (query, optional) - Start date for filtering (ISO format)
- `endDate` (query, optional) - End date for filtering (ISO format)
- `schoolId` (query, optional) - School ID to filter results by

### Get Admin Skills Mastery Report

Retrieve skills mastery statistics across all students.

**Request:**

```http
GET /reports/admin/skills-mastery?timeframe=monthly&startDate=2025-01-01T00:00:00.000Z&endDate=2025-09-11T23:59:59.999Z&schoolId=507f1f77bcf86cd799439011
```

### Get Admin Schools Report

Retrieve school statistics.

**Request:**

```http
GET /reports/admin/schools?limit=10
```

**Parameters:**

- `limit` (query, optional) - Number of top schools to return (default: 10)

### Get Admin Students Report

Retrieve student statistics.

**Request:**

```http
GET /reports/admin/students?timeframe=monthly&startDate=2025-01-01T00:00:00.000Z&endDate=2025-09-11T23:59:59.999Z&schoolId=507f1f77bcf86cd799439011
```

### Get Admin Engagement Report

Retrieve student engagement statistics.

**Request:**

```http
GET /reports/admin/engagement?timeframe=monthly&startDate=2025-01-01T00:00:00.000Z&endDate=2025-09-11T23:59:59.999Z&schoolId=507f1f77bcf86cd799439011
```

## Response Format

All endpoints return data in a consistent format:

```json
{
  "success": true,
  "data": {
    // Report specific data structure
  },
  "message": "Report retrieved successfully"
}
```

## Example Usage

Here's an example of how to use the API to get a student's activities report:

```javascript
// Using fetch API
const token = 'your-jwt-token';
const studentId = '507f1f77bcf86cd799439011';

fetch(
  `https://api.example.com/reports/students/${studentId}/activities?activityType=challenge&status=completed`,
  {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  },
)
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error('Error:', error));
```

## Error Handling

The API returns appropriate HTTP status codes:

- 200: Success
- 400: Bad Request (invalid parameters)
- 401: Unauthorized (invalid or missing token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found (resource not found)
- 500: Internal Server Error

Error responses follow this format:

```json
{
  "success": false,
  "message": "Error message describing the issue",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional error details"
  }
}
```
