import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { BarLoader } from "react-spinners";
import { useTheme } from "../components/theme-provider";

const Onboarding = () => {

  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  const { theme } = useTheme();

  const [actualTheme, setActualTheme] = useState(theme);

  useEffect(() => {
    if (theme === "system") {
      const match = window.matchMedia("(prefers-color-scheme: dark)");
      const updateTheme = () => {
        setActualTheme(match.matches ? "dark" : "light");
      };
      updateTheme();
      match.addEventListener("change", updateTheme);
      return () => match.removeEventListener("change", updateTheme);
    } else {
      setActualTheme(theme);
    }
  }, [theme]);

  const navigateUser = (currRole) => {
    if (currRole === "recruiter") {
      navigate("/post-job");
    } else {
      navigate("/invalid");
    }
  };

  const handleRoleSelection = async (role) => {
    if (role === "candidate") {
      navigate("/invalid");
      return;
    }
    await user
      .update({ unsafeMetadata: { role } })
      .then(() => {
        console.log(Role updated to: ${role});
        navigateUser(role);
      })
      .catch((err) => {
        console.error("Error updating role:", err);
      });
  };

  useEffect(() => {
    if (user?.unsafeMetadata?.role) {
      navigateUser(user.unsafeMetadata.role);
    }
  }, [user]);

  if (!isLoaded) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  return (
    <div className="flex flex-col items-center justify-center mt-40">
      <h2
        className={`text-5xl sm:text-7xl font-extrabold text-center pb-8 bg-clip-text text-transparent 
          ${actualTheme === "dark"
            ? "bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500"
            : "bg-gradient-to-r from-blue-700 via-purple-500 to-pink-500"
          }
        `}
      >
        Post a Job
      </h2>
      <div className="mt-16 grid grid-cols-2 gap-4 w-full md:px-40">
        <Button
          variant="blue"
          className="h-36 text-2xl opacity-50 cursor-not-allowed"
          onClick={() => navigate("/invalid")}
        >
          Candidate
        </Button>
        <Button
          variant="destructive"
          className="h-36 text-2xl"
          onClick={() => handleRoleSelection("recruiter")}
        >
          Recruiter
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;