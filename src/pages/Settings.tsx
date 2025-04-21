import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBranding } from "@/contexts/BrandingContext";
import { useThemeMode } from "@/contexts/ThemeContext";
import MainLayout from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Settings as SettingsIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Settings = () => {
  const { user } = useAuth();
  const { projectName, setProjectName } = useBranding();
  const { theme, toggleTheme } = useThemeMode();

  const [name, setName] = useState(projectName);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    setName(projectName);
  }, [projectName]);

  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="max-w-lg mx-auto mt-12 bg-white dark:bg-[#222] p-8 rounded-lg border shadow">
          <h1 className="text-xl font-bold flex items-center gap-2"><SettingsIcon className="w-5 h-5" /> Settings</h1>
          <p className="mt-3 text-muted-foreground">You do not have permission to access this page.</p>
        </div>
      </MainLayout>
    );
  }

  const handleNameChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setProjectName(name.trim());
      toast({
        title: "Project name updated",
        description: "The new name will be displayed across all dashboards.",
      });
    } else {
      setName("Indian Kitchen");
    }
  };

  return (
    <MainLayout>
      <div className="max-w-lg mx-auto mt-12 bg-white dark:bg-[#222] p-8 rounded-lg border shadow">
        <h1 className="text-xl font-bold flex items-center gap-2"><SettingsIcon className="w-5 h-5" /> Settings</h1>
        <form onSubmit={handleNameChange} className="mt-6 flex flex-col gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200 block mb-2">
              Project Name
            </label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full"
              maxLength={40}
              required
            />
          </div>
          <Button type="submit" variant="default">Update Name</Button>
        </form>

        <div className="mt-8 flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Theme
            </span>
          </div>
          <Button type="button" onClick={toggleTheme} variant="outline" className="flex items-center gap-2">
            {theme === "light" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme.charAt(0).toUpperCase() + theme.slice(1)} Mode
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
