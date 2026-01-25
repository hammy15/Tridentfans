'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Plus,
  Loader2,
  Star,
  Trash2,
  Edit2,
  Search,
  Database,
  CheckCircle,
  X,
  Upload,
} from 'lucide-react';
import type { HistoricalMoment, HistoricalCategory } from '@/types';
import { CATEGORY_COLORS, CATEGORY_LABELS, getSeedData } from '@/lib/mariners-history-moments';

interface HistoryAdminProps {
  adminPassword: string;
}

const CATEGORIES: HistoricalCategory[] = ['game', 'trade', 'milestone', 'draft', 'record', 'other'];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function HistoryAdmin({ adminPassword }: HistoryAdminProps) {
  const [moments, setMoments] = useState<HistoricalMoment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMoment, setEditingMoment] = useState<HistoricalMoment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<HistoricalCategory | ''>('');
  const [filterMonth, setFilterMonth] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    date_month: 1,
    date_day: 1,
    year: 2000,
    title: '',
    description: '',
    category: 'milestone' as HistoricalCategory,
    player_names: '',
    image_url: '',
    source_url: '',
    is_featured: false,
  });

  useEffect(() => {
    fetchMoments();
  }, []);

  async function fetchMoments() {
    try {
      const res = await fetch('/api/history?all=true');
      const data = await res.json();
      setMoments(data.moments || []);
    } catch (error) {
      console.error('Failed to fetch moments:', error);
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        player_names: formData.player_names
          .split(',')
          .map((n) => n.trim())
          .filter((n) => n.length > 0),
        password: adminPassword,
        ...(editingMoment && { id: editingMoment.id }),
      };

      const method = editingMoment ? 'PUT' : 'POST';
      const res = await fetch('/api/history', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        resetForm();
        fetchMoments();
      } else {
        const data = await res.json();
        alert('Error: ' + (data.error || 'Failed to save'));
      }
    } catch (error) {
      console.error('Failed to save moment:', error);
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this moment?')) return;

    try {
      const res = await fetch(`/api/history?id=${id}&password=${adminPassword}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchMoments();
      } else {
        alert('Failed to delete moment');
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  }

  async function handleSeedDatabase() {
    if (!confirm('This will add all 50+ seed moments to the database. Continue?')) return;

    setSeeding(true);
    setSeedResult(null);

    try {
      const seedData = getSeedData();
      let successCount = 0;
      let errorCount = 0;

      for (const moment of seedData) {
        try {
          const res = await fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...moment,
              password: adminPassword,
            }),
          });

          if (res.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch {
          errorCount++;
        }
      }

      setSeedResult(`Seeded ${successCount} moments successfully. ${errorCount} errors.`);
      fetchMoments();
    } catch (error) {
      console.error('Failed to seed database:', error);
      setSeedResult('Failed to seed database');
    }

    setSeeding(false);
  }

  function handleEdit(moment: HistoricalMoment) {
    setEditingMoment(moment);
    setFormData({
      date_month: moment.date_month,
      date_day: moment.date_day,
      year: moment.year,
      title: moment.title,
      description: moment.description,
      category: moment.category,
      player_names: moment.player_names?.join(', ') || '',
      image_url: moment.image_url || '',
      source_url: moment.source_url || '',
      is_featured: moment.is_featured,
    });
    setShowForm(true);
  }

  function resetForm() {
    setShowForm(false);
    setEditingMoment(null);
    setFormData({
      date_month: 1,
      date_day: 1,
      year: 2000,
      title: '',
      description: '',
      category: 'milestone',
      player_names: '',
      image_url: '',
      source_url: '',
      is_featured: false,
    });
  }

  async function toggleFeatured(moment: HistoricalMoment) {
    try {
      await fetch('/api/history', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: moment.id,
          is_featured: !moment.is_featured,
          password: adminPassword,
        }),
      });
      fetchMoments();
    } catch (error) {
      console.error('Failed to toggle featured:', error);
    }
  }

  // Filter moments
  const filteredMoments = moments.filter((m) => {
    const matchesSearch =
      searchTerm === '' ||
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.player_names?.some((n) => n.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = filterCategory === '' || m.category === filterCategory;
    const matchesMonth = filterMonth === '' || m.date_month === filterMonth;

    return matchesSearch && matchesCategory && matchesMonth;
  });

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Historical Moments
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage &quot;On This Day&quot; moments for Mariners history
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSeedDatabase} disabled={seeding}>
            {seeding ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            Seed Database
          </Button>
          <Button
            variant="mariners"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Moment
          </Button>
        </div>
      </div>

      {/* Seed result */}
      {seedResult && (
        <div
          className={`p-3 rounded-lg ${
            seedResult.includes('Failed') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
          }`}
        >
          {seedResult}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">
              {editingMoment ? 'Edit Moment' : 'Add New Moment'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Month</Label>
                <select
                  value={formData.date_month}
                  onChange={(e) => setFormData({ ...formData, date_month: parseInt(e.target.value) })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Day</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.date_day}
                  onChange={(e) => setFormData({ ...formData, date_day: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  type="number"
                  min="1977"
                  max={new Date().getFullYear()}
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as HistoricalCategory })
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Edgar's Double, Felix's Perfect Game, etc."
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what happened..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Player Names (comma separated)</Label>
                <Input
                  value={formData.player_names}
                  onChange={(e) => setFormData({ ...formData, player_names: e.target.value })}
                  placeholder="Ken Griffey Jr., Edgar Martinez"
                />
              </div>
              <div className="space-y-2">
                <Label>Source URL (optional)</Label>
                <Input
                  type="url"
                  value={formData.source_url}
                  onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Image URL (optional)</Label>
              <Input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_featured"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="is_featured" className="cursor-pointer">
                Featured moment (highlighted in displays)
              </Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button variant="mariners" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {editingMoment ? 'Update' : 'Create'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search moments..."
                className="pl-10"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as HistoricalCategory | '')}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
            <select
              value={filterMonth}
              onChange={(e) =>
                setFilterMonth(e.target.value ? parseInt(e.target.value) : '')
              }
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">All Months</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Moments List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            All Moments ({filteredMoments.length})
          </CardTitle>
          <CardDescription>
            {moments.length > 0
              ? `Showing ${filteredMoments.length} of ${moments.length} total moments`
              : 'No moments in database yet. Click "Seed Database" to add 50+ historical moments.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-mariners-teal" />
            </div>
          ) : filteredMoments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No moments found matching your filters
            </p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {filteredMoments.map((moment) => (
                <div
                  key={moment.id}
                  className="flex items-start justify-between gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge
                        className={`${CATEGORY_COLORS[moment.category as HistoricalCategory]} text-white text-xs`}
                      >
                        {CATEGORY_LABELS[moment.category as HistoricalCategory]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {MONTHS[moment.date_month - 1]} {moment.date_day}, {moment.year}
                      </span>
                      {moment.is_featured && (
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    <h4 className="font-medium truncate">{moment.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {moment.description}
                    </p>
                    {moment.player_names && moment.player_names.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {moment.player_names.slice(0, 4).map((name) => (
                          <Badge key={name} variant="secondary" className="text-xs">
                            {name}
                          </Badge>
                        ))}
                        {moment.player_names.length > 4 && (
                          <Badge variant="secondary" className="text-xs">
                            +{moment.player_names.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFeatured(moment)}
                      title={moment.is_featured ? 'Remove from featured' : 'Mark as featured'}
                    >
                      <Star
                        className={`h-4 w-4 ${
                          moment.is_featured ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'
                        }`}
                      />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(moment)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(moment.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CSV Import Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import from CSV
          </CardTitle>
          <CardDescription>
            Bulk import historical moments from a CSV file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            CSV should have columns: date_month, date_day, year, title, description, category,
            player_names (semicolon separated), image_url, source_url, is_featured (true/false)
          </p>
          <div className="flex items-center gap-2">
            <Input type="file" accept=".csv" disabled className="flex-1" />
            <Button variant="outline" disabled>
              Import
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            CSV import coming soon. For now, use the &quot;Seed Database&quot; button to load 50+ pre-defined
            moments.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
