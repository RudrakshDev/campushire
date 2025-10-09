import { Navigate, useLocation } from "react-router-dom";

const AdminRoute = ({ children }) => {
  const location = useLocation();
  const isAdminAuthed = typeof window !== "undefined" && localStorage.getItem("adminAuth") === "1";
  if (!isAdminAuthed) {
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }
  return children;
};

export default AdminRoute;


