import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpdateProfile } from "@/hooks/useDatabase";
import { User, Bell, Shield, Trash2, Loader2, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SecuritySettings } from "@/components/settings/SecuritySettings";

export default function SettingsPage() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();

  // Profile form state
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [ssnLastFour, setSsnLastFour] = useState("");

  // Notification preferences
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [analysisComplete, setAnalysisComplete] = useState(true);
  const [responseReceived, setResponseReceived] = useState(true);

  // Sync form state with profile data
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setAddress(profile.address || "");
      setPhone(profile.phone || "");
      setSsnLastFour(profile.ssn_last_four || "");
      setEmailEnabled(profile.notification_email_enabled ?? true);
      setAnalysisComplete(profile.notification_analysis_complete ?? true);
      setResponseReceived(profile.notification_response_received ?? true);
    }
  }, [profile]);

  const handleSaveProfile = () => {
    updateProfile.mutate({
      full_name: fullName || null,
      address: address || null,
      phone: phone || null,
      ssn_last_four: ssnLastFour || null,
    });
  };

  const handleNotificationChange = (
    setter: (value: boolean) => void,
    field: string,
    value: boolean
  ) => {
    setter(value);
    // Auto-save notification preferences
    updateProfile.mutate({
      [field]: value,
    });
  };

  return (
    <MainLayout>
      <div className="p-6 md:p-8 lg:p-12 space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and preferences
          </p>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Data & Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6 mt-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Profile
                </CardTitle>
                <CardDescription>
                  Your personal information for dispute letters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={user?.email || ""}
                        disabled
                        className="bg-secondary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="bg-secondary/50"
                      />
                      <p className="text-xs text-muted-foreground">
                        Used in your dispute letters
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Mailing Address</Label>
                      <Input
                        id="address"
                        placeholder="123 Main St, City, State ZIP"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="bg-secondary/50"
                      />
                      <p className="text-xs text-muted-foreground">
                        Required for official dispute correspondence
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          placeholder="(555) 123-4567"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="bg-secondary/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ssn">Last 4 of SSN</Label>
                        <Input
                          id="ssn"
                          placeholder="XXXX"
                          maxLength={4}
                          value={ssnLastFour}
                          onChange={(e) => setSsnLastFour(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          className="bg-secondary/50"
                        />
                        <p className="text-xs text-muted-foreground">
                          For identity verification only
                        </p>
                      </div>
                    </div>
                    <Button 
                      className="glow-sm" 
                      onClick={handleSaveProfile}
                      disabled={updateProfile.isPending}
                    >
                      {updateProfile.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6 mt-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  Notifications
                </CardTitle>
                <CardDescription>Configure how you receive updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive updates about your disputes</p>
                  </div>
                  <Switch 
                    checked={emailEnabled}
                    onCheckedChange={(checked) => 
                      handleNotificationChange(setEmailEnabled, "notification_email_enabled", checked)
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Analysis Complete</p>
                    <p className="text-sm text-muted-foreground">Get notified when analysis is done</p>
                  </div>
                  <Switch 
                    checked={analysisComplete}
                    onCheckedChange={(checked) => 
                      handleNotificationChange(setAnalysisComplete, "notification_analysis_complete", checked)
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Response Received</p>
                    <p className="text-sm text-muted-foreground">Alert when bureaus respond</p>
                  </div>
                  <Switch 
                    checked={responseReceived}
                    onCheckedChange={(checked) => 
                      handleNotificationChange(setResponseReceived, "notification_response_received", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab (NEW) */}
          <TabsContent value="security" className="space-y-6 mt-6">
            <SecuritySettings />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}