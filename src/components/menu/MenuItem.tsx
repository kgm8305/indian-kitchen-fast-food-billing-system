import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MenuItem as MenuItemType } from '@/types';
import { Pencil, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent } from '@/components/ui/dialog';
import MenuForm from './MenuForm';

interface MenuItemProps {
  item: MenuItemType;
}

const MenuItem: React.FC<MenuItemProps> = ({ item }) => {
  const { deleteMenuItem } = useData();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleDelete = () => {
    deleteMenuItem(item.id);
    setShowDeleteAlert(false);
  };

  return (
    <>
      <Card className="overflow-hidden">
        <div className="aspect-square overflow-hidden">
          <img 
            src={item.imageUrl} 
            alt={item.name} 
            className="w-full h-full object-cover transition-transform hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://placehold.co/300x300?text=Image+Not+Found';
            }}
          />
        </div>
        <CardHeader className="pt-4 pb-2">
          <CardTitle className="flex justify-between items-center">
            <span className="line-clamp-1 font-medium">{item.name}</span>
            <span className="text-lg font-bold">₹{item.price.toFixed(2)}</span>
          </CardTitle>
          <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{item.category}</span>
        </CardHeader>
        <CardContent className="pb-2">
          <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
        </CardContent>
        <CardFooter className="flex justify-between pt-0">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-brand-teal border-brand-teal hover:bg-brand-teal/10"
            onClick={() => setShowEditDialog(true)}
          >
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-red-500 border-red-200 hover:bg-red-50"
            onClick={() => setShowDeleteAlert(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{item.name}" from the menu.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <MenuForm item={item} onClose={() => setShowEditDialog(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MenuItem;
