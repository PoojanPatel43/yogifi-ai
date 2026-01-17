# Yogifi API Backend

Spring Boot REST API for the Yogifi AI Yoga Pose Detection App.

## Features

- JWT-based authentication (register, login, refresh tokens)
- User profile management
- Yoga pose catalog with difficulty levels
- Session tracking with metrics and mistake logging
- PostgreSQL database (H2 for development)
- Docker support

## Tech Stack

- Java 17
- Spring Boot 3.2.5
- Spring Security with JWT
- Spring Data JPA
- PostgreSQL / H2 Database
- Maven
- Docker

## Quick Start

### Development Mode (H2 Database)

```bash
# Navigate to backend directory
cd yogifi-backend

# Run with Maven
./mvnw spring-boot:run

# Or on Windows
mvnw.cmd spring-boot:run
```

The API will be available at `http://localhost:8080`

### Production Mode (Docker + PostgreSQL)

```bash
# Create .env file from example
cp .env.example .env
# Edit .env with your secrets

# Build and run with Docker Compose
docker-compose up --build
```

## API Endpoints

### Health Check
```
GET /api/health
```

### Authentication
```
POST /api/auth/register    - Register new user
POST /api/auth/login       - Login with email/password
POST /api/auth/refresh     - Refresh access token
POST /api/auth/logout      - Logout (client-side)
```

### User Profile
```
GET  /api/user/profile     - Get current user profile
PUT  /api/user/profile     - Update profile
GET  /api/user/stats       - Get user statistics
```

### Poses
```
GET /api/poses/list                - Get all poses (public)
GET /api/poses/{id}                - Get pose by ID
GET /api/poses/difficulty/{level}  - Get poses by difficulty
```

### Sessions
```
POST /api/session/start            - Start yoga session
POST /api/session/end              - End session with results
GET  /api/session/history          - Get session history
GET  /api/session/{id}             - Get session details
POST /api/session/{id}/cancel      - Cancel session
```

## Testing with cURL

### Register a new user
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password1!",
    "name": "Test User"
  }'
```

### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password1!"
  }'
```

### Get poses (public endpoint)
```bash
curl http://localhost:8080/api/poses/list
```

### Get profile (authenticated)
```bash
curl http://localhost:8080/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Start a session
```bash
curl -X POST http://localhost:8080/api/session/start \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "poseId": "POSE_UUID_HERE"
  }'
```

### End a session
```bash
curl -X POST http://localhost:8080/api/session/end \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "SESSION_UUID_HERE",
    "durationSeconds": 45,
    "overallScore": 85.5,
    "stabilityScore": 90.0,
    "alignmentScore": 80.0,
    "metrics": [
      {
        "metricType": "knee_angle",
        "metricValue": 92.5,
        "expectedValue": 90.0,
        "timestampSeconds": 10.5,
        "jointName": "right_knee"
      }
    ],
    "mistakes": [
      {
        "joint": "left_knee",
        "mistakeType": "bent_too_much",
        "description": "Left knee bent beyond 90 degrees",
        "correction": "Straighten your left knee slightly",
        "severity": "MEDIUM",
        "occurrenceTimeSeconds": 15.0,
        "durationSeconds": 5.0
      }
    ]
  }'
```

## Development

### H2 Console
Access the H2 database console at: `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:mem:yogifi_dev`
- Username: `sa`
- Password: (empty)

### Initial Data
The application automatically loads 10 yoga poses on startup:
- Beginner: Mountain Pose, Warrior II, Downward Dog, Tree Pose
- Intermediate: Triangle Pose, Warrior III, Half Moon Pose
- Advanced: Crow Pose, Wheel Pose, Headstand

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| SPRING_PROFILES_ACTIVE | Active profile (dev/prod) | dev |
| DB_HOST | PostgreSQL host | localhost |
| DB_PORT | PostgreSQL port | 5432 |
| DB_NAME | Database name | yogifi_db |
| DB_USERNAME | Database username | postgres |
| DB_PASSWORD | Database password | - |
| JWT_SECRET | Base64 encoded JWT secret | (dev default) |
| JWT_EXPIRATION | Access token expiry (ms) | 86400000 |
| JWT_REFRESH_EXPIRATION | Refresh token expiry (ms) | 604800000 |

### Generate JWT Secret
```bash
openssl rand -base64 64
```

## Project Structure

```
yogifi-backend/
├── src/main/java/com/yogifi/
│   ├── YogifiApplication.java
│   ├── config/
│   │   ├── SecurityConfig.java
│   │   ├── CorsConfig.java
│   │   └── DataLoader.java
│   ├── controller/
│   │   ├── AuthController.java
│   │   ├── UserController.java
│   │   ├── PoseController.java
│   │   ├── SessionController.java
│   │   └── HealthController.java
│   ├── service/
│   │   ├── AuthService.java
│   │   ├── UserService.java
│   │   ├── SessionService.java
│   │   ├── JwtService.java
│   │   └── UserDetailsServiceImpl.java
│   ├── repository/
│   │   ├── UserRepository.java
│   │   ├── UserProfileRepository.java
│   │   ├── PoseRepository.java
│   │   ├── SessionRepository.java
│   │   ├── SessionMetricsRepository.java
│   │   └── PoseMistakeRepository.java
│   ├── model/
│   │   ├── User.java
│   │   ├── UserProfile.java
│   │   ├── Pose.java
│   │   ├── Session.java
│   │   ├── SessionMetrics.java
│   │   └── PoseMistake.java
│   ├── dto/
│   │   └── (request/response DTOs)
│   ├── exception/
│   │   └── (custom exceptions + handler)
│   └── security/
│       └── JwtAuthenticationFilter.java
└── src/main/resources/
    ├── application.properties
    └── application-prod.properties
```

## License

MIT License
