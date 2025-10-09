import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/admin";

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    // Simple hardcoded check. Replace with env vars if desired.
    const expectedUser = import.meta.env.VITE_ADMIN_USER || "admin";
    const expectedPass = import.meta.env.VITE_ADMIN_PASS || "admin";
    if (username === expectedUser && password === expectedPass) {
      try { localStorage.setItem("adminAuth", "1"); } catch (_) {}
      navigate(from, { replace: true });
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-md border rounded-xl p-6 flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-center">Admin Login</h1>
        {error && <div className="text-red-600 text-sm text-center">{error}</div>}
        <input
          type="text"
          className="border rounded px-3 py-2 bg-white text-black placeholder-gray-500 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-700"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          className="border rounded px-3 py-2 bg-white text-black placeholder-gray-500 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-400 dark:border-gray-700"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" variant="blue">Login</Button>
      </form>
    </div>
  );
};

export default AdminLogin;


