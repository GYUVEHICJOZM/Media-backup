import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Download, Play, CheckCircle, AlertCircle } from "lucide-react";
import { format, addDays, differenceInDays, differenceInHours } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Backup } from "@shared/schema";

function BackupCard({ backup }: { backup: Backup }) {
  const statusColor = backup.status === 'completed' 
    ? 'bg-status-online/10 text-status-online border-status-online/20'
    : backup.status === 'failed'
    ? 'bg-status-busy/10 text-status-busy border-status-busy/20'
    : 'bg-status-away/10 text-status-away border-status-away/20';

  const StatusIcon = backup.status === 'completed' ? CheckCircle : AlertCircle;

  return (
    <Card className="hover-elevate">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">
                {format(new Date(backup.backupDate), "EEEE, MMMM d, yyyy")}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-muted-foreground font-mono">
                  {format(new Date(backup.backupDate), "h:mm a")}
                </span>
                <span className="text-sm text-muted-foreground">
                  {backup.messageCount} messages
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={statusColor}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {backup.status}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BackupSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-6 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Backups() {
  const { toast } = useToast();

  const { data: backups, isLoading } = useQuery<Backup[]>({
    queryKey: ["/api/backups"],
  });

  const triggerBackup = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/backups/trigger");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/backups"] });
      toast({
        title: "Backup triggered",
        description: "A new backup has been scheduled.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to trigger backup",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const lastBackup = backups?.[0];
  const nextBackupDate = lastBackup 
    ? addDays(new Date(lastBackup.backupDate), 7)
    : null;
  
  const timeUntilNextBackup = nextBackupDate 
    ? differenceInHours(nextBackupDate, new Date())
    : null;

  const formatTimeRemaining = () => {
    if (!timeUntilNextBackup) return "Not scheduled";
    if (timeUntilNextBackup < 0) return "Overdue";
    if (timeUntilNextBackup < 24) return `${timeUntilNextBackup} hours`;
    return `${Math.ceil(timeUntilNextBackup / 24)} days`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Backups</h1>
          <p className="text-muted-foreground">
            Weekly database backups sent to Discord
          </p>
        </div>
        <Button 
          onClick={() => triggerBackup.mutate()}
          disabled={triggerBackup.isPending}
          data-testid="button-trigger-backup"
        >
          <Play className="h-4 w-4 mr-2" />
          {triggerBackup.isPending ? "Triggering..." : "Trigger Backup Now"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Next Backup
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-next-backup">
                  {formatTimeRemaining()}
                </div>
                {nextBackupDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(nextBackupDate, "EEEE, MMM d 'at' h:mm a")}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Total Backups
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-total-backups">
                  {backups?.length ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  All time
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Download className="h-4 w-4" />
              Last Backup Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : lastBackup ? (
              <>
                <div className="text-2xl font-bold" data-testid="text-last-backup-size">
                  {lastBackup.messageCount} msgs
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(lastBackup.backupDate), "MMM d, yyyy")}
                </p>
              </>
            ) : (
              <div className="text-2xl font-bold text-muted-foreground">-</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Backup History</h2>
        <div className="space-y-3">
          {isLoading ? (
            [...Array(3)].map((_, i) => <BackupSkeleton key={i} />)
          ) : backups && backups.length > 0 ? (
            backups.map((backup) => (
              <BackupCard key={backup.id} backup={backup} />
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/30" />
                <h3 className="text-lg font-medium mt-4">No backups yet</h3>
                <p className="text-muted-foreground mt-1">
                  Weekly backups will appear here once scheduled
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => triggerBackup.mutate()}
                  disabled={triggerBackup.isPending}
                >
                  Create First Backup
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
