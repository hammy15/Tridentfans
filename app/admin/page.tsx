'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  Bot,
  Trophy,
  MessageSquare,
  Users,
  BarChart3,
  Save,
  RefreshCw,
  Eye,
  User,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { DEFAULT_BOT_CONFIGS, BOT_PRESETS } from '@/lib/ai-bots';
import type { BotId, BotTraits } from '@/types';

const botIds: BotId[] = ['moose', 'captain_hammy', 'spartan'];

// Bot mode toggle component for Hammy/Spartan
function BotModeToggle({
  personId,
  name,
  emoji,
  adminPassword,
}: {
  personId: string;
  name: string;
  emoji: string;
  adminPassword: string;
}) {
  const [botModeEnabled, setBotModeEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/bot-mode?id=${personId}`)
      .then(res => res.json())
      .then(data => {
        setBotModeEnabled(data.botModeEnabled ?? true);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [personId]);

  const handleToggle = async () => {
    const newValue = !botModeEnabled;
    setBotModeEnabled(newValue);

    try {
      await fetch('/api/bot-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: personId, enabled: newValue, password: adminPassword }),
      });
    } catch {
      setBotModeEnabled(!newValue); // Revert on error
    }
  };

  if (isLoading) {
    return <div className="animate-pulse bg-muted h-20 rounded-lg" />;
  }

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{emoji}</span>
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-sm text-muted-foreground">
            {botModeEnabled ? 'AI responds when away' : 'Only you can respond'}
          </p>
        </div>
      </div>
      <button
        onClick={handleToggle}
        className={`p-2 rounded-lg transition-colors ${botModeEnabled ? 'bg-mariners-teal text-white' : 'bg-muted'}`}
      >
        {botModeEnabled ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
      </button>
    </div>
  );
}

function TraitSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-sm text-muted-foreground">{value}/10</span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-mariners-teal"
      />
    </div>
  );
}

function BotConfigPanel({ botId }: { botId: BotId }) {
  const defaultConfig = DEFAULT_BOT_CONFIGS[botId];
  const [config, setConfig] = useState({
    display_name: defaultConfig.display_name,
    system_prompt: defaultConfig.system_prompt,
    traits: { ...defaultConfig.traits },
  });
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  const handleTraitChange = (trait: keyof BotTraits, value: number | string) => {
    setConfig({
      ...config,
      traits: { ...config.traits, [trait]: value },
    });
  };

  const handlePresetApply = (presetName: string) => {
    const preset = BOT_PRESETS[presetName];
    if (preset) {
      setConfig({
        ...config,
        traits: { ...config.traits, ...preset },
      });
    }
  };

  const handleTest = async () => {
    if (!testMessage.trim()) return;
    setIsTesting(true);
    // Simulate API call
    setTimeout(() => {
      setTestResponse(
        `[${config.display_name}]: This is a test response based on the current configuration. The bot would use the system prompt and traits to generate a contextual response about the Mariners.`
      );
      setIsTesting(false);
    }, 1500);
  };

  const handleSave = () => {
    console.log('Saving config:', { botId, config });
    alert('Configuration saved! (Demo mode)');
  };

  return (
    <div className="space-y-6">
      {/* Bot Header */}
      <div className="flex items-center gap-4">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl ${
            botId === 'moose'
              ? 'bg-mariners-teal'
              : botId === 'captain_hammy'
                ? 'bg-mariners-navy'
                : 'bg-mariners-silver'
          }`}
        >
          {defaultConfig.avatar_emoji}
        </div>
        <div>
          <Input
            value={config.display_name}
            onChange={e => setConfig({ ...config, display_name: e.target.value })}
            className="text-xl font-bold border-none p-0 h-auto focus-visible:ring-0"
          />
          <p className="text-sm text-muted-foreground">Bot ID: {botId}</p>
        </div>
      </div>

      {/* Trait Presets */}
      <div>
        <label className="text-sm font-medium mb-2 block">Quick Presets</label>
        <div className="flex flex-wrap gap-2">
          {Object.keys(BOT_PRESETS).map(preset => (
            <Button
              key={preset}
              variant="outline"
              size="sm"
              onClick={() => handlePresetApply(preset)}
            >
              {preset.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </div>

      {/* Trait Sliders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Personality Traits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <TraitSlider
            label="Humor"
            value={config.traits.humor}
            onChange={v => handleTraitChange('humor', v)}
          />
          <TraitSlider
            label="Edginess"
            value={config.traits.edginess}
            onChange={v => handleTraitChange('edginess', v)}
          />
          <TraitSlider
            label="Formality"
            value={config.traits.formality}
            onChange={v => handleTraitChange('formality', v)}
          />
          <TraitSlider
            label="Confidence"
            value={config.traits.confidence}
            onChange={v => handleTraitChange('confidence', v)}
          />
          <div>
            <label className="text-sm font-medium mb-2 block">Debate Style</label>
            <select
              value={config.traits.debate_style}
              onChange={e =>
                handleTraitChange('debate_style', e.target.value as BotTraits['debate_style'])
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2"
            >
              <option value="collaborative">Collaborative</option>
              <option value="argumentative">Argumentative</option>
              <option value="socratic">Socratic</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* System Prompt */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">System Prompt</CardTitle>
          <CardDescription>Full instructions for the AI personality</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={config.system_prompt}
            onChange={e => setConfig({ ...config, system_prompt: e.target.value })}
            rows={15}
            className="font-mono text-sm"
          />
        </CardContent>
      </Card>

      {/* Test Chat */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Test Configuration
          </CardTitle>
          <CardDescription>Send a test message to preview the response</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={testMessage}
              onChange={e => setTestMessage(e.target.value)}
              placeholder="Type a test message..."
            />
            <Button onClick={handleTest} disabled={isTesting}>
              {isTesting ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Test'}
            </Button>
          </div>
          {testResponse && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">{testResponse}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() =>
            setConfig({
              display_name: defaultConfig.display_name,
              system_prompt: defaultConfig.system_prompt,
              traits: { ...defaultConfig.traits },
            })
          }
        >
          Reset to Defaults
        </Button>
        <Button variant="mariners" onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Configuration
        </Button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Simple password protection (in production, use proper auth)
  const handleLogin = () => {
    if (password === 'mariners2026' || password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setAdminPassword(password);
    } else {
      alert('Invalid password');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Admin Access
            </CardTitle>
            <CardDescription>Enter the admin password to continue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
            <Button variant="mariners" className="w-full" onClick={handleLogin}>
              Login
            </Button>
            <p className="text-xs text-center text-muted-foreground">Demo password: mariners2026</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="h-8 w-8 text-mariners-teal" />
          Admin Dashboard
        </h1>
        <p className="mt-2 text-muted-foreground">Manage bots, predictions, users, and content</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Users className="h-8 w-8 text-mariners-teal" />
              <div>
                <p className="text-2xl font-bold">1,234</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Trophy className="h-8 w-8 text-mariners-gold" />
              <div>
                <p className="text-2xl font-bold">5,678</p>
                <p className="text-sm text-muted-foreground">Predictions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <MessageSquare className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">892</p>
                <p className="text-sm text-muted-foreground">Forum Posts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Bot className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">3,456</p>
                <p className="text-sm text-muted-foreground">Bot Chats</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="presence">
        <TabsList className="mb-6">
          <TabsTrigger value="presence">
            <User className="mr-2 h-4 w-4" />
            Your Presence
          </TabsTrigger>
          <TabsTrigger value="moose">
            <Bot className="mr-2 h-4 w-4" />
            Moose AI
          </TabsTrigger>
          <TabsTrigger value="predictions">
            <Trophy className="mr-2 h-4 w-4" />
            Predictions
          </TabsTrigger>
          <TabsTrigger value="forum">
            <MessageSquare className="mr-2 h-4 w-4" />
            Forum
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Your Presence Tab - Bot Mode Toggles */}
        <TabsContent value="presence">
          <div className="max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Your Availability</CardTitle>
                <CardDescription>
                  When you&apos;re away, AI can respond on your behalf using your personality.
                  Toggle off when you want to respond personally.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <BotModeToggle
                  personId="captain_hammy"
                  name="Captain Hammy"
                  emoji="🧢"
                  adminPassword={adminPassword}
                />
                <BotModeToggle
                  personId="spartan"
                  name="Spartan"
                  emoji="⚔️"
                  adminPassword={adminPassword}
                />
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">AI Mode ON:</strong> When someone messages
                  you, the AI responds using your personality and knowledge. Seamless - users
                  won&apos;t know the difference.
                </p>
                <p>
                  <strong className="text-foreground">AI Mode OFF:</strong> Messages wait for your
                  personal response. Use this when you want to engage directly with fans.
                </p>
                <p>
                  <strong className="text-foreground">Learning:</strong> The AI learns from your
                  past conversations to better match your communication style over time.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Marty Moose Configuration Tab */}
        <TabsContent value="moose">
          <div className="max-w-4xl">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🫎</span>
                  Marty Moose - Site Manager
                </CardTitle>
                <CardDescription>
                  Marty is TridentFans&apos; clubhouse manager - the most knowledgeable and helpful
                  member of the team. He&apos;s available 24/7 to help fans with anything
                  Mariners-related.
                </CardDescription>
              </CardHeader>
            </Card>
            <BotConfigPanel botId="moose" />
          </div>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions">
          <Card>
            <CardHeader>
              <CardTitle>Prediction Management</CardTitle>
              <CardDescription>Create games, manage scoring, and view statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Prediction management coming soon</p>
                <p className="text-sm mt-2">
                  Create prediction games, set scoring rules, and review submissions
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Forum Tab */}
        <TabsContent value="forum">
          <Card>
            <CardHeader>
              <CardTitle>Forum Moderation</CardTitle>
              <CardDescription>Manage posts, comments, and user reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Forum moderation coming soon</p>
                <p className="text-sm mt-2">
                  Review reported content, manage categories, and pin posts
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>
                User engagement, prediction accuracy, and site metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Analytics dashboard coming soon</p>
                <p className="text-sm mt-2">
                  View user engagement, prediction stats, and traffic data
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
