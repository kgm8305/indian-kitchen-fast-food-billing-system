
import { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import MainLayout from '@/components/layout/MainLayout';
import MenuItem from '@/components/menu/MenuItem';
import MenuForm from '@/components/menu/MenuForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const MenuManagement = () => {
  const { menuItems, refreshMenuItems } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  // Refresh menu items when component mounts
  useEffect(() => {
    refreshMenuItems();
  }, []);
  
  // Filter menu items based on search term
  const filteredItems = menuItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCloseDialog = async () => {
    setShowAddDialog(false);
    // Refresh menu items after dialog is closed to ensure new items are displayed
    await refreshMenuItems();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Menu Management</h1>
          <Button 
            onClick={() => setShowAddDialog(true)}
            className="bg-brand-orange hover:bg-brand-orange/90"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add New Item
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {filteredItems.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-lg border">
            {searchTerm ? (
              <p className="text-muted-foreground">No items found matching "{searchTerm}"</p>
            ) : (
              <p className="text-muted-foreground">No menu items yet. Add your first item!</p>
            )}
          </div>
        ) : (
          <div className="menu-grid">
            {filteredItems.map(item => (
              <MenuItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
      
      {/* Add Menu Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <MenuForm onClose={handleCloseDialog} />
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default MenuManagement;
