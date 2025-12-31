import { useState, useEffect } from 'react';
import { reportService, DailyReport, MonthlyReport, BestSeller } from '@/lib/api-services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function Reports() {
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [bestSellers, setBestSellers] = useState<BestSeller[]>([]);
  const [loading, setLoading] = useState(false);

  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);
  const [monthlyYear, setMonthlyYear] = useState(new Date().getFullYear());
  const [monthlyMonth, setMonthlyMonth] = useState(new Date().getMonth() + 1);
  const [bestSellerLimit, setBestSellerLimit] = useState(10);
  const [bestSellerStartDate, setBestSellerStartDate] = useState('');
  const [bestSellerEndDate, setBestSellerEndDate] = useState('');

  const loadDailyReport = async () => {
    try {
      setLoading(true);
      const response = await reportService.getDaily(dailyDate);
      setDailyReport(response.data);
    } catch (error) {
      console.error('Failed to load daily report:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyReport = async () => {
    try {
      setLoading(true);
      const response = await reportService.getMonthly(monthlyYear, monthlyMonth);
      setMonthlyReport(response.data);
    } catch (error) {
      console.error('Failed to load monthly report:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBestSellers = async () => {
    try {
      setLoading(true);
      const response = await reportService.getBestSellers(
        bestSellerLimit,
        bestSellerStartDate || undefined,
        bestSellerEndDate || undefined
      );
      setBestSellers(response.data);
    } catch (error) {
      console.error('Failed to load best sellers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDailyReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyDate]);

  useEffect(() => {
    loadMonthlyReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthlyYear, monthlyMonth]);

  useEffect(() => {
    loadBestSellers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bestSellerLimit, bestSellerStartDate, bestSellerEndDate]);

  const dailyHourlyData = dailyReport
    ? Object.entries(dailyReport.hourlySales || {}).map(([hour, sales]) => ({
        hour: `${hour}:00`,
        sales,
      }))
    : [];

  const monthlyDailyData = monthlyReport
    ? Object.entries(monthlyReport.dailySales || {}).map(([date, sales]) => ({
        date: new Date(date).getDate(),
        sales,
      }))
    : [];

  const monthlyCategoryData = monthlyReport
    ? Object.entries(monthlyReport.categorySales || {}).map(([category, sales]) => ({
        category,
        sales,
      }))
    : [];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">Daily Report</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Report</TabsTrigger>
          <TabsTrigger value="best-seller">Best Sellers</TabsTrigger>
        </TabsList>

        {/* Daily Report */}
        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-end">
                <div className="flex items-center gap-2">
                  <Label htmlFor="daily-date">Date:</Label>
                  <Input
                    id="daily-date"
                    type="date"
                    value={dailyDate}
                    onChange={(e) => setDailyDate(e.target.value)}
                    className="w-40"
                  />
                  <Button onClick={loadDailyReport} disabled={loading}>
                    Load
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : dailyReport ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Total Sales</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(dailyReport.summary.totalSales)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Total Transactions</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {dailyReport.summary.totalTransactions}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Average Transaction</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(dailyReport.summary.averageTransaction)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Hourly Sales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {dailyHourlyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={dailyHourlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="hour" />
                            <YAxis />
                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                            <Bar dataKey="sales" fill="hsl(var(--primary))" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          No hourly sales data available
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Methods</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(dailyReport.paymentMethods || {}).map(
                          ([method, amount]) => (
                            <div
                              key={method}
                              className="flex items-center justify-between p-2 rounded-lg bg-muted"
                            >
                              <span className="font-medium">{method}</span>
                              <span className="font-bold">{formatCurrency(amount)}</span>
                            </div>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No data available for selected date
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Report */}
        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Monthly Report</CardTitle>
                  <CardDescription>Sales report for a specific month</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={monthlyYear}
                    onChange={(e) => setMonthlyYear(parseInt(e.target.value))}
                    className="w-24"
                    min="2020"
                    max="2100"
                  />
                  <Input
                    type="number"
                    value={monthlyMonth}
                    onChange={(e) => setMonthlyMonth(parseInt(e.target.value))}
                    className="w-20"
                    min="1"
                    max="12"
                  />
                  <Button onClick={loadMonthlyReport} disabled={loading}>
                    Load
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : monthlyReport ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Total Sales</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(monthlyReport.summary.totalSales)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Total Transactions</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {monthlyReport.summary.totalTransactions}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Average Transaction</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(monthlyReport.summary.averageTransaction)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Daily Sales Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {monthlyDailyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={monthlyDailyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                            <Line
                              type="monotone"
                              dataKey="sales"
                              stroke="hsl(var(--primary))"
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          No daily sales data available
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Category Sales</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {monthlyCategoryData.length > 0 ? (
                          <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={monthlyCategoryData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="category" />
                              <YAxis />
                              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                              <Bar dataKey="sales" fill="hsl(var(--primary))" />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-center text-muted-foreground py-8">
                            No category data
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Best Sellers</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {monthlyReport.bestSellers?.slice(0, 5).map((item) => (
                            <div
                              key={item.rank}
                              className="flex items-center justify-between p-2 rounded-lg bg-muted"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-primary">#{item.rank}</span>
                                <span>{item.name}</span>
                              </div>
                              <div className="text-right">
                                <div className="font-bold">{formatCurrency(item.revenue)}</div>
                                <div className="text-xs text-muted-foreground">
                                  {item.qty} sold
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No data available for selected month
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Best Sellers */}
        <TabsContent value="best-seller" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Best Sellers</CardTitle>
                  <CardDescription>Top selling products</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="limit">Limit:</Label>
                    <Input
                      id="limit"
                      type="number"
                      value={bestSellerLimit}
                      onChange={(e) => setBestSellerLimit(parseInt(e.target.value) || 10)}
                      min="1"
                      max="50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="best-seller-start">Start Date:</Label>
                    <Input
                      id="best-seller-start"
                      type="date"
                      value={bestSellerStartDate}
                      onChange={(e) => setBestSellerStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="best-seller-end">End Date:</Label>
                    <Input
                      id="best-seller-end"
                      type="date"
                      value={bestSellerEndDate}
                      onChange={(e) => setBestSellerEndDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 flex items-end">
                    <Button onClick={loadBestSellers} disabled={loading} className="w-full">
                      Load
                    </Button>
                  </div>
                </div>
              </div>
              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : bestSellers.length > 0 ? (
                <div className="space-y-2">
                  {bestSellers.map((item) => (
                    <Card key={item.rank}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                              <span className="text-lg font-bold text-primary">
                                #{item.rank}
                              </span>
                            </div>
                            <div>
                              <div className="font-semibold text-lg">{item.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.qty} items sold
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">
                              {formatCurrency(item.revenue)}
                            </div>
                            <div className="text-sm text-muted-foreground">Revenue</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No best seller data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

