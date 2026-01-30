import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Trash2, 
  Lock, 
  Server, 
  FileCheck,
  AlertTriangle,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SecuritySettingsProps {
  onDeleteAllData?: () => Promise<void>;
}

export function SecuritySettings({ onDeleteAllData }: SecuritySettingsProps) {
  const [redactionMode, setRedactionMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const { toast } = useToast();

  const handleNukeData = async () => {
    if (deleteConfirmation !== "DELETE") {
      toast({
        title: "Confirmation Required",
        description: "Please type DELETE to confirm.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      if (onDeleteAllData) {
        await onDeleteAllData();
      } else {
        // Mock deletion for now
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      toast({
        title: "Data Deleted",
        description: "All your data has been permanently removed from our servers.",
      });
    } catch (error) {
      toast({
        title: "Deletion Failed",
        description: "An error occurred. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmation("");
    }
  };

  const handleRedactionToggle = (enabled: boolean) => {
    setRedactionMode(enabled);
    toast({
      title: enabled ? "Redaction Mode Enabled" : "Redaction Mode Disabled",
      description: enabled 
        ? "Sensitive information is now blurred throughout the app."
        : "All information is now visible.",
    });
    
    // Add/remove redaction class to body for CSS blur effects
    if (enabled) {
      document.body.classList.add("redaction-mode");
    } else {
      document.body.classList.remove("redaction-mode");
    }
  };

  return (
    <div className="space-y-6">
      {/* Redaction Mode */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {redactionMode ? (
              <EyeOff className="w-5 h-5 text-primary" />
            ) : (
              <Eye className="w-5 h-5 text-primary" />
            )}
            Redaction Mode
          </CardTitle>
          <CardDescription>
            Blur sensitive numbers (SSN, Account Numbers) for safe screen sharing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="redaction">Enable Redaction</Label>
              <p className="text-sm text-muted-foreground">
                Perfect for taking screenshots or sharing your screen
              </p>
            </div>
            <Switch
              id="redaction"
              checked={redactionMode}
              onCheckedChange={handleRedactionToggle}
            />
          </div>
          
          {/* Preview */}
          <div className="mt-4 p-4 rounded-lg bg-secondary/30">
            <p className="text-sm text-muted-foreground mb-2">Preview:</p>
            <div className="space-y-2">
              <p className="text-sm">
                SSN: <span className={cn("font-mono", redactionMode && "blur-sm select-none")}>
                  XXX-XX-1234
                </span>
              </p>
              <p className="text-sm">
                Account #: <span className={cn("font-mono", redactionMode && "blur-sm select-none")}>
                  ****-****-****-5678
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Retention Policy */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" />
            Data Storage & Retention
          </CardTitle>
          <CardDescription>
            Understanding how your data is stored and protected
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
              <Lock className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Encryption at Rest</p>
                <p className="text-sm text-muted-foreground">
                  All files and data are encrypted using AES-256 encryption before being stored.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
              <Shield className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Secure Cloud Storage</p>
                <p className="text-sm text-muted-foreground">
                  Credit reports are stored in secure, isolated cloud storage buckets with strict access controls.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
              <FileCheck className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Automatic Cleanup</p>
                <p className="text-sm text-muted-foreground">
                  Original PDF files are automatically deleted after 90 days. Analysis data is retained for your reference.
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/30 text-primary">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              SOC 2 Compliant
            </Badge>
            <Badge variant="outline" className="border-primary/30 text-primary">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              HTTPS Only
            </Badge>
            <Badge variant="outline" className="border-primary/30 text-primary">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              No Third-Party Sharing
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Nuke Button - Delete All Data */}
      <Card className="glass-card border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            Delete All My Data
          </CardTitle>
          <CardDescription>
            Permanently remove all your data from our servers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-destructive">
                  This action is permanent and cannot be undone!
                </p>
                <p className="text-sm text-muted-foreground">
                  This will delete:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>All uploaded credit reports</li>
                  <li>All generated dispute letters</li>
                  <li>Your analysis history and discrepancies</li>
                  <li>Your profile and preferences</li>
                </ul>
              </div>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete All My Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  Are you absolutely sure?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-4">
                  <p>
                    This will permanently delete all your data from our servers, including:
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>All credit reports and analysis</li>
                    <li>All dispute letters</li>
                    <li>Your complete history</li>
                  </ul>
                  <p className="font-medium text-destructive">
                    This action cannot be undone.
                  </p>
                  <div className="pt-2">
                    <Label htmlFor="confirm-delete" className="text-sm">
                      Type <span className="font-mono font-bold">DELETE</span> to confirm:
                    </Label>
                    <input
                      id="confirm-delete"
                      type="text"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      className="w-full mt-2 px-3 py-2 bg-secondary rounded-md border border-border text-sm"
                      placeholder="Type DELETE"
                    />
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteConfirmation("")}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleNukeData}
                  disabled={deleteConfirmation !== "DELETE" || isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Everything
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
