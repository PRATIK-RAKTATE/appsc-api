# Specification 01: Authentication, RBAC & Security Governance

This document contains the exact implementation specifications for all authentication, authorization, session eviction, and content DRM safeguards.

---

## 📌 Issue References
- **Issue #9 [TASK-01.1.4]**: Responsive Web Login & OTP verification screen in React.js + Tailwind CSS v4
- **Issue #13 [TASK-01.2.2]**: React.js route guards and role protection (RBAC)
- **Issue #16 [TASK-01.3.3]**: Single active session termination listener and dialog modal
- **Issue #19 [TASK-01.4.2]**: Web anti-copy protection layer (DRM safeguards)
- **Issue #20 [TASK-01.4.3]**: Floating student watermark overlay component

---

## 1. Web Login & OTP Verification Screen (`LoginPage`)

### 📍 Route: `/login` | Layout: `AuthLayout`

### Component Architecture
```text
<LoginPage>
  ├── <AuthHeader /> (Logo, Platform title, Telugu tagline)
  ├── <EmailStep /> (Shown when step === 'EMAIL')
  │     ├── <EmailInput />
  │     └── <SubmitButton />
  └── <OtpStep /> (Shown when step === 'OTP')
        ├── <OtpInputBoxes /> (6 individual inputs with auto-advance)
        ├── <CountdownTimer /> (10:00 countdown)
        ├── <ResendOtpButton /> (Disabled during cooldown)
        └── <VerifyButton />
```

### State & Interaction Flow
1. **Email Dispatch**:
   - User inputs email (e.g. `student@appsc.gov.in`).
   - Clicking *"Send Login Code"* triggers `POST /api/auth/send-otp`.
   - On success (200), switch view to OTP entry, start a 600-second (10-minute) countdown timer, and set resend cooldown to 60 seconds.
   - If rate limited (429), render warning: *"Maximum 3 OTP requests permitted per 15 minutes. Please try again later."*
2. **6-Digit OTP Entry**:
   - 6 individual `<input type="text" maxLength={1} />` fields.
   - Auto-advance focus to next field on digit keystroke; backspace moves to previous field.
   - Pasting a 6-digit code automatically distributes across all boxes and triggers verification.
3. **Verification**:
   - Calling `POST /api/auth/verify-otp` with `{ email, otp }`.
   - On success (200), receive `{ accessToken, refreshToken, user }`.
   - Save tokens in `useAuthStore` and initialize Socket.IO with the token.
   - Redirect to designated home:
     - `STUDENT` -> `/student/dashboard`
     - `MENTOR` -> `/mentor/dashboard`
     - `ADMIN` -> `/admin/dashboard`

---

## 2. Role-Based Access Control (RBAC) & Navigation Route Guards

### Components: `ProtectedRoute.jsx` and `RoleGuard.jsx`

```jsx
// src/components/auth/RoleGuard.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

export const RoleGuard = ({ allowedRoles = [] }) => {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }
  return <Outlet />;
};
```

---

## 3. Single Active Session Eviction Listener (`SessionTerminationModal`)

### Component: `src/components/auth/SessionTerminationModal.jsx`

### Socket.IO Event Listener
The backend emits `session_revoked` to sockets belonging to a revoked session when the same account signs in from another device.

```jsx
// src/components/auth/SessionTerminationModal.jsx
import { useEffect, useState } from "react";
import { socket } from "@/services/socket";
import { useAuthStore } from "@/stores/authStore";
import { Modal, Button } from "@/components/ui";

export const SessionTerminationModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    const handleRevoked = (data) => {
      // Disconnect socket immediately
      socket.disconnect();
      // Show eviction modal
      setIsOpen(true);
    };

    socket.on("session_revoked", handleRevoked);
    return () => socket.off("session_revoked", handleRevoked);
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    clearAuth();
    window.location.href = "/login?reason=session_terminated";
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title="Session Terminated"
      isDismissible={false}
    >
      <div className="p-4 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertTriangleIcon className="h-6 w-6" />
        </div>
        <p className="text-gray-700 font-medium">
          Your session has been terminated due to login from another device.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Only one active session is allowed per student account.
        </p>
        <div className="mt-6">
          <Button variant="danger" className="w-full" onClick={handleConfirm}>
            Return to Login
          </Button>
        </div>
      </div>
    </Modal>
  );
};
```

---

## 4. Web Anti-Copy Protection Layer (`ContentProtectionWrapper`)

### Component: `src/components/security/ContentProtectionWrapper.jsx`

This component wraps proprietary content views (E-Book Reader, Exam Player, Course Videos) to restrict unauthorized duplication:

```jsx
// src/components/security/ContentProtectionWrapper.jsx
import { useEffect } from "react";

export const ContentProtectionWrapper = ({ children, enabled = true }) => {
  useEffect(() => {
    if (!enabled) return;

    // 1. Disable Right Click Context Menu
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // 2. Intercept Print and Copy Key Combinations
    const handleKeyDown = (e) => {
      // Ctrl+P or Cmd+P
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        alert("Printing proprietary study material is disabled.");
        return false;
      }
      // Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        return false;
      }
      // PrintScreen Key
      if (e.key === "PrintScreen") {
        navigator.clipboard.writeText(""); // Clear clipboard buffer
      }
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled]);

  return (
    <div className={enabled ? "select-none no-print" : ""}>
      {children}
    </div>
  );
};
```

---

## 5. Dynamic Student Watermark Overlay (`WatermarkOverlay`)

### Component: `src/components/security/WatermarkOverlay.jsx`

Renders an unselectable, pointer-events-none SVG canvas repeating the student's email, user ID, and current timestamp diagonally across the viewport:

```jsx
// src/components/security/WatermarkOverlay.jsx
import { useAuthStore } from "@/stores/authStore";

export const WatermarkOverlay = ({ enabled = true }) => {
  const user = useAuthStore((s) => s.user);

  if (!enabled || !user) return null;

  const watermarkText = `${user.email || user._id} • ${new Date().toLocaleDateString()}`;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden select-none"
      aria-hidden="true"
    >
      <svg className="h-full w-full opacity-[0.06]">
        <defs>
          <pattern
            id="watermark-pattern"
            width="320"
            height="180"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-25)"
          >
            <text
              x="20"
              y="90"
              fill="currentColor"
              fontSize="13"
              fontWeight="600"
              className="text-gray-900"
            >
              {watermarkText}
            </text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#watermark-pattern)" />
      </svg>
    </div>
  );
};
```
