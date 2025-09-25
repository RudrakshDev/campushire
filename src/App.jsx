import { RouterProvider, createBrowserRouter } from "react-router-dom";

import AppLayout from "./layouts/app-layout";
import ProtectedRoute from "./components/protected-route";
import { ThemeProvider } from "./components/theme-provider";

import LandingPage from "./pages/landing";
import PostJob from "./pages/post-job";
import JobListing from "./pages/jobListing";
import MyJobs from "./pages/my-jobs";
import SavedJobs from "./pages/saved-jobs";
import JobPage from "./pages/job";
import UserDetails from "./pages/user-details";
import HrDetail from "./pages/hr-detail";
import UserApplyList from "./pages/user-apply-list";
import HrLandingPage from "./pages/hr-landing-page";

import { Analytics } from "@vercel/analytics/react"

import "./App.css";

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: "/",
        element: <LandingPage />,
      },
      {
        path: "/hr-landing",
        element: <HrLandingPage />,
      },
      {
        path: "/user-applies",
        element: (
          <ProtectedRoute>
            <UserApplyList />
          </ProtectedRoute>
        ),
      },
      {
        path: "/user-details",
        element: (
          <ProtectedRoute>
            <UserDetails />
          </ProtectedRoute>
        ),
      },
      {
        path: "/hr-details",
        element: (
          <ProtectedRoute>
            <HrDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: "/jobs",
        element: (
          <ProtectedRoute>
            <JobListing />
          </ProtectedRoute>
        ),
      },
      {
        path: "/post-job",
        element: (
          <ProtectedRoute>
            <PostJob />
          </ProtectedRoute>
        ),
      },
      {
        path: "/my-jobs",
        element: (
          <ProtectedRoute>
            <MyJobs />
          </ProtectedRoute>
        ),
      },
      {
        path: "/saved-jobs",
        element: (
          <ProtectedRoute>
            <SavedJobs />
          </ProtectedRoute>
        ),
      },
      {
        path: "/job/:id",
        element: (
          <ProtectedRoute>
            <JobPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <RouterProvider router={router} />
      <Analytics />
    </ThemeProvider>
  );
}

export default App;
