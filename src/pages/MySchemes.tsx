import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Bell,
  Trash2,
  ExternalLink,
  FileText,
  Filter,
  Loader2
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { getSavedSchemes, updateSavedSchemeStatus, removeSavedScheme, type Scheme } from "@/lib/api";
import { toast } from "sonner";

type ApplicationStatus = "saved" | "applied" | "completed" | "rejected";

interface SavedScheme {
  schemeId: number;
  savedAt: string;
  status: ApplicationStatus;
  notes: string | null;
  scheme: Scheme;
  reminderEnabled?: boolean;
}

const statusConfig: Record<ApplicationStatus, { label: string; icon: React.ElementType; color: string }> = {
  "saved": { label: "Saved", icon: Clock, color: "text-muted-foreground bg-muted" },
  "applied": { label: "Applied", icon: AlertCircle, color: "text-info bg-info/10" },
  "completed": { label: "Approved", icon: CheckCircle2, color: "text-success bg-success/10" },
  "rejected": { label: "Rejected", icon: XCircle, color: "text-destructive bg-destructive/10" }
};

export default function MySchemes() {
  const { user } = useAuth();
  const [savedSchemes, setSavedSchemes] = useState<SavedScheme[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingSchemeId, setUpdatingSchemeId] = useState<number | null>(null);

  // Load saved schemes from database
  useEffect(() => {
    async function loadSavedSchemes() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await getSavedSchemes(user.id);
        if (response.success && response.data) {
          setSavedSchemes(response.data.map(item => ({
            schemeId: item.schemeId,
            savedAt: item.savedAt,
            status: item.status as ApplicationStatus,
            notes: item.notes,
            scheme: item.scheme,
            reminderEnabled: false
          })));
        }
      } catch (error) {
        console.error("Failed to load saved schemes:", error);
        toast.error("Failed to load saved schemes");
      } finally {
        setIsLoading(false);
      }
    }

    loadSavedSchemes();
  }, [user?.id]);

  const filteredSchemes = filterStatus === "all"
    ? savedSchemes
    : savedSchemes.filter(s => s.status === filterStatus);

  const updateStatus = async (schemeId: number, status: ApplicationStatus) => {
    if (!user?.id) return;

    setUpdatingSchemeId(schemeId);
    try {
      const response = await updateSavedSchemeStatus(user.id, schemeId, status);
      if (response.success) {
        setSavedSchemes(prev =>
          prev.map(s => s.schemeId === schemeId ? { ...s, status } : s)
        );
        toast.success(`Status updated to ${statusConfig[status].label}`);
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    } finally {
      setUpdatingSchemeId(null);
    }
  };

  const updateNotes = async (schemeId: number, notes: string) => {
    if (!user?.id) return;

    // Optimistic update
    setSavedSchemes(prev =>
      prev.map(s => s.schemeId === schemeId ? { ...s, notes } : s)
    );

    try {
      const scheme = savedSchemes.find(s => s.schemeId === schemeId);
      if (scheme) {
        await updateSavedSchemeStatus(user.id, schemeId, scheme.status, notes);
      }
    } catch (error) {
      console.error("Error updating notes:", error);
    }
  };

  const toggleReminder = (schemeId: number) => {
    setSavedSchemes(prev =>
      prev.map(s => s.schemeId === schemeId ? { ...s, reminderEnabled: !s.reminderEnabled } : s)
    );
    toast.success("Reminder setting updated");
  };

  const removeScheme = async (schemeId: number) => {
    if (!user?.id) return;

    try {
      const response = await removeSavedScheme(user.id, schemeId);
      if (response.success) {
        setSavedSchemes(prev => prev.filter(s => s.schemeId !== schemeId));
        toast.success("Scheme removed from saved list");
      } else {
        toast.error("Failed to remove scheme");
      }
    } catch (error) {
      console.error("Error removing scheme:", error);
      toast.error("Failed to remove scheme");
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="container-gov section-padding text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Bookmark className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Please login to view saved schemes</h3>
          <p className="text-muted-foreground mb-6">You need to be logged in to save and track schemes.</p>
          <Button asChild>
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-gov section-padding">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              My Saved Schemes
            </h1>
            <p className="text-muted-foreground">
              Track your saved schemes and application status
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="saved">Saved</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="completed">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{savedSchemes.length}</p>
              <p className="text-xs text-muted-foreground">Total Saved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-info">{savedSchemes.filter(s => s.status === "applied").length}</p>
              <p className="text-xs text-muted-foreground">Applied</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-success">{savedSchemes.filter(s => s.status === "completed").length}</p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-muted-foreground">{savedSchemes.filter(s => s.status === "saved").length}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-16">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading saved schemes...</p>
          </div>
        ) : filteredSchemes.length > 0 ? (
          <div className="space-y-6">
            {filteredSchemes.map((saved) => {
              const scheme = saved.scheme;
              if (!scheme) return null;

              const status = statusConfig[saved.status];
              const StatusIcon = status.icon;

              return (
                <Card key={saved.schemeId} className="overflow-hidden">
                  <div className="flex flex-col lg:flex-row">
                    {/* Main Content */}
                    <div className="flex-1 p-6">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge variant="outline">{scheme.level}</Badge>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </div>

                      <Link
                        to={`/scheme/${scheme.slug || scheme.id}`}
                        className="text-lg font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        {scheme.name}
                      </Link>

                      <p className="text-sm text-muted-foreground mt-1 mb-4">
                        {scheme.details?.substring(0, 150) + "..."}
                      </p>

                      {/* Notes */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Notes</label>
                        <Textarea
                          placeholder="Add notes about your application..."
                          className="resize-none"
                          rows={2}
                          value={saved.notes || ""}
                          onChange={(e) => updateNotes(saved.schemeId, e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Sidebar Actions */}
                    <div className="lg:w-64 p-6 bg-muted/30 border-t lg:border-t-0 lg:border-l border-border space-y-4">
                      {/* Status Update */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Update Status</label>
                        <Select
                          value={saved.status}
                          onValueChange={(v) => updateStatus(saved.schemeId, v as ApplicationStatus)}
                          disabled={updatingSchemeId === saved.schemeId}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="saved">Saved</SelectItem>
                            <SelectItem value="applied">Applied</SelectItem>
                            <SelectItem value="completed">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Reminder Toggle */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Reminders</span>
                        </div>
                        <Switch
                          checked={saved.reminderEnabled || false}
                          onCheckedChange={() => toggleReminder(saved.schemeId)}
                        />
                      </div>

                      {/* Actions */}
                      <div className="pt-4 space-y-2">
                        {scheme.application && (
                          <Button asChild size="sm" className="w-full bg-accent hover:bg-accent/90">
                            <a href={`/scheme/${scheme.slug || scheme.id}`}>
                              Apply Now
                              <ExternalLink className="h-4 w-4 ml-2" />
                            </a>
                          </Button>
                        )}
                        <Button asChild variant="outline" size="sm" className="w-full">
                          <Link to={`/scheme/${scheme.slug || scheme.id}`}>
                            <FileText className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-destructive hover:text-destructive"
                          onClick={() => removeScheme(saved.schemeId)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Bookmark className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">
              {filterStatus === "all" ? "No saved schemes yet" : "No schemes with this status"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {filterStatus === "all"
                ? "Browse schemes and save the ones you're interested in to track them here."
                : "Try changing the filter or save more schemes."
              }
            </p>
            <Button asChild>
              <Link to="/search">Browse Schemes</Link>
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
