
import { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DailyReports from '@/components/reports/DailyReports';
import LiveReports from '@/components/reports/LiveReports';

const Reports = () => {
  const [activeTab, setActiveTab] = useState<string>('daily');

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Reports</h1>
        </div>
        
        <Tabs defaultValue="daily" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="daily">Daily Reports</TabsTrigger>
            <TabsTrigger value="live">Live Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="daily">
            <DailyReports />
          </TabsContent>
          
          <TabsContent value="live">
            <LiveReports />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Reports;
