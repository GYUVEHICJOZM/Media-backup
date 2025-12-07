import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Image as ImageIcon, Server, Calendar, Clock } from "lucide-react";
import { format, subDays, isAfter } from "date-fns";
import type { Message, Backup, BotConfig } from "@shared/schema";

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description,
  isLoading 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType;
  description?: string;
  isLoading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className="text-2xl font-bold" data-testid={`stat-${title.toLowerCase().replace(/\s/g, '-')}`}>
              {value}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function isImageUrl(url: string): boolean {
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];
  const lowerUrl = url.toLowerCase();
  return imageExtensions.some(ext => lowerUrl.includes(ext));
}

function RecentMediaCard({ message }: { message: Message }) {
  const imageUrl = message.attachmentUrls?.find(isImageUrl);

  return (
    <div className="flex items-start gap-3 p-3 rounded-md hover-elevate">
      {imageUrl ? (
        <div className="h-16 w-16 rounded-md overflow-hidden flex-shrink-0 bg-muted">
          <img 
            src={imageUrl} 
            alt="Media thumbnail"
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{message.authorUsername}</span>
          <Badge variant="secondary" className="text-xs">
            #{message.channelName}
          </Badge>
        </div>
        {message.content && (
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {message.content}
          </p>
        )}
        <span className="text-xs text-muted-foreground font-mono mt-1 block">
          {format(new Date(message.timestamp), "MMM d, h:mm a")}
        </span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

  const { data: backups, isLoading: backupsLoading } = useQuery<Backup[]>({
    queryKey: ["/api/backups"],
  });

  const { data: configs, isLoading: configsLoading } = useQuery<BotConfig[]>({
    queryKey: ["/api/config"],
  });

  const isLoading = messagesLoading || backupsLoading || configsLoading;

  const totalMedia = messages?.filter(m => m.hasAttachments).length ?? 0;
  const weekAgo = subDays(new Date(), 7);
  const mediaThisWeek = messages?.filter(m => 
    m.hasAttachments && isAfter(new Date(m.timestamp), weekAgo)
  ).length ?? 0;
  
  const activeChannels = configs?.filter(c => c.isActive)?.length ?? 0;
  
  const lastBackup = backups?.[0];
  const nextBackupDate = lastBackup 
    ? format(new Date(new Date(lastBackup.backupDate).getTime() + 7 * 24 * 60 * 60 * 1000), "MMM d")
    : "Not scheduled";

  const recentMedia = messages?.filter(m => m.hasAttachments).slice(0, 5) ?? [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your Discord media archive
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Media"
          value={totalMedia}
          icon={ImageIcon}
          description="All time captured"
          isLoading={isLoading}
        />
        <StatCard
          title="This Week"
          value={mediaThisWeek}
          icon={Calendar}
          description="Media this week"
          isLoading={isLoading}
        />
        <StatCard
          title="Active Channels"
          value={activeChannels}
          icon={Server}
          description="Being monitored"
          isLoading={isLoading}
        />
        <StatCard
          title="Next Backup"
          value={nextBackupDate}
          icon={Clock}
          description="Weekly scheduled"
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Media</CardTitle>
          </CardHeader>
          <CardContent>
            {messagesLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-16 w-16 rounded-md" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentMedia.length > 0 ? (
              <div className="space-y-1">
                {recentMedia.map((message) => (
                  <RecentMediaCard key={message.id} message={message} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground mt-2">No media yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Media will appear here once captured
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Backups</CardTitle>
          </CardHeader>
          <CardContent>
            {backupsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : backups && backups.length > 0 ? (
              <div className="space-y-3">
                {backups.slice(0, 5).map((backup) => (
                  <div 
                    key={backup.id} 
                    className="flex items-center justify-between p-3 rounded-md hover-elevate"
                  >
                    <div>
                      <span className="text-sm font-medium">
                        {format(new Date(backup.backupDate), "MMMM d, yyyy")}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {backup.messageCount} items backed up
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      backup.status === 'completed' 
                        ? 'bg-status-online/10 text-status-online' 
                        : 'bg-status-away/10 text-status-away'
                    }`}>
                      {backup.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground mt-2">No backups yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Weekly backups will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
