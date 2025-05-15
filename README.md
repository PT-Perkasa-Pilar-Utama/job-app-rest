# job-app-rest

Simple job application system REST API to be used for MCP demo.

- `job-app-mcp`: https://github.com/PT-Perkasa-Pilar-Utama/job-app-mcp
- `job-app-client`: https://github.com/PT-Perkasa-Pilar-Utama/job-app-client

## Pre-requisite

```bash
# Use ubuntu

# Nodejs
sudo apt install nodejs

node -v

# Bun
curl -fsSL https://bun.sh/install | bash -s "bun-v1.2.10"

bun -v
```

## Deployment

```bash
git clone git@github.com:PT-Perkasa-Pilar-Utama/job-app-rest.git

cd job-app-rest

bun install

bun migrate

bun install -g pm2

pm2 start ecosystem.config.json

pm2 logs job-app-rest
```

## Endpoint

### General

- [Public] `GET` `/` - Returns the index response of the API.
- [Public] `GET` `/health` - Checks the operational health status and availability of the API service.

### Users

- [Public] `POST` `/api/users/login` - Allows any public user to authenticate and obtain an access token for API usage.
- [Admin] `POST` `/api/users` - Allows an administrator to create a new user account within the system.
- [Admin] `GET` `/api/users` - Retrieves a comprehensive list of all registered user accounts in the system.
- [Admin] `GET` `/api/users/{userId}` - Retrieves detailed information about a specific user account for administrative purposes.
- [Admin] `PATCH` `/api/users/{userId}` - Enables an administrator to modify the profile details of a specific user account.
- [Admin] `DELETE` `/api/users/{userId}` - Allows an administrator to permanently remove a specific user account from the system.
- [User] `GET` `/api/users/{userId}` - Retrieves the profile information of the currently authenticated logged-in user.
- [User] `PATCH` `/api/users/{userId}` - Allows the currently authenticated user to update their own profile information.

### Jobs

- [Public] `GET` `/api/jobs` - Retrieves a public list of all currently available job postings on the platform.
- [Public] `GET` `/api/jobs/{jobId}` - Retrieves detailed public information about a specific job posting by its ID.
- [Admin] `POST` `/api/jobs` - Allows an administrator to create and publish a new job posting to the platform.
- [Admin] `PATCH` `/api/jobs/{jobId}` - Enables an administrator to modify the details of an existing job posting.
- [Admin] `DELETE` `/api/jobs/{jobId}` - Allows an administrator to remove a specific job posting from the platform.

### Applications

- [User] `POST` `/api/applications` - Allows an authenticated user to submit a new job application.
- [User] `GET` `/api/applications/{applicationId}` - Retrieves details of a specific application submitted by the authenticated user.
- [User] `PATCH` `/api/applications/{applicationId}` - Allows an authenticated user to update details of their submitted job application.
- [Admin] `GET` `/api/applications` - Retrieves a comprehensive list of all job applications submitted by all users.
- [Admin] `GET` `/api/applications/{applicationId}` - Retrieves detailed information for a specific job application using its unique ID.
- [Admin] `PATCH` `/api/applications/{applicationId}` - Allows an administrator to update the status of a specific job application.
- [Admin] `DELETE` `/api/applications/{applicationId}` - Enables an administrator to permanently delete a specific job application from the system.
