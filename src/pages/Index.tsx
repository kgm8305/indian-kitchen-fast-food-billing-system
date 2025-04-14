
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { seedDemoUsers } from '@/utils/initializeDatabase';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize the database with demo users
    const initDb = async () => {
      try {
        console.log("Initializing database...");
        await seedDemoUsers();
        console.log("Database initialization complete.");
      } catch (error) {
        console.error('Error initializing database:', error);
      }
    };
    
    initDb();
    
    // Redirect to login page
    navigate('/login');
  }, [navigate]);

  return null;
};

export default Index;
