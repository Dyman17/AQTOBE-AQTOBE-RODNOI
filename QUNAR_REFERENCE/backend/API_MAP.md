# QUNAR API Map

Base URL: `/api/v1`

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | Public | Health check |
| GET | `/` | Public | Root info |
| POST | `/api/v1/auth/register` | Public | Register user |
| POST | `/api/v1/auth/login` | Public | Login and issue tokens |
| POST | `/api/v1/auth/refresh` | Public | Refresh access token |
| POST | `/api/v1/auth/logout` | User | Revoke refresh token |
| POST | `/api/v1/auth/forgot-password` | Public | Request password reset |
| POST | `/api/v1/auth/reset-password` | Public | Reset password with token |
| POST | `/api/v1/auth/test-token` | User | Validate access token |
| GET | `/api/v1/users/me` | User | Get current user profile |
| PATCH | `/api/v1/users/me` | User | Update current user profile |
| PATCH | `/api/v1/users/me/password` | User | Change password |
| POST | `/api/v1/users/me/avatar` | User | Upload avatar |
| GET | `/api/v1/users/me/stats` | User | Current user stats |
| GET | `/api/v1/users/stats/overview` | Admin | Users overview stats |
| GET | `/api/v1/users/{user_id}` | Admin | Get user by id |
| GET | `/api/v1/users` | Admin | List users |
| POST | `/api/v1/farms` | User | Create farm |
| GET | `/api/v1/farms` | User | List farms |
| GET | `/api/v1/farms/stats/overview` | User | Farms overview stats |
| GET | `/api/v1/farms/{farm_id}` | User | Get farm by id |
| PATCH | `/api/v1/farms/{farm_id}` | User | Update farm |
| DELETE | `/api/v1/farms/{farm_id}` | User | Delete farm |
| GET | `/api/v1/farms/{farm_id}/crops` | User | List crops in farm |
| GET | `/api/v1/farms/{farm_id}/stats` | User | Farm stats |
| POST | `/api/v1/plants` | User | Create plant |
| GET | `/api/v1/plants` | User | List plants |
| GET | `/api/v1/plants/stats` | User | Plants stats |
| GET | `/api/v1/plants/{plant_id}` | User | Get plant by id |
| PATCH | `/api/v1/plants/{plant_id}` | User | Update plant |
| DELETE | `/api/v1/plants/{plant_id}` | User | Delete plant |
| POST | `/api/v1/plants/{plant_id}/harvest` | User | Harvest plant |
| GET | `/api/v1/plants/{plant_id}/history` | User | Plant history |
| GET | `/api/v1/plants/types/list` | Public | Plant types list |
| POST | `/api/v1/sensors` | User | Create sensor |
| GET | `/api/v1/sensors` | User | List sensors |
| GET | `/api/v1/sensors/stats` | User | Sensors overview stats |
| GET | `/api/v1/sensors/{sensor_id}` | User | Get sensor by id |
| PATCH | `/api/v1/sensors/{sensor_id}` | User | Update sensor |
| DELETE | `/api/v1/sensors/{sensor_id}` | User | Delete sensor |
| POST | `/api/v1/sensors/{sensor_id}/data` | User | Send sensor data |
| GET | `/api/v1/sensors/{sensor_id}/data` | User | Sensor data history |
| GET | `/api/v1/sensors/{sensor_id}/stats` | User | Sensor stats |
| GET | `/api/v1/sensors/types/list` | Public | Sensor types list |
| GET | `/api/v1/logs` | Admin | List activity logs |
| GET | `/api/v1/logs/user/{user_id}` | Admin | Logs for user |
| GET | `/api/v1/logs/stats` | Admin | Logs statistics |
| POST | `/api/v1/logs/log` | User | Create activity log entry |

Admin DB Console (admin only): `/api/admin/dyman`

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| GET | `/api/admin/dyman/tables` | Admin | List public tables |
| GET | `/api/admin/dyman/table/{table_name}` | Admin | Fetch table rows + schema |
| POST | `/api/admin/dyman/table/{table_name}` | Admin | Create row |
| PATCH | `/api/admin/dyman/table/{table_name}/{row_id}` | Admin | Update row |
| DELETE | `/api/admin/dyman/table/{table_name}/{row_id}` | Admin | Delete row |
