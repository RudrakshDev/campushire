/* eslint-disable react/prop-types */
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded, user } = useUser();
  const { pathname } = useLocation();

  if (isLoaded && !isSignedIn && isSignedIn !== undefined) {
    return <Navigate to="/?sign-in=true" />;
  }

  // If user is signed in but no role is set, redirect based on current path
  if (
    user !== undefined &&
    !user?.unsafeMetadata?.role &&
    pathname === "/"
  ) {
    // Default redirect for users without role - they can choose their path
    return <Navigate to="/jobs" />;
  }

  // If user is a recruiter and trying to access job listing, redirect to post-job
  if (
    user?.unsafeMetadata?.role === "recruiter" &&
    pathname === "/jobs"
  ) {
    return <Navigate to="/post-job" />;
  }

  // If user is a job seeker and trying to access post-job, redirect to job listing
  if (
    user?.unsafeMetadata?.role === "jobseeker" &&
    pathname === "/post-job"
  ) {
    return <Navigate to="/jobs" />;
  }

  // Safety: if recruiter intent persisted and user is new without role, set recruiter and allow
  if (
    isLoaded &&
    isSignedIn &&
    pathname === "/post-job" &&
    user &&
    !user?.unsafeMetadata?.role
  ) {
    try {
      const intent = typeof window !== "undefined" ? localStorage.getItem("roleIntent") : undefined;
      if (intent === "recruiter") {
        (async () => {
          try {
            await user.update({ unsafeMetadata: { role: "recruiter" } });
          } finally {
            try { localStorage.removeItem("roleIntent"); } catch (_) {}
          }
        })();
      }
    } catch (_) {}
  }

  return children;
};

export default ProtectedRoute;
