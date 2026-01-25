'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type {
  Prospect,
  ProspectLevel,
  ProspectUpdate,
  ProspectUpdateType,
} from '@/types';
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Upload,
  RefreshCw,
  GripVertical,
  Loader2,
  ArrowUp,
  ArrowDown,
  User,
  FileText,
} from 'lucide-react';

interface ProspectsAdminProps {
  adminPassword: string;
}

const levels: ProspectLevel[] = ['AAA', 'AA', 'A+', 'A', 'Rookie', 'DSL'];
const positions = [
  'C',
  '1B',
  '2B',
  '3B',
  'SS',
  'LF',
  'CF',
  'RF',
  'OF',
  'IF',
  'DH',
  'P',
  'RHP',
  'LHP',
];
const updateTypes: ProspectUpdateType[] = [
  'promotion',
  'stats',
  'injury',
  'trade',
  'signing',
];

const teamNames: Record<ProspectLevel, string> = {
  AAA: 'Tacoma Rainiers',
  AA: 'Arkansas Travelers',
  'A+': 'Everett AquaSox',
  A: 'Modesto Nuts',
  Rookie: 'ACL Mariners',
  DSL: 'DSL Mariners',
};

function ProspectForm({
  prospect,
  onSave,
  onCancel,
  isLoading,
}: {
  prospect?: Prospect;
  onSave: (data: Partial<Prospect>) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<Partial<Prospect>>(
    prospect || {
      name: '',
      position: 'OF',
      level: 'A',
      team_name: teamNames['A'],
      age: 20,
      bats: 'R',
      throws: 'R',
      stats: {},
      is_featured: false,
      scouting_grades: {
        hit: 50,
        power: 50,
        speed: 50,
        arm: 50,
        field: 50,
        overall: 50,
      },
    }
  );

  const isPitcher =
    formData.position === 'P' ||
    formData.position === 'RHP' ||
    formData.position === 'LHP';

  const handleLevelChange = (level: ProspectLevel) => {
    setFormData({
      ...formData,
      level,
      team_name: teamNames[level],
    });
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Name *</label>
          <Input
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Player Name"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Position *</label>
          <select
            value={formData.position}
            onChange={(e) =>
              setFormData({ ...formData, position: e.target.value })
            }
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {positions.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Level *</label>
          <select
            value={formData.level}
            onChange={(e) => handleLevelChange(e.target.value as ProspectLevel)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {levels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Team</label>
          <Input
            value={formData.team_name || ''}
            onChange={(e) =>
              setFormData({ ...formData, team_name: e.target.value })
            }
          />
        </div>
        <div>
          <label className="text-sm font-medium">Age</label>
          <Input
            type="number"
            value={formData.age || ''}
            onChange={(e) =>
              setFormData({ ...formData, age: parseInt(e.target.value) })
            }
          />
        </div>
        <div>
          <label className="text-sm font-medium">Ranking</label>
          <Input
            type="number"
            value={formData.ranking || ''}
            onChange={(e) =>
              setFormData({ ...formData, ranking: parseInt(e.target.value) })
            }
            placeholder="Organization rank"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Bats</label>
          <select
            value={formData.bats}
            onChange={(e) =>
              setFormData({
                ...formData,
                bats: e.target.value as 'L' | 'R' | 'S',
              })
            }
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="R">Right</option>
            <option value="L">Left</option>
            <option value="S">Switch</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Throws</label>
          <select
            value={formData.throws}
            onChange={(e) =>
              setFormData({ ...formData, throws: e.target.value as 'L' | 'R' })
            }
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="R">Right</option>
            <option value="L">Left</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">ETA</label>
          <Input
            value={formData.eta || ''}
            onChange={(e) => setFormData({ ...formData, eta: e.target.value })}
            placeholder="2027"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Photo URL</label>
          <Input
            value={formData.photo_url || ''}
            onChange={(e) =>
              setFormData({ ...formData, photo_url: e.target.value })
            }
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {isPitcher ? 'Pitching Stats' : 'Batting Stats'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {isPitcher ? (
              <>
                <div>
                  <label className="text-sm font-medium">ERA</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.stats?.era || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stats: {
                          ...formData.stats,
                          era: parseFloat(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Wins</label>
                  <Input
                    type="number"
                    value={formData.stats?.wins || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stats: {
                          ...formData.stats,
                          wins: parseInt(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Strikeouts</label>
                  <Input
                    type="number"
                    value={formData.stats?.strikeouts || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stats: {
                          ...formData.stats,
                          strikeouts: parseInt(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">WHIP</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.stats?.whip || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stats: {
                          ...formData.stats,
                          whip: parseFloat(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium">AVG</label>
                  <Input
                    type="number"
                    step="0.001"
                    value={formData.stats?.avg || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stats: {
                          ...formData.stats,
                          avg: parseFloat(e.target.value),
                        },
                      })
                    }
                    placeholder="0.275"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">HR</label>
                  <Input
                    type="number"
                    value={formData.stats?.hr || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stats: {
                          ...formData.stats,
                          hr: parseInt(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">RBI</label>
                  <Input
                    type="number"
                    value={formData.stats?.rbi || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stats: {
                          ...formData.stats,
                          rbi: parseInt(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">SB</label>
                  <Input
                    type="number"
                    value={formData.stats?.sb || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stats: {
                          ...formData.stats,
                          sb: parseInt(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scouting Grades */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Scouting Grades (20-80)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {['hit', 'power', 'speed', 'arm', 'field', 'overall'].map(
              (grade) => (
                <div key={grade}>
                  <label className="text-sm font-medium capitalize">
                    {grade}
                  </label>
                  <Input
                    type="number"
                    min="20"
                    max="80"
                    step="5"
                    value={
                      formData.scouting_grades?.[
                        grade as keyof typeof formData.scouting_grades
                      ] || ''
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scouting_grades: {
                          ...formData.scouting_grades,
                          [grade]: parseInt(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <div>
        <label className="text-sm font-medium">Scouting Report</label>
        <Textarea
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Detailed scouting notes..."
          rows={4}
        />
      </div>

      {/* Featured Toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="featured"
          checked={formData.is_featured || false}
          onChange={(e) =>
            setFormData({ ...formData, is_featured: e.target.checked })
          }
          className="h-4 w-4 rounded border-input"
        />
        <label htmlFor="featured" className="text-sm font-medium">
          Featured Prospect
        </label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button
          variant="mariners"
          onClick={() => onSave(formData)}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Prospect
        </Button>
      </div>
    </div>
  );
}

function UpdateForm({
  prospects,
  onSave,
  onCancel,
  isLoading,
}: {
  prospects: Prospect[];
  onSave: (data: Partial<ProspectUpdate>) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<Partial<ProspectUpdate>>({
    prospect_id: prospects[0]?.id || '',
    update_type: 'stats',
    title: '',
    description: '',
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Prospect</label>
        <select
          value={formData.prospect_id}
          onChange={(e) =>
            setFormData({ ...formData, prospect_id: e.target.value })
          }
          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          {prospects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.level})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">Update Type</label>
        <select
          value={formData.update_type}
          onChange={(e) =>
            setFormData({
              ...formData,
              update_type: e.target.value as ProspectUpdateType,
            })
          }
          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          {updateTypes.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">Title</label>
        <Input
          value={formData.title || ''}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Update headline"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Description</label>
        <Textarea
          value={formData.description || ''}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Full update details..."
          rows={3}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          variant="mariners"
          onClick={() => onSave(formData)}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Add Update
        </Button>
      </div>
    </div>
  );
}

export function ProspectsAdmin({ adminPassword }: ProspectsAdminProps) {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProspects();
  }, []);

  async function fetchProspects() {
    setLoading(true);
    try {
      const res = await fetch('/api/prospects');
      const data = await res.json();
      if (data.prospects) {
        setProspects(data.prospects);
      }
    } catch (error) {
      console.error('Failed to fetch prospects:', error);
    }
    setLoading(false);
  }

  async function handleSaveProspect(data: Partial<Prospect>) {
    setSaving(true);
    try {
      const method = editingProspect ? 'PUT' : 'POST';
      const body = editingProspect
        ? { password: adminPassword, id: editingProspect.id, updates: data }
        : { password: adminPassword, prospect: data };

      const res = await fetch('/api/prospects', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await res.json();
      if (result.success) {
        await fetchProspects();
        setShowAddForm(false);
        setEditingProspect(null);
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to save prospect:', error);
      alert('Failed to save prospect');
    }
    setSaving(false);
  }

  async function handleDeleteProspect(id: string) {
    if (!confirm('Are you sure you want to delete this prospect?')) return;

    try {
      const res = await fetch(
        `/api/prospects?id=${id}&password=${adminPassword}`,
        { method: 'DELETE' }
      );
      const result = await res.json();
      if (result.success) {
        await fetchProspects();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Failed to delete prospect:', error);
    }
  }

  async function handleMoveRanking(id: string, direction: 'up' | 'down') {
    const index = prospects.findIndex((p) => p.id === id);
    if (index === -1) return;

    const newProspects = [...prospects];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;

    if (swapIndex < 0 || swapIndex >= newProspects.length) return;

    // Swap rankings
    const tempRanking = newProspects[index].ranking;
    newProspects[index].ranking = newProspects[swapIndex].ranking;
    newProspects[swapIndex].ranking = tempRanking;

    // Sort by ranking
    newProspects.sort((a, b) => (a.ranking || 999) - (b.ranking || 999));
    setProspects(newProspects);

    // In a real app, save to database
  }

  async function handleAddUpdate(data: Partial<ProspectUpdate>) {
    setSaving(true);
    // In a real app, save to database
    console.log('Adding update:', data);
    setShowUpdateForm(false);
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-mariners-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="prospects">
        <TabsList>
          <TabsTrigger value="prospects">
            <User className="mr-2 h-4 w-4" />
            Prospects
          </TabsTrigger>
          <TabsTrigger value="updates">
            <FileText className="mr-2 h-4 w-4" />
            Updates
          </TabsTrigger>
          <TabsTrigger value="import">
            <Upload className="mr-2 h-4 w-4" />
            Bulk Import
          </TabsTrigger>
        </TabsList>

        {/* Prospects Management */}
        <TabsContent value="prospects" className="mt-6">
          {showAddForm || editingProspect ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingProspect ? 'Edit Prospect' : 'Add New Prospect'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProspectForm
                  prospect={editingProspect || undefined}
                  onSave={handleSaveProspect}
                  onCancel={() => {
                    setShowAddForm(false);
                    setEditingProspect(null);
                  }}
                  isLoading={saving}
                />
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <p className="text-muted-foreground">
                  {prospects.length} prospects in system
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={fetchProspects}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                  <Button variant="mariners" onClick={() => setShowAddForm(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Prospect
                  </Button>
                </div>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {prospects.map((prospect, index) => (
                      <div
                        key={prospect.id}
                        className="flex items-center gap-4 p-4 hover:bg-muted/50"
                      >
                        {/* Drag Handle & Ranking */}
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-muted-foreground" />
                          <div className="w-8 h-8 rounded-full bg-mariners-gold text-mariners-navy flex items-center justify-center font-bold text-sm">
                            {prospect.ranking || '-'}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">
                              {prospect.name}
                            </p>
                            {prospect.is_featured && (
                              <Badge variant="mariners">Featured</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {prospect.position} - {prospect.level} -{' '}
                            {prospect.team_name}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveRanking(prospect.id, 'up')}
                            disabled={index === 0}
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleMoveRanking(prospect.id, 'down')
                            }
                            disabled={index === prospects.length - 1}
                          >
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingProspect(prospect)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteProspect(prospect.id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Updates Management */}
        <TabsContent value="updates" className="mt-6">
          {showUpdateForm ? (
            <Card>
              <CardHeader>
                <CardTitle>Add Prospect Update</CardTitle>
              </CardHeader>
              <CardContent>
                <UpdateForm
                  prospects={prospects}
                  onSave={handleAddUpdate}
                  onCancel={() => setShowUpdateForm(false)}
                  isLoading={saving}
                />
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <p className="text-muted-foreground">
                  Manage prospect news and updates
                </p>
                <Button
                  variant="mariners"
                  onClick={() => setShowUpdateForm(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Update
                </Button>
              </div>

              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No updates to display</p>
                  <p className="text-sm">
                    Add updates to track promotions, stats, injuries, and more
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Bulk Import */}
        <TabsContent value="import" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Import</CardTitle>
              <CardDescription>
                Import prospects from CSV or JSON file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="font-medium mb-2">
                  Drag and drop your file here, or click to browse
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports CSV and JSON formats
                </p>
                <input
                  type="file"
                  accept=".csv,.json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      console.log('File selected:', file.name);
                      // Handle file import
                    }
                  }}
                />
              </div>

              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">Expected CSV format:</p>
                <code className="block bg-muted p-2 rounded text-xs">
                  name,position,level,age,bats,throws,ranking,eta
                </code>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
