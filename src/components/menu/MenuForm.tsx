import { useState, useEffect } from 'react';
import { useData, FOOD_CATEGORIES } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MenuItem } from '@/types';
import { toast } from '@/hooks/use-toast';

interface MenuFormProps {
  item?: MenuItem;
  onClose: () => void;
}

const MenuForm: React.FC<MenuFormProps> = ({ item, onClose }) => {
  const { addMenuItem, updateMenuItem } = useData();
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [price, setPrice] = useState(item?.price?.toString() || '');
  const [category, setCategory] = useState(item?.category || FOOD_CATEGORIES[0]);
  const [imageUrl, setImageUrl] = useState(item?.imageUrl || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item?.imageUrl) {
      setImagePreview(item.imageUrl);
    }
  }, [item]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!price.trim()) newErrors.price = 'Price is required';
    else if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      newErrors.price = 'Price must be a positive number';
    }
    if (!category) newErrors.category = 'Category is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateImage = (url: string): boolean => {
    if (!url.trim()) return true;
    
    return true;
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImageUrl(url);
    
    if (url) {
      if (validateImage(url)) {
        setImagePreview(url);
        setErrors(prev => ({ ...prev, imageUrl: '' }));
      } else {
        setImagePreview('https://placehold.co/300x300?text=Invalid+Image+URL');
        setErrors(prev => ({ ...prev, imageUrl: 'Invalid image URL format' }));
      }
    } else {
      setImagePreview('');
      setErrors(prev => ({ ...prev, imageUrl: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    const menuItemData = {
      name,
      description,
      price: parseFloat(price),
      category,
      imageUrl: imageUrl || 'https://placehold.co/300x300?text=No+Image',
    };
    
    try {
      if (item) {
        const success = await updateMenuItem(item.id, menuItemData);
        
        if (success) {
          toast({
            title: "Menu item updated",
            description: `${name} has been updated successfully.`
          });
          
          onClose();
        } else {
          throw new Error("Failed to update menu item");
        }
      } else {
        await addMenuItem(menuItemData);
        
        toast({
          title: "Menu item added",
          description: `${name} has been added successfully.`
        });
        
        onClose();
      }
    } catch (error: any) {
      console.error("Error saving menu item:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save menu item. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{item ? 'Edit Menu Item' : 'Add New Menu Item'}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Cheeseburger"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Delicious burger with cheese..."
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="price">Price (₹)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="99.99"
              className={errors.price ? 'border-red-500' : ''}
            />
            {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {FOOD_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL (optional)</Label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={handleImageUrlChange}
              placeholder="https://example.com/image.jpg"
              className={errors.imageUrl ? 'border-red-500' : ''}
            />
            {errors.imageUrl && <p className="text-xs text-red-500">{errors.imageUrl}</p>}
            
            {imagePreview && (
              <div className="mt-2">
                <p className="text-sm mb-1">Preview:</p>
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="h-40 w-40 object-cover rounded-md border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/300x300?text=Image+Not+Found';
                  }}
                />
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-brand-orange hover:bg-brand-orange/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : (item ? 'Update Item' : 'Add Item')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default MenuForm;
