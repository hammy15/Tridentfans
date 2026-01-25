'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Send,
  Users,
  User,
  Megaphone,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2,
  RefreshCw,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface NotificationStats {
  totalSubscribers: number;
  activeSubscriptions: number;
  uniqueSubscribers: number;
}

interface NotificationLog {
  id: string;
  type: string;
  target_type: string;
  target_count: number;
  sent_count: number;
  failed_count: number;
  payload: { title: string; body: string };
  created_at: string;
  created_by?: string;
}

interface ScheduledNotification {
  id: string;
  type: string;
  payload: { title: string; body: string };
  scheduled_for: string;
  status: string;
  broadcast: boolean;
  user_ids?: string[];
}

export function NotificationAdmin() {
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetType, setTargetType] = useState<'broadcast' | 'single'>('broadcast');
  const [targetUserId, setTargetUserId] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);

  // Fetch stats and logs
  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/push/send?action=stats', {
        headers: {
          'x-system-key': process.env.NEXT_PUBLIC_ADMIN_KEY || '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data.stats);
      setLogs(data.recentLogs || []);
      setScheduled(data.scheduledNotifications || []);
    } catch (err) {
      console.error('Error fetching notification data:', err);
      setError('Failed to load notification data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Send notification
  const sendNotification = async () => {
    if (!title.trim() || !body.trim()) {
      setError('Title and body are required');
      return;
    }

    if (targetType === 'single' && !targetUserId.trim()) {
      setError('User ID is required for single user notification');
      return;
    }

    if (isScheduled && !scheduleTime) {
      setError('Schedule time is required for scheduled notifications');
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: Record<string, unknown> = {
        payload: { title, body },
      };

      if (targetType === 'broadcast') {
        payload.broadcast = true;
      } else {
        payload.userId = targetUserId;
      }

      if (isScheduled) {
        payload.scheduledFor = new Date(scheduleTime).toISOString();
      }

      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-system-key': process.env.NEXT_PUBLIC_ADMIN_KEY || '',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send notification');
      }

      if (isScheduled) {
        setSuccess(`Notification scheduled for ${new Date(scheduleTime).toLocaleString()}`);
      } else {
        setSuccess(`Notification sent! ${data.sent} delivered, ${data.failed} failed`);
      }

      // Clear form
      setTitle('');
      setBody('');
      setTargetUserId('');
      setScheduleTime('');
      setIsScheduled(false);

      // Refresh data
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  // Cancel scheduled notification
  const cancelScheduled = async (scheduledId: string) => {
    try {
      const response = await fetch('/api/push/send', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-system-key': process.env.NEXT_PUBLIC_ADMIN_KEY || '',
        },
        body: JSON.stringify({ scheduledId }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel notification');
      }

      setSuccess('Scheduled notification cancelled');
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-mariners-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mariners-teal/10 text-mariners-teal">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.uniqueSubscribers || 0}</p>
                <p className="text-sm text-muted-foreground">Subscribers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.activeSubscriptions || 0}</p>
                <p className="text-sm text-muted-foreground">Active Devices</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{scheduled.length}</p>
                <p className="text-sm text-muted-foreground">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            &times;
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <p>{success}</p>
          <button
            onClick={() => setSuccess(null)}
            className="ml-auto text-green-400 hover:text-green-600"
          >
            &times;
          </button>
        </div>
      )}

      <Tabs defaultValue="send" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="send" className="data-[state=active]:bg-white">
            <Send className="h-4 w-4 mr-2" />
            Send Notification
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="data-[state=active]:bg-white">
            <Calendar className="h-4 w-4 mr-2" />
            Scheduled ({scheduled.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-white">
            <BarChart3 className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Send Notification Tab */}
        <TabsContent value="send">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-mariners-teal" />
                Send Push Notification
              </CardTitle>
              <CardDescription>
                Send notifications to users who have enabled push notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Target Selection */}
              <div className="flex gap-2">
                <Button
                  variant={targetType === 'broadcast' ? 'default' : 'outline'}
                  onClick={() => setTargetType('broadcast')}
                  className={cn(
                    'flex-1',
                    targetType === 'broadcast' && 'bg-mariners-teal hover:bg-mariners-teal/90'
                  )}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Broadcast to All
                </Button>
                <Button
                  variant={targetType === 'single' ? 'default' : 'outline'}
                  onClick={() => setTargetType('single')}
                  className={cn(
                    'flex-1',
                    targetType === 'single' && 'bg-mariners-teal hover:bg-mariners-teal/90'
                  )}
                >
                  <User className="h-4 w-4 mr-2" />
                  Single User
                </Button>
              </div>

              {targetType === 'single' && (
                <div className="space-y-2">
                  <Label htmlFor="userId">User ID</Label>
                  <Input
                    id="userId"
                    placeholder="Enter user ID..."
                    value={targetUserId}
                    onChange={e => setTargetUserId(e.target.value)}
                  />
                </div>
              )}

              {/* Notification Content */}
              <div className="space-y-2">
                <Label htmlFor="title">Notification Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Game Day!"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {title.length}/50 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Message</Label>
                <Textarea
                  id="body"
                  placeholder="Write your notification message..."
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={3}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {body.length}/200 characters
                </p>
              </div>

              {/* Schedule Toggle */}
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="schedule"
                    checked={isScheduled}
                    onChange={e => setIsScheduled(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="schedule" className="cursor-pointer">
                    Schedule for later
                  </Label>
                </div>

                {isScheduled && (
                  <Input
                    type="datetime-local"
                    value={scheduleTime}
                    onChange={e => setScheduleTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="max-w-[220px]"
                  />
                )}
              </div>

              {/* Preview */}
              {(title || body) && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-mariners-navy text-white shrink-0">
                      <Bell className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{title || 'Notification Title'}</p>
                      <p className="text-sm text-muted-foreground">
                        {body || 'Notification message...'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Send Button */}
              <Button
                onClick={sendNotification}
                disabled={sending || !title || !body}
                className="w-full bg-mariners-teal hover:bg-mariners-teal/90"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isScheduled ? 'Scheduling...' : 'Sending...'}
                  </>
                ) : (
                  <>
                    {isScheduled ? (
                      <>
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Notification
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        {targetType === 'broadcast'
                          ? `Send to All ${stats?.uniqueSubscribers || 0} Subscribers`
                          : 'Send Notification'}
                      </>
                    )}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduled Tab */}
        <TabsContent value="scheduled">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Scheduled Notifications</CardTitle>
                <CardDescription>Pending notifications that will be sent later</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {scheduled.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No scheduled notifications</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scheduled.map(notification => (
                    <div
                      key={notification.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{notification.payload.title}</p>
                          <Badge variant="outline" className="text-xs">
                            {notification.broadcast ? 'Broadcast' : 'Single User'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{notification.payload.body}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Scheduled for: {formatDate(notification.scheduled_for)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelScheduled(notification.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Notifications</CardTitle>
                <CardDescription>History of sent notifications</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No notification history yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map(log => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{log.payload.title}</p>
                          <Badge
                            variant={log.target_type === 'broadcast' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {log.target_type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {log.payload.body}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>{formatDate(log.created_at)}</span>
                          <span className="text-green-600">{log.sent_count} sent</span>
                          {log.failed_count > 0 && (
                            <span className="text-red-500">{log.failed_count} failed</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
