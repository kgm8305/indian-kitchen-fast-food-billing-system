
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserRole } from '@/types';
import { RefreshCw, Search, Download } from 'lucide-react';

type UserProfile = {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
};

const UserManagement = () => {
  const { toast } = useToast();
  const { user: currentUser, refreshUserProfile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [updatingUsers, setUpdatingUsers] = useState<Set<string>>(new Set());
  const [downloadingReport, setDownloadingReport] = useState(false);
  
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      console.log("Fetched users:", data);
      setUsers(data as UserProfile[]);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error fetching users",
        description: "Could not load user data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const updateUserRole = async (userId: string, newRole: UserRole) => {
    if (updatingUsers.has(userId)) return; // Prevent multiple updates
    
    setUpdatingUsers(prev => new Set(prev).add(userId));
    
    try {
      console.log(`Updating user ${userId} to role ${newRole}`);
      
      // First check if the role actually changed
      const userToUpdate = users.find(user => user.id === userId);
      
      if (userToUpdate && userToUpdate.role === newRole) {
        console.log('Role unchanged, skipping update');
        setUpdatingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
        return;
      }
      
      // Update the profile in the database
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log('Role update successful in database');
      
      // Update the local state immediately
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
      
      toast({
        title: "Role Updated",
        description: `User role has been updated to ${newRole}`,
      });
      
      // If the user being updated is the current user, refresh their profile
      if (currentUser && userId === currentUser.id) {
        console.log("Updating current user's role, refreshing profile");
        
        // Force a short delay to ensure the database update completes
        setTimeout(async () => {
          await refreshUserProfile();
          
          // Check if the profile was actually updated
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();
            
          if (error) {
            console.error("Error verifying role update:", error);
          } else {
            console.log("Verified role in database is now:", data.role);
            
            // If the role in the database doesn't match the new role, try again
            if (data.role !== newRole) {
              console.warn("Role update didn't take effect, retrying...");
              
              // Try one more direct update
              await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);
                
              // Refresh the user profile again
              await refreshUserProfile();
            }
          }
        }, 500);
      }
      
      // Force refresh to ensure we get the latest data
      await fetchUsers();
      
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error updating role",
        description: error.message || "Failed to update user role. Please try again.",
        variant: "destructive",
      });
      
      // Force refresh to get the latest data
      fetchUsers();
    } finally {
      setUpdatingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };
  
  const downloadUserReport = async () => {
    try {
      setDownloadingReport(true);
      
      // Fetch all users for the report
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Prepare CSV data
      const headers = ['Email', 'Role', 'Created At'];
      const csvRows = [
        headers.join(','),
        ...data.map((user: UserProfile) => {
          const created = new Date(user.created_at).toLocaleDateString();
          return [
            user.email,
            user.role,
            created
          ].join(',');
        })
      ];
      const csvContent = csvRows.join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `user-report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Report Downloaded",
        description: "User report has been downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: "Error Downloading Report",
        description: "Failed to download user report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingReport(false);
    }
  };
  
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });
  
  const getRoleBadgeVariant = (role: UserRole) => {
    switch(role) {
      case 'admin': return 'default';
      case 'manager': return 'secondary';
      case 'cashier': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">User Management</h1>
          <div className="flex gap-2">
            {currentUser?.role === 'admin' && (
              <Button 
                onClick={downloadUserReport} 
                variant="secondary" 
                size="sm"
                disabled={downloadingReport}
              >
                <Download className={`h-4 w-4 mr-2 ${downloadingReport ? 'animate-spin' : ''}`} />
                Download Report
              </Button>
            )}
            <Button 
              onClick={fetchUsers} 
              variant="outline" 
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as UserRole | 'all')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="cashier">Cashier</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-10 bg-white rounded-lg border">
            <div className="flex flex-col items-center justify-center space-y-4">
              <RefreshCw className="h-10 w-10 animate-spin text-gray-400" />
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border shadow">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Change Role</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No users found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(value) => updateUserRole(user.id, value as UserRole)}
                          disabled={updatingUsers.has(user.id)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="cashier">Cashier</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default UserManagement;
