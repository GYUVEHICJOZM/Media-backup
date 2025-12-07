import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Settings as SettingsIcon, 
  Plus, 
  Trash2, 
  Server, 
  Hash,
  Bot,
  CheckCircle,
  XCircle
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { BotConfig } from "@shared/schema";

const configFormSchema = z.object({
  serverId: z.string().min(1, "Server ID is required"),
  serverName: z.string().min(1, "Server name is required"),
  channelId: z.string().min(1, "Channel ID is required"),
  channelName: z.string().min(1, "Channel name is required"),
  backupChannelId: z.string().optional(),
  backupChannelName: z.string().optional(),
  monitorUserId: z.string().min(1, "Your Discord user ID is required"),
});

type ConfigFormValues = z.infer<typeof configFormSchema>;

function ConfigCard({ 
  config, 
  onToggle,
  onDelete,
  isToggling,
  isDeleting
}: { 
  config: BotConfig;
  onToggle: () => void;
  onDelete: () => void;
  isToggling: boolean;
  isDeleting: boolean;
}) {
  return (
    <Card className={config.isActive ? "" : "opacity-60"}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
              <Server className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold">{config.serverName}</h3>
                <Badge variant={config.isActive ? "default" : "secondary"}>
                  {config.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Hash className="h-3 w-3" />
                <span>{config.channelName}</span>
              </div>
              {config.backupChannelName && (
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>Backup to: #{config.backupChannelName}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Switch 
              checked={config.isActive ?? false}
              onCheckedChange={onToggle}
              disabled={isToggling}
              data-testid={`switch-config-${config.id}`}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              disabled={isDeleting}
              className="text-destructive hover:text-destructive"
              data-testid={`button-delete-config-${config.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ConfigSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Skeleton className="h-10 w-10 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-6 w-12" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: configs, isLoading } = useQuery<BotConfig[]>({
    queryKey: ["/api/config"],
  });

  const { data: botStatus } = useQuery<{ connected: boolean; username?: string }>({
    queryKey: ["/api/bot/status"],
  });

  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(configFormSchema),
    defaultValues: {
      serverId: "",
      serverName: "",
      channelId: "",
      channelName: "",
      backupChannelId: "",
      backupChannelName: "",
      monitorUserId: "",
    },
  });

  const createConfig = useMutation({
    mutationFn: async (data: ConfigFormValues) => {
      const res = await apiRequest("POST", "/api/config", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Configuration added",
        description: "The bot will now monitor this channel.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to add configuration",
        description: "Please check your inputs and try again.",
        variant: "destructive",
      });
    },
  });

  const toggleConfig = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/config/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
    },
  });

  const deleteConfig = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/config/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
      toast({
        title: "Configuration deleted",
        description: "The channel will no longer be monitored.",
      });
    },
  });

  const onSubmit = (data: ConfigFormValues) => {
    createConfig.mutate(data);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Settings</h1>
          <p className="text-muted-foreground">
            Configure which channels to monitor
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-config">
              <Plus className="h-4 w-4 mr-2" />
              Add Channel
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Channel Configuration</DialogTitle>
              <DialogDescription>
                Add a new channel for the bot to monitor. You'll need the server ID, 
                channel ID, and your Discord user ID.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="serverId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Server ID</FormLabel>
                        <FormControl>
                          <Input placeholder="123456789012345678" {...field} data-testid="input-server-id" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="serverName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Server Name</FormLabel>
                        <FormControl>
                          <Input placeholder="My Server" {...field} data-testid="input-server-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="channelId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Channel ID</FormLabel>
                        <FormControl>
                          <Input placeholder="123456789012345678" {...field} data-testid="input-channel-id" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="channelName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Channel Name</FormLabel>
                        <FormControl>
                          <Input placeholder="general" {...field} data-testid="input-channel-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="monitorUserId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Discord User ID</FormLabel>
                      <FormControl>
                        <Input placeholder="123456789012345678" {...field} data-testid="input-user-id" />
                      </FormControl>
                      <FormDescription>
                        Only messages from this user will be captured
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="backupChannelId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Backup Channel ID (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="123456789012345678" {...field} data-testid="input-backup-channel-id" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="backupChannelName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Backup Channel Name</FormLabel>
                        <FormControl>
                          <Input placeholder="backups" {...field} data-testid="input-backup-channel-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createConfig.isPending}
                    data-testid="button-submit-config"
                  >
                    {createConfig.isPending ? "Adding..." : "Add Configuration"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Bot Status
          </CardTitle>
          <CardDescription>
            Current connection status of the Discord bot
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {botStatus?.connected ? (
              <>
                <CheckCircle className="h-5 w-5 text-status-online" />
                <span className="font-medium">Connected</span>
                {botStatus.username && (
                  <Badge variant="secondary">{botStatus.username}</Badge>
                )}
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-status-offline" />
                <span className="font-medium text-muted-foreground">Disconnected</span>
                <span className="text-sm text-muted-foreground">
                  - Bot token may not be configured
                </span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-4">Monitored Channels</h2>
        <div className="space-y-3">
          {isLoading ? (
            [...Array(2)].map((_, i) => <ConfigSkeleton key={i} />)
          ) : configs && configs.length > 0 ? (
            configs.map((config) => (
              <ConfigCard
                key={config.id}
                config={config}
                onToggle={() => toggleConfig.mutate({ 
                  id: config.id, 
                  isActive: !config.isActive 
                })}
                onDelete={() => deleteConfig.mutate(config.id)}
                isToggling={toggleConfig.isPending}
                isDeleting={deleteConfig.isPending}
              />
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <SettingsIcon className="h-12 w-12 mx-auto text-muted-foreground/30" />
                <h3 className="text-lg font-medium mt-4">No channels configured</h3>
                <p className="text-muted-foreground mt-1">
                  Add a channel to start monitoring messages
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Channel
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
