# User Story: Identity & Access Management (IAM)

As a system owner, I want a secure, invitation-only authentication system so that only authorized users can track their fitness data and system administration is restricted to verified administrators.

## Description
KraftKurve uses a closed-loop authentication system. To maintain a private, high-quality community, new users cannot simply sign up; they must be invited by an existing Administrator. The system distinguishes between **Administrators** (who manage the platform) and **Users** (who track training and nutrition).

## Authentication Flow

### 1. Initial System Setup (Bootstrap)
- **Actor**: System Owner / DevOps
- **Action**: Run the bootstrap process (`POST /api/auth/bootstrap`).
- **Result**: Creates the first Admin user. This is a one-time operation.

### 2. Inviting New Users
- **Actor**: Administrator
- **Tool**: **Web Admin Application**
- **Process**:
  1. Admin logs into the Web Admin UI.
  2. Admin generates a unique, one-time **Invite Code**.
  3. Admin shares this code with the prospective user.
- **Note**: This feature is strictly disabled in the Mobile App.

### 3. User Registration
- **Actor**: Prospective User
- **Tool**: **Mobile App** or **Web Shell**
- **Process**:
  1. User navigates to the `/auth/register` screen.
  2. User enters the **Invite Code**, their Display Name, Email, and Password.
  3. System validates the code, creates the user account, and voids the code.
- **Result**: User is now registered with the role `user`.

### 4. Daily Access (Login & Persistence)
- **Actor**: All Users
- **Tool**: Mobile App / Web Shell
- **Process**:
  1. User enters Email and Password at the `/auth/login` screen.
  2. System issues a JWT (JSON Web Token).
  3. **Persistence**: The token is stored in the browser's `localStorage`.
  4. **Auto-Login**: On page reload (F5) or re-opening the app, the system checks `localStorage` and automatically authenticates the user.
- **Result**: User enters the Dashboard directly.

### 5. Termination (Logout)
- **Actor**: All Users
- **Tool**: Mobile App (Settings) / Web Shell (Header)
- **Process**:
  1. User clicks **"Terminate Session"** or **"Logout"**.
  2. System clears the `localStorage` and redirects to the Login screen.

## Acceptance Criteria
- [x] **Secure Access**: All training/nutrition data is protected; 401/403 errors are returned if no valid JWT is provided.
- [x] **Invite-Only**: Registration is impossible without a valid, unused invite code.
- [x] **Persistent Session**: Users stay logged in across browser restarts/reloads.
- [x] **Role Enforcement**: Admins can access management tools; regular users are restricted to tracking features.
- [x] **Focus UI**: Headers and navigation are hidden during login/registration to ensure a focused user experience.
- [x] **Vertical Centering**: Login and Register screens are perfectly centered on the tactical grid for optimal visual balance.

## Non-Functional
- **Brutalist Aesthetic**: Auth screens follow the Tactical Logbook design (Centered widgets, tape headers).
- **Fast Boot**: Early theme/auth detection in `index.html` prevents layout shifts.
- **Zero Noise**: No administrative features are bundled in the mobile application.
