import { useState, useEffect, useCallback } from 'react';
import {
  holidayService,
  Holiday,
  CreateHolidayData,
} from '@/lib/api-services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

export function HolidayManagement() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const { toast } = useToast();

  // Filters
  const [filterType, setFilterType] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());

  const [formData, setFormData] = useState<CreateHolidayData>({
    date: '',
    name: '',
    type: 'NATIONAL',
    description: '',
    isRecurring: false,
  });

  const loadHolidays = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterType) params.type = filterType;
      if (filterYear) params.year = filterYear;

      const response = await holidayService.getAll(params);
      setHolidays(response.data);
    } catch (error) {
      console.error('Failed to load holidays:', error);
      toast({
        title: 'Error',
        description: 'Failed to load holidays',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filterType, filterYear, toast]);

  useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  const handleOpenDialog = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      date: today,
      name: '',
      type: 'NATIONAL',
      description: '',
      isRecurring: false,
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      date: '',
      name: '',
      type: 'NATIONAL',
      description: '',
      isRecurring: false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await holidayService.create(formData);
      handleCloseDialog();
      toast({
        title: 'Success',
        description: 'Holiday created successfully',
      });
      loadHolidays();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast({
        title: 'Error',
        description: err.response?.data?.error || 'Failed to create holiday',
        variant: 'destructive',
      });
    }
  };

  const handleOpenEditDialog = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      date: holiday.date,
      name: holiday.name,
      type: holiday.type,
      description: holiday.description || '',
      isRecurring: holiday.isRecurring,
    });
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setEditingHoliday(null);
    setFormData({
      date: '',
      name: '',
      type: 'NATIONAL',
      description: '',
      isRecurring: false,
    });
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHoliday) return;

    try {
      await holidayService.update(editingHoliday._id, formData);
      handleCloseEditDialog();
      toast({
        title: 'Success',
        description: 'Holiday updated successfully',
      });
      loadHolidays();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast({
        title: 'Error',
        description: err.response?.data?.error || 'Failed to update holiday',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this holiday?')) return;

    try {
      await holidayService.delete(id);
      toast({
        title: 'Success',
        description: 'Holiday deleted successfully',
      });
      loadHolidays();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast({
        title: 'Error',
        description: err.response?.data?.error || 'Failed to delete holiday',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Holiday Management</h2>
          <p className="text-muted-foreground">
            Manage national and store holidays
          </p>
        </div>
        <Button onClick={handleOpenDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Holiday
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle>Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filter-type">Type</Label>
              <Select value={filterType || undefined} onValueChange={setFilterType}>
                <SelectTrigger id="filter-type">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NATIONAL">National</SelectItem>
                  <SelectItem value="STORE">Store</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-year">Year</Label>
              <Input
                id="filter-year"
                type="number"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                placeholder="Year"
                min="2020"
                max="2100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Holidays Table */}
      <Card>
        <CardHeader>
          <CardTitle>Holidays</CardTitle>
          <CardDescription>
            List of all holidays ({holidays.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading holidays...</p>
            </div>
          ) : holidays.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No holidays found. Add your first holiday to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Recurring</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holidays.map((holiday) => (
                    <TableRow key={holiday._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{formatDate(holiday.date)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{holiday.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={holiday.type === 'NATIONAL' ? 'default' : 'secondary'}
                        >
                          {holiday.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {holiday.isRecurring ? (
                          <Badge variant="outline">Yes</Badge>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {holiday.description || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditDialog(holiday)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(holiday._id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Holiday Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Holiday</DialogTitle>
            <DialogDescription>
              Add a new national or store holiday
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="holiday-date">Date *</Label>
                <Input
                  id="holiday-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="holiday-name">Name *</Label>
                <Input
                  id="holiday-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Idul Fitri"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="holiday-type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'NATIONAL' | 'STORE') =>
                    setFormData({ ...formData, type: value })
                  }
                  required
                >
                  <SelectTrigger id="holiday-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NATIONAL">National</SelectItem>
                    <SelectItem value="STORE">Store</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="holiday-description">Description</Label>
                <Input
                  id="holiday-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="holiday-recurring">Recurring (Yearly)</Label>
                <Switch
                  id="holiday-recurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isRecurring: checked })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">Add Holiday</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Holiday Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Holiday</DialogTitle>
            <DialogDescription>
              Update holiday details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-holiday-date">Date *</Label>
                <Input
                  id="edit-holiday-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-holiday-name">Name *</Label>
                <Input
                  id="edit-holiday-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-holiday-type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'NATIONAL' | 'STORE') =>
                    setFormData({ ...formData, type: value })
                  }
                  required
                >
                  <SelectTrigger id="edit-holiday-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NATIONAL">National</SelectItem>
                    <SelectItem value="STORE">Store</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-holiday-description">Description</Label>
                <Input
                  id="edit-holiday-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-holiday-recurring">Recurring (Yearly)</Label>
                <Switch
                  id="edit-holiday-recurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isRecurring: checked })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseEditDialog}>
                Cancel
              </Button>
              <Button type="submit">Update Holiday</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

