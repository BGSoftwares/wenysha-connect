import { useState } from "react";
import { 
  Mail, 
  Lock, 
  Server, 
  Shield, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Save,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SettingsSectionProps {
  activeSubNav: string;
}

const SettingsSection = ({ activeSubNav }: SettingsSectionProps) => {
  // System Setup states
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [hostName, setHostName] = useState("");
  const [portNumber, setPortNumber] = useState("");
  const [sslEnabled, setSslEnabled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Cache Management states
  const [showCacheWarning, setShowCacheWarning] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleSaveSystemSettings = async () => {
    // Basic validation
    if (!emailAddress || !password || !hostName || !portNumber) {
      toast({ 
        title: "Validation Error", 
        description: "Please fill in all required fields", 
        variant: "destructive" 
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress)) {
      toast({ 
        title: "Invalid Email", 
        description: "Please enter a valid email address", 
        variant: "destructive" 
      });
      return;
    }

    // Port validation
    const port = parseInt(portNumber);
    if (isNaN(port) || port < 1 || port > 65535) {
      toast({ 
        title: "Invalid Port", 
        description: "Port number must be between 1 and 65535", 
        variant: "destructive" 
      });
      return;
    }

    setIsSaving(true);
    // Simulate saving
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSaving(false);
    
    toast({ 
      title: "Settings Saved", 
      description: "System configuration has been updated successfully" 
    });
  };

  const handleClearCache = async () => {
    setIsClearing(true);
    // Simulate cache clearing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsClearing(false);
    setShowConfirmDialog(false);
    
    toast({ 
      title: "Cache Cleared", 
      description: "System cache has been successfully refreshed. Please reload your browser." 
    });
  };

  if (activeSubNav === "cache") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">Cache Management</h2>
          <p className="text-sm text-muted-foreground">Manage system cache and improve performance</p>
        </div>

        {/* Cache Warning Banner */}
        {showCacheWarning && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="flex items-center justify-between">
              <div className="text-amber-800">
                <strong>Cache refresh recommended.</strong> After clearing cache, please refresh your browser to see the latest files.
              </div>
              <button 
                onClick={() => setShowCacheWarning(false)}
                className="text-amber-600 hover:text-amber-800 text-sm underline ml-4"
              >
                Dismiss
              </button>
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <RefreshCw className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-foreground">System Cache</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Clear the system cache to ensure all users see the latest updates. This is useful after 
                making significant changes to the system configuration or content.
              </p>
              
              <div className="mt-4 p-4 bg-secondary/30 rounded-lg">
                <h4 className="font-medium text-foreground mb-2">What gets cleared:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Cached user sessions</li>
                  <li>• Temporary file storage</li>
                  <li>• Compiled assets and resources</li>
                  <li>• Database query cache</li>
                </ul>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => setShowConfirmDialog(true)}
                  variant="gold"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reload Cache
                </Button>
                <p className="text-xs text-muted-foreground self-center">
                  Last cleared: Never
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Cache Options */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Server className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-foreground">Browser Cache</h4>
                <p className="text-xs text-muted-foreground">Local browser storage</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Users may need to manually clear their browser cache after system updates.
            </p>
            <Button variant="outline" size="sm" className="w-full">
              View Instructions
            </Button>
          </div>

          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-foreground">Cache Status</h4>
                <p className="text-xs text-muted-foreground">Current status</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">System Cache</span>
                <span className="text-green-600 font-medium">Healthy</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Database Cache</span>
                <span className="text-green-600 font-medium">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Confirm Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Confirm Cache Clear
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to clear the system cache? This action will:
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Clear all cached data and sessions</li>
                <li>• May temporarily slow down the system</li>
                <li>• Require users to refresh their browsers</li>
              </ul>
              <p className="mt-4 text-sm font-medium text-foreground">
                This action requires admin confirmation.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleClearCache} 
                disabled={isClearing}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                {isClearing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  "Confirm & Clear Cache"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // System Setup (default)
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold text-foreground">System Setup</h2>
        <p className="text-sm text-muted-foreground">Configure email and security settings</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Email Configuration */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Email Configuration</h3>
              <p className="text-xs text-muted-foreground">SMTP settings for system emails</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="emailAddress">Email Address</Label>
              <Input 
                id="emailAddress"
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="noreply@wenyasha.edu.zw"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input 
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter email password"
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hostName">Host Name</Label>
                <Input 
                  id="hostName"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div>
                <Label htmlFor="portNumber">Port Number</Label>
                <Input 
                  id="portNumber"
                  type="number"
                  value={portNumber}
                  onChange={(e) => setPortNumber(e.target.value)}
                  placeholder="587"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Security Settings</h3>
              <p className="text-xs text-muted-foreground">SSL and encryption options</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
              <div>
                <h4 className="font-medium text-foreground">Enable SSL/TLS</h4>
                <p className="text-sm text-muted-foreground">
                  Encrypt all email communications
                </p>
              </div>
              <Switch 
                checked={sslEnabled}
                onCheckedChange={setSslEnabled}
              />
            </div>

            {sslEnabled && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  SSL encryption is enabled. All email communications will be encrypted.
                </AlertDescription>
              </Alert>
            )}

            {!sslEnabled && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  SSL is disabled. Email communications may not be secure.
                </AlertDescription>
              </Alert>
            )}

            <div className="p-4 bg-secondary/30 rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Security Status</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Connection Type</span>
                  <span className={sslEnabled ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
                    {sslEnabled ? "Secure (TLS)" : "Unsecure"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Encryption</span>
                  <span className={sslEnabled ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
                    {sslEnabled ? "256-bit" : "None"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveSystemSettings}
          disabled={isSaving}
          variant="gold"
          className="px-8"
        >
          {isSaving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SettingsSection;
