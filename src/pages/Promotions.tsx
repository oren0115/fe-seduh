import { useState, useEffect } from 'react';
import { promotionService, Promotion, CreatePromotionData } from '@/lib/api-services';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, Tag, CheckCircle2, XCircle } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function Promotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);

  const [formData, setFormData] = useState<CreatePromotionData>({
    name: '',
    description: '',
    isActive: true,
    validFrom: new Date().toISOString().slice(0, 16),
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    conditions: {},
    discount: {
      type: 'PERCENTAGE',
      value: 10,
    },
    priority: 0,
    stackable: false,
  });

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const response = await promotionService.getAll();
      setPromotions(response.data);
    } catch (error) {
      console.error('Failed to load promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (promotion?: Promotion) => {
    if (promotion) {
      setEditingPromotion(promotion);
      setFormData({
        name: promotion.name,
        description: promotion.description || '',
        isActive: promotion.isActive,
        validFrom: new Date(promotion.validFrom).toISOString().slice(0, 16),
        validUntil: new Date(promotion.validUntil).toISOString().slice(0, 16),
        conditions: promotion.conditions,
        discount: promotion.discount,
        priority: promotion.priority,
        stackable: promotion.stackable,
      });
    } else {
      setEditingPromotion(null);
      setFormData({
        name: '',
        description: '',
        isActive: true,
        validFrom: new Date().toISOString().slice(0, 16),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        conditions: {},
        discount: {
          type: 'PERCENTAGE',
          value: 10,
        },
        priority: 0,
        stackable: false,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPromotion(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        validFrom: new Date(formData.validFrom).toISOString(),
        validUntil: new Date(formData.validUntil).toISOString(),
      };

      if (editingPromotion) {
        await promotionService.update(editingPromotion._id, dataToSend);
      } else {
        await promotionService.create(dataToSend);
      }

      handleCloseDialog();
      loadPromotions();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      alert(err.response?.data?.error || 'Failed to save promotion');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return;

    try {
      await promotionService.delete(id);
      loadPromotions();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      alert(err.response?.data?.error || 'Failed to delete promotion');
    }
  };

  const isActive = (promo: Promotion) => {
    const now = new Date();
    return (
      promo.isActive &&
      new Date(promo.validFrom) <= now &&
      new Date(promo.validUntil) >= now
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Promotion
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : promotions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No promotions found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {promotions.map((promotion) => (
            <Card key={promotion._id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {promotion.name}
                      {isActive(promotion) ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      )}
                    </CardTitle>
                    <CardDescription>
                      {promotion.description || 'No description'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(promotion)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(promotion._id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Discount</p>
                  <p className="text-xl font-bold">
                    {promotion.discount.type === 'PERCENTAGE'
                      ? `${promotion.discount.value}%`
                      : formatCurrency(promotion.discount.value)}
                    {promotion.discount.maxDiscount &&
                      promotion.discount.type === 'PERCENTAGE' && (
                        <span className="text-sm text-muted-foreground ml-2">
                          (max {formatCurrency(promotion.discount.maxDiscount)})
                        </span>
                      )}
                  </p>
                </div>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Valid:</span>{' '}
                    {formatDate(promotion.validFrom)} - {formatDate(promotion.validUntil)}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Priority:</span> {promotion.priority}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Stackable:</span>{' '}
                    {promotion.stackable ? 'Yes' : 'No'}
                  </p>
                </div>
                {promotion.conditions.minTransactionAmount && (
                  <div className="p-2 rounded-lg bg-muted text-sm">
                    Min transaction: {formatCurrency(promotion.conditions.minTransactionAmount)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPromotion ? 'Edit Promotion' : 'Create Promotion'}
            </DialogTitle>
            <DialogDescription>
              {editingPromotion
                ? 'Update promotion details'
                : 'Create a new promotion or discount'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="validFrom">Valid From *</Label>
                  <Input
                    id="validFrom"
                    type="datetime-local"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validUntil">Valid Until *</Label>
                  <Input
                    id="validUntil"
                    type="datetime-local"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discountType">Discount Type *</Label>
                  <Select
                    value={formData.discount.type}
                    onValueChange={(value: 'PERCENTAGE' | 'FIXED') =>
                      setFormData({
                        ...formData,
                        discount: { ...formData.discount, type: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                      <SelectItem value="FIXED">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountValue">Discount Value *</Label>
                  <Input
                    id="discountValue"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discount.value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount: {
                          ...formData.discount,
                          value: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    required
                  />
                </div>
              </div>
              {formData.discount.type === 'PERCENTAGE' && (
                <div className="space-y-2">
                  <Label htmlFor="maxDiscount">Max Discount (optional)</Label>
                  <Input
                    id="maxDiscount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discount.maxDiscount || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount: {
                          ...formData.discount,
                          maxDiscount: e.target.value ? parseFloat(e.target.value) : undefined,
                        },
                      })
                    }
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="minTransactionAmount">Min Transaction Amount (optional)</Label>
                <Input
                  id="minTransactionAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.conditions?.minTransactionAmount || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        minTransactionAmount: e.target.value
                          ? parseFloat(e.target.value)
                          : undefined,
                      },
                    })
                  }
                />
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="stackable"
                    checked={formData.stackable}
                    onChange={(e) => setFormData({ ...formData, stackable: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="stackable">Stackable</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {editingPromotion ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

