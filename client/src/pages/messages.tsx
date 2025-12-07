import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  X, 
  Image as ImageIcon,
  ArrowUpDown,
  ExternalLink
} from "lucide-react";
import { format, isAfter, subDays, subMonths } from "date-fns";
import type { Message } from "@shared/schema";

function isImageUrl(url: string): boolean {
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];
  const lowerUrl = url.toLowerCase();
  return imageExtensions.some(ext => lowerUrl.includes(ext));
}

function MediaCard({ message }: { message: Message }) {
  const imageUrls = message.attachmentUrls?.filter(isImageUrl) || [];
  const otherUrls = message.attachmentUrls?.filter(url => !isImageUrl(url)) || [];

  return (
    <Card className="hover-elevate transition-all duration-200 overflow-visible">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            {message.authorAvatar ? (
              <img 
                src={message.authorAvatar} 
                alt={message.authorUsername}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold text-primary">
                {message.authorUsername.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{message.authorUsername}</span>
              <Badge variant="secondary" className="text-xs">
                #{message.channelName}
              </Badge>
              {message.hasAttachments && (
                <Badge variant="outline" className="text-xs gap-1">
                  <ImageIcon className="h-3 w-3" />
                  Media
                </Badge>
              )}
            </div>
            
            {message.content && (
              <p className="text-sm whitespace-pre-wrap break-words" data-testid={`text-message-${message.id}`}>
                {message.content}
              </p>
            )}
            
            {imageUrls.length > 0 && (
              <div className="grid gap-2" style={{ 
                gridTemplateColumns: imageUrls.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))'
              }}>
                {imageUrls.map((url, index) => (
                  <a 
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-md overflow-hidden border hover:opacity-90 transition-opacity"
                  >
                    <img 
                      src={url} 
                      alt={`Attachment ${index + 1}`}
                      className="w-full h-auto max-h-80 object-contain bg-muted"
                      loading="lazy"
                    />
                  </a>
                ))}
              </div>
            )}
            
            {otherUrls.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {otherUrls.map((url, index) => (
                  <a 
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline bg-primary/5 px-2 py-1 rounded"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Attachment {index + 1}
                  </a>
                ))}
              </div>
            )}
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="font-mono">
                {format(new Date(message.timestamp), "MMM d, yyyy 'at' h:mm a")}
              </span>
              <span className="text-muted-foreground/50">
                {message.serverName}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MediaSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-3">
            <div className="flex gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-48 w-full rounded-md" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Messages() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [mediaOnly, setMediaOnly] = useState(false);

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

  const channels = useMemo(() => {
    if (!messages) return [];
    const uniqueChannels = [...new Set(messages.map(m => m.channelName))];
    return uniqueChannels.sort();
  }, [messages]);

  const filteredMessages = useMemo(() => {
    if (!messages) return [];
    
    let filtered = [...messages];

    if (mediaOnly) {
      filtered = filtered.filter(m => m.hasAttachments);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.content.toLowerCase().includes(query) ||
        m.authorUsername.toLowerCase().includes(query)
      );
    }

    if (selectedChannel !== "all") {
      filtered = filtered.filter(m => m.channelName === selectedChannel);
    }

    if (dateFilter !== "all") {
      const now = new Date();
      let startDate: Date;
      
      switch (dateFilter) {
        case "today":
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case "week":
          startDate = subDays(now, 7);
          break;
        case "month":
          startDate = subMonths(now, 1);
          break;
        default:
          startDate = new Date(0);
      }
      
      filtered = filtered.filter(m => isAfter(new Date(m.timestamp), startDate));
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [messages, searchQuery, selectedChannel, dateFilter, sortOrder, mediaOnly]);

  const hasActiveFilters = searchQuery || selectedChannel !== "all" || dateFilter !== "all" || mediaOnly;

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedChannel("all");
    setDateFilter("all");
    setMediaOnly(false);
  };

  const mediaCount = messages?.filter(m => m.hasAttachments).length ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Media Archive</h1>
        <p className="text-muted-foreground">
          Browse all captured media from Discord
        </p>
      </div>

      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 -mx-6 px-6 border-b">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant={mediaOnly ? "default" : "outline"}
              onClick={() => setMediaOnly(!mediaOnly)}
              className="gap-1"
              data-testid="button-media-filter"
            >
              <ImageIcon className="h-4 w-4" />
              Media Only
              <Badge variant="secondary" className="ml-1">
                {mediaCount}
              </Badge>
            </Button>

            <Select value={selectedChannel} onValueChange={setSelectedChannel}>
              <SelectTrigger className="w-[160px]" data-testid="select-channel">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                {channels.map(channel => (
                  <SelectItem key={channel} value={channel}>
                    #{channel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[140px]" data-testid="select-date">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(s => s === "newest" ? "oldest" : "newest")}
              data-testid="button-sort"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="gap-1"
                data-testid="button-clear-filters"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
          <span data-testid="text-results-count">
            {filteredMessages.length} item{filteredMessages.length !== 1 ? 's' : ''}
          </span>
          <span>
            Sorted by {sortOrder === "newest" ? "newest first" : "oldest first"}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => <MediaSkeleton key={i} />)
        ) : filteredMessages.length > 0 ? (
          filteredMessages.map((message) => (
            <MediaCard key={message.id} message={message} />
          ))
        ) : (
          <div className="text-center py-16">
            <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground/30" />
            <h3 className="text-lg font-medium mt-4">No media found</h3>
            <p className="text-muted-foreground mt-1">
              {hasActiveFilters 
                ? "Try adjusting your filters" 
                : "Media will appear here once captured by the bot"}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="mt-4">
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
