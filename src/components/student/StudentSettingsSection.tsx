import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Bell, 
  Lock, 
  Smartphone, 
  Mail, 
  Eye, 
  EyeOff,
  Save,
  Shield,
  Palette
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api, getErrorMessage, getStoredUser } from "@/lib/api";
import { fetchAllPages, type Student } from "@/lib/hooks";

type CurrentUserProfile = {
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  preferences: Record<string, unknown>;
};

type NotificationPreferences = {
  email: boolean;
  sms: boolean;
  results: boolean;
  announcements: boolean;
  fees: boolean;
  assignments: boolean;
};

type AppearancePreferences = {
  dark_mode: boolean;
  compact_view: boolean;
  animations: boolean;
};

const defaultNotifications: NotificationPreferences = {
  email: true,
  sms: false,
  results: true,
  announcements: true,
  fees: true,
  assignments: true,
};

const defaultAppearance: AppearancePreferences = {
  dark_mode: false,
  compact_view: false,
  animations: true,
};

const StudentSettingsSection = ({ studentContext = true }: { studentContext?: boolean }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = getStoredUser()?.id;
  const profileQueryKey = ["portal-settings-profile", userId] as const;
  const studentQueryKey = ["portal-settings-student", userId] as const;
  const [showPassword, setShowPassword] = useState(false);
  const [notifications, setNotifications] = useState<NotificationPreferences>(defaultNotifications);
  const [appearance, setAppearance] = useState<AppearancePreferences>(defaultAppearance);
  const [profileDraft, setProfileDraft] = useState({ full_name: "", email: "", address: "", phone: "" });
  const [passwordDraft, setPasswordDraft] = useState({ current: "", next: "", confirm: "" });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const profileQuery = useQuery({
    queryKey: profileQueryKey,
    queryFn: () => api.get<CurrentUserProfile>("/auth/me/"),
    enabled: Boolean(userId),
  });
  const studentQuery = useQuery({
    queryKey: studentQueryKey,
    queryFn: async () => (await fetchAllPages<Student>("/school/students/"))[0] ?? null,
    enabled: studentContext && Boolean(userId),
  });
  const profile = profileQuery.data;
  const student = studentQuery.data;

  useEffect(() => {
    if (profile) {
      setProfileDraft({
        full_name: profile.full_name || "",
        email: profile.email || "",
        address: studentContext ? student?.address || "" : "",
        phone: studentContext ? "" : profile.phone || "",
      });
      const saved = profile.preferences?.notifications;
      if (saved && typeof saved === "object") {
        setNotifications({ ...defaultNotifications, ...saved } as NotificationPreferences);
      }
      const savedAppearance = profile.preferences?.appearance;
      const nextAppearance = savedAppearance && typeof savedAppearance === "object"
        ? { ...defaultAppearance, ...savedAppearance } as AppearancePreferences
        : defaultAppearance;
      setAppearance(nextAppearance);
      document.documentElement.classList.toggle("dark", nextAppearance.dark_mode);
      document.documentElement.classList.toggle("compact-view", nextAppearance.compact_view);
      document.documentElement.classList.toggle("reduce-motion", !nextAppearance.animations);
    }
  }, [profile, student, studentContext]);

  const handleSaveProfile = async () => {
    if (!profileDraft.full_name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    setIsSavingProfile(true);
    try {
      const payload: Record<string, string> = {
        username: profile?.username || getStoredUser()?.username || "",
        full_name: profileDraft.full_name.trim(),
        email: profileDraft.email.trim(),
      };
      if (studentContext) payload.address = profileDraft.address.trim();
      else payload.phone = profileDraft.phone.trim();
      await api.patch("/auth/me/", payload);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: profileQueryKey }),
        queryClient.invalidateQueries({ queryKey: studentQueryKey }),
        queryClient.invalidateQueries({ queryKey: ["student-profile"] }),
        queryClient.invalidateQueries({ queryKey: ["teacher-profile"] }),
        queryClient.invalidateQueries({ queryKey: ["current-user"] }),
        queryClient.invalidateQueries({ queryKey: ["students"] }),
      ]);
      toast({ title: "Profile updated", description: studentContext ? "Your name, email, and address were saved." : "Your name, email, and phone number were saved." });
    } catch (error) {
      toast({ title: "Could not update profile", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePassword = async () => {
    if (!passwordDraft.current || !passwordDraft.next) {
      toast({ title: "Enter your current and new passwords", variant: "destructive" });
      return;
    }
    if (passwordDraft.next.length < 8) {
      toast({ title: "New password is too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    if (passwordDraft.next !== passwordDraft.confirm) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setIsSavingPassword(true);
    try {
      await api.post("/auth/change-password/", {
        current_password: passwordDraft.current,
        new_password: passwordDraft.next,
      });
      setPasswordDraft({ current: "", next: "", confirm: "" });
      toast({ title: "Password changed", description: "Your new password is ready to use." });
    } catch (error) {
      toast({ title: "Could not change password", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!profile) {
      toast({ title: "Could not load your account", description: "Refresh the page and try again.", variant: "destructive" });
      return;
    }
    setIsSavingNotifications(true);
    try {
      await api.patch("/auth/me/", {
        username: profile.username,
        full_name: profile.full_name,
        email: profile.email || "",
        preferences: { ...profile.preferences, notifications },
      });
      await queryClient.invalidateQueries({ queryKey: profileQueryKey });
      toast({ title: "Preferences saved", description: "Your notification preferences are stored with your account." });
    } catch (error) {
      toast({ title: "Could not save preferences", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const updateAppearance = async (key: keyof AppearancePreferences, value: boolean) => {
    if (!profile) {
      toast({ title: "Could not load your account", description: "Refresh the page and try again.", variant: "destructive" });
      return;
    }
    const previous = appearance;
    const next = { ...appearance, [key]: value };
    setAppearance(next);
    document.documentElement.classList.toggle("dark", next.dark_mode);
    document.documentElement.classList.toggle("compact-view", next.compact_view);
    document.documentElement.classList.toggle("reduce-motion", !next.animations);
    try {
      const result = await api.patch<{ preferences: Record<string, unknown> }>("/auth/me/", {
        username: profile.username,
        full_name: profile.full_name,
        email: profile.email || "",
        preferences: { ...profile.preferences, appearance: next },
      });
      queryClient.setQueryData<CurrentUserProfile>(profileQueryKey, current => current
        ? { ...current, preferences: result.preferences }
        : current);
    } catch (error) {
      setAppearance(previous);
      document.documentElement.classList.toggle("dark", previous.dark_mode);
      document.documentElement.classList.toggle("compact-view", previous.compact_view);
      document.documentElement.classList.toggle("reduce-motion", !previous.animations);
      toast({ title: "Could not save appearance", description: getErrorMessage(error), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-foreground">Account Settings</h2>
        <p className="text-muted-foreground">Manage your account preferences and security</p>
      </div>

      {profileQuery.error && <p role="alert" className="rounded-xl border border-destructive/30 p-4 text-sm text-destructive">Could not load your account: {getErrorMessage(profileQuery.error)}</p>}

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>Update your personal details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={profileDraft.full_name} onChange={event => setProfileDraft({ ...profileDraft, full_name: event.target.value })} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" value={profileDraft.email} onChange={event => setProfileDraft({ ...profileDraft, email: event.target.value })} className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{studentContext ? "Guardian phone number" : "Phone Number"}</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="phone" type="tel" value={studentContext ? student?.next_of_kin?.[0]?.phone || "" : profileDraft.phone} disabled={studentContext} onChange={event => setProfileDraft({ ...profileDraft, phone: event.target.value })} className="pl-10" />
                  </div>
                </div>
              </div>

              {studentContext && <div className="space-y-2">
                <Label htmlFor="address">Home Address</Label>
                <Input id="address" value={profileDraft.address} onChange={event => setProfileDraft({ ...profileDraft, address: event.target.value })} />
              </div>}

              {studentContext && <div className="space-y-2">
                <Label htmlFor="emergency">Emergency Contact</Label>
                <Input id="emergency" value={student?.next_of_kin?.[0] ? `${student.next_of_kin[0].name}${student.next_of_kin[0].relationship ? ` · ${student.next_of_kin[0].relationship}` : ""}` : "No next of kin recorded"} disabled className="bg-secondary/50" />
              </div>}

              <Button onClick={() => void handleSaveProfile()} variant="gold" disabled={isSavingProfile || profileQuery.isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isSavingProfile ? "Saving…" : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Choose how you want to receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Delivery Methods</h4>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive updates via email</p>
                    </div>
                  </div>
                  <Switch 
                    checked={notifications.email} 
                    onCheckedChange={(checked) => setNotifications({...notifications, email: checked})}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">SMS Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive updates via text message</p>
                    </div>
                  </div>
                  <Switch 
                    checked={notifications.sms} 
                    onCheckedChange={(checked) => setNotifications({...notifications, sms: checked})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Notification Types</h4>
                {[
                  { key: "results", label: "Exam Results", desc: "When new results are published" },
                  { key: "announcements", label: "Announcements", desc: "School announcements and news" },
                  { key: "fees", label: "Fee Reminders", desc: "Payment due dates and receipts" },
                  { key: "assignments", label: "Assignments", desc: "New assignments and deadlines" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch 
                      checked={notifications[item.key as keyof typeof notifications] as boolean} 
                      onCheckedChange={(checked) => setNotifications({...notifications, [item.key]: checked})}
                    />
                  </div>
                ))}
              </div>

              <Button onClick={() => void handleSaveNotifications()} variant="gold" disabled={isSavingNotifications || profileQuery.isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isSavingNotifications ? "Saving…" : "Save Preferences"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Manage your password and account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input 
                      id="currentPassword" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Enter current password"
                      autoComplete="current-password"
                      value={passwordDraft.current}
                      onChange={event => setPasswordDraft({ ...passwordDraft, current: event.target.value })}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" autoComplete="new-password" placeholder="Enter new password" value={passwordDraft.next} onChange={event => setPasswordDraft({ ...passwordDraft, next: event.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" autoComplete="new-password" placeholder="Confirm new password" value={passwordDraft.confirm} onChange={event => setPasswordDraft({ ...passwordDraft, confirm: event.target.value })} />
                </div>
              </div>

              <Button onClick={() => void handleSavePassword()} variant="gold" disabled={isSavingPassword}>
                <Shield className="h-4 w-4 mr-2" />
                {isSavingPassword ? "Updating…" : "Update Password"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>Customize how the portal looks for you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <p className="font-medium">Dark Mode</p>
                    <p className="text-sm text-muted-foreground">Use dark theme for the interface</p>
                  </div>
                  <Switch checked={appearance.dark_mode} onCheckedChange={checked => void updateAppearance("dark_mode", checked)} />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <p className="font-medium">Compact View</p>
                    <p className="text-sm text-muted-foreground">Show more content with less spacing</p>
                  </div>
                  <Switch checked={appearance.compact_view} onCheckedChange={checked => void updateAppearance("compact_view", checked)} />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <p className="font-medium">Animations</p>
                    <p className="text-sm text-muted-foreground">Enable smooth transitions and effects</p>
                  </div>
                  <Switch checked={appearance.animations} onCheckedChange={checked => void updateAppearance("animations", checked)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentSettingsSection;
