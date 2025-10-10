import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  UserButton,
  SignIn,
  useUser,
} from "@clerk/clerk-react";
import { Button } from "./ui/button";
import { BriefcaseBusiness, Heart, PenBox, Search, ScanText } from "lucide-react";
import { ModeToggle } from "./mode-toggle";


const Header = () => {
  const [showSignIn, setShowSignIn] = useState(false);
  const [roleIntent, setRoleIntent] = useState(undefined);
  const { user, isSignedIn, isLoaded } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("sign-in")) {
      setShowSignIn(true);
    }
    const intent = params.get("role-intent");
    if (intent) {
      setRoleIntent(intent);
    }
    // Also read from localStorage as a fallback
    try {
      const lsIntent = localStorage.getItem("roleIntent");
      if (lsIntent && !intent) {
        setRoleIntent(lsIntent);
      }
    } catch (_) {}
  }, []);

  // After sign-in, if user has no role and intent is recruiter, set it once
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const intent = params.get("role-intent");
    if (!isLoaded || !isSignedIn) return;
    const effectiveIntent = intent || (typeof window !== "undefined" ? localStorage.getItem("roleIntent") : undefined);
    if (effectiveIntent === "recruiter" && !user?.unsafeMetadata?.role) {
      (async () => {
        try {
          await user.update({
            unsafeMetadata: { ...(user?.unsafeMetadata || {}), role: "recruiter" },
          });
        } catch (e) {
          // no-op; best effort
        } finally {
          // Clean URL and go to post-job
          const url = new URL(window.location);
          url.searchParams.delete("sign-in");
          url.searchParams.delete("role-intent");
          window.history.replaceState({}, "", url);
          try { localStorage.removeItem("roleIntent"); } catch (_) {}
          navigate("/post-job", { replace: true });
        }
      })();
    } else if (!user?.unsafeMetadata?.role) {
      (async () => {
        try {
          await user.update({
            unsafeMetadata: { ...(user?.unsafeMetadata || {}), role: "jobseeker" },
          });
        } catch (_) {
        } finally {
          const url = new URL(window.location);
          url.searchParams.delete("sign-in");
          url.searchParams.delete("role-intent");
          window.history.replaceState({}, "", url);
          try { localStorage.removeItem("roleIntent"); } catch (_) {}
          navigate("/jobs", { replace: true });
        }
      })();
    }
  }, [isLoaded, isSignedIn, user, navigate]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowSignIn(false);
      // Remove the sign-in query parameter from URL
      const url = new URL(window.location);
      url.searchParams.delete("sign-in");
      url.searchParams.delete("role-intent");
      window.history.replaceState({}, "", url);
    }
  };

  return (
    <>
      <nav className="py-4 flex justify-between items-center">
        <Link to="/">
          <img
            // src="/logo-dark.png"
            src="/light.png"
            // src="/dark.png"
            className="h-14 sm:h-24 lg:h-32 block dark:hidden transition-opacity duration-300"
            alt="Hirrd Logo (Light)"
            />
          {/* Dark Mode Logo */}
          <img
            // src="/logo.png"
            src="/dark.png"
            // src="/light.png"
            className="h-14 sm:h-24 lg:h-32 hidden dark:block transition-opacity duration-300"
            alt="Hirrd Logo (Dark)"
          />
        </Link>

        <div className="flex gap-8">
          <SignedOut>
            <Button variant="outline" onClick={() => setShowSignIn(true)}>
              Login
            </Button>
          </SignedOut>
          <SignedIn>
            {/* Show different navigation based on user role */}
            {user?.unsafeMetadata?.role === "recruiter" ? (
              // Recruiter navigation
              <>
                <Link to="/post-job">
                  <Button variant="destructive" className="rounded-full">
                    <PenBox size={20} className="mr-2" />
                    Post a Job
                  </Button>
                </Link>
                <Link to="/user-applies">
                  <Button variant="outline">
                    <BriefcaseBusiness size={20} className="mr-2" />
                    My Jobs
                  </Button>
                </Link>
                <Link to="/my-jobs">
                  <Button variant="outline">
                    <BriefcaseBusiness size={20} className="mr-2" />
                    Post Job List
                  </Button>
                </Link>
                <Link to="/hr-details">
                  <Button variant="outline">
                    Edit Profile
                  </Button>
                </Link>
              </>
            ) : (
              // Job seeker navigation
              <>
                <Link to="/jobs">
                  <Button variant="blue" className="rounded-full">
                      <Search size={20} className="mr-2" />
                    Find Jobs
                  </Button>
                </Link>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/jobs?recommended=1")}
                  >
                    <ScanText size={20} className="mr-2" />
                    Recommend
                  </Button>
                </div>
                <Link to="/my-jobs">
                  <Button variant="outline">
                    <BriefcaseBusiness size={20} className="mr-2" />
                    My Applications
                  </Button>
                </Link>
                <Link to="/saved-jobs">
                  <Button variant="outline">
                    <Heart size={20} className="mr-2" />
                    Saved Jobs
                  </Button>
                </Link>
              </>
            )}
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                },
              }}
            >
              <UserButton.MenuItems>
                {user?.unsafeMetadata?.role === "recruiter" && (
                  <UserButton.Link
                    label="My Jobs"
                    labelIcon={<BriefcaseBusiness size={15} />}
                    href="/my-jobs"
                  />
                )}
                {user?.unsafeMetadata?.role === "recruiter" && (
                  <UserButton.Link
                    label="Post a Job"
                    labelIcon={<PenBox size={15} />}
                    href="/post-job"
                  />
                )}
                {user?.unsafeMetadata?.role === "recruiter" && (
                  <UserButton.Link
                    label="Edit Profile"
                    href="/hr-details"
                  />
                )}
                {user?.unsafeMetadata?.role !== "recruiter" && (
                  <UserButton.Link
                    label="Find Jobs"
                    labelIcon={<Search size={15} />}
                    href="/jobs"
                  />
                )}
                {user?.unsafeMetadata?.role !== "recruiter" && (
                  <UserButton.Link
                    label="My Applications"
                    labelIcon={<BriefcaseBusiness size={15} />}
                    href="/user-applies"
                  />
                )}
                {user?.unsafeMetadata?.role !== "recruiter" && (
                  <UserButton.Link
                    label="Saved Jobs"
                    labelIcon={<Heart size={15} />}
                    href="/saved-jobs"
                  />
                )}
                <UserButton.Action label="manageAccount" />
              </UserButton.MenuItems>
            </UserButton>
          </SignedIn>
          <ModeToggle />
        </div>
      </nav>

      {showSignIn && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          onClick={handleOverlayClick}
        >
          <SignIn
            afterSignInUrl={roleIntent === "recruiter" ? "/post-job" : "/jobs"}
            afterSignUpUrl={roleIntent === "recruiter" ? "/post-job" : "/jobs"}
          />
        </div>
      )}
    </>
  );
};

export default Header;
