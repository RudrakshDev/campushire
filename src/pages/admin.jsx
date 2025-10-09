import { useEffect, useState } from "react";
import { BarLoader } from "react-spinners";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase";

const AdminPage = () => {
  const [view, setView] = useState("candidates");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [hrs, setHrs] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [{ data: usersData, error: usersErr }, { data: hrsData, error: hrsErr }] = await Promise.all([
          supabase.from("user_details").select("*").order("created_at", { ascending: false }),
          supabase.from("hr_profiles").select("*").order("created_at", { ascending: false }),
        ]);
        if (usersErr) throw usersErr;
        if (hrsErr) throw hrsErr;
        setUsers(usersData || []);
        setHrs(hrsData || []);
      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const list = (view === "candidates" ? users : hrs);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Admin</h1>
      <div className="flex gap-3">
        <Button variant={view === "candidates" ? "blue" : "outline"} onClick={() => setView("candidates")}>Candidates</Button>
        <Button variant={view === "hrs" ? "blue" : "outline"} onClick={() => setView("hrs")}>HR</Button>
      </div>

      {loading && <BarLoader width={"100%"} color="#36d7b7" />}
      {error && <div className="text-red-600">{String(error.message || error)}</div>}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((item) => (
            <div key={item.id} className="border rounded-lg p-4">
              {view === "candidates" ? (
                <>
                  <div className="font-semibold text-lg">{item.first_name} {item.last_name}</div>
                  <div className="text-sm text-gray-600">{item.college_email || item.personal_email}</div>
                  <div className="mt-2 text-sm">College ID: {item.college_id || "-"}</div>
                  <div className="mt-2 text-sm">Phone: {item.phone_number || "-"}</div>
                  <div className="mt-2 text-sm">City: {item.city || "-"}</div>
                </>
              ) : (
                <>
                  <div className="font-semibold text-lg">{item.full_name || "-"}</div>
                  <div className="text-sm text-gray-600">{item.email || "-"}</div>
                  <div className="mt-2 text-sm">Designation: {item.designation || "-"}</div>
                  <div className="mt-2 text-sm">Company ID: {item.company_id || "-"}</div>
                  <div className="mt-2 text-sm">Phone: {item.phone || "-"}</div>
                </>
              )}
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline">Request Details</Button>
                <Button size="sm" variant="ghost">View</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPage;


