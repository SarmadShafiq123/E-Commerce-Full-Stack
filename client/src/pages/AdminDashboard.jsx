import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import Spinner from '../components/Spinner';
import AdminSidebar from '../components/AdminSidebar';
import BarChart from '../components/charts/BarChart';
import LineChart from '../components/charts/LineChart';
import DonutChart from '../components/charts/DonutChart';

// ─── helpers ────────────────────────────────────────────────────────────────

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Fill in missing months so charts always show 6 bars */
const fillMonths = (raw, valueKey = 'revenue') => {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const found = raw.find((r) => r._id.year === d.getFullYear() && r._id.month === d.getMonth() + 1);
    return { label: MONTH_NAMES[d.getMonth()], value: found ? found[valueKey] : 0 };
  });
};

const CATEGORY_COLORS = {
  handbags: '#1A1A1A',
  'tote-bags': '#6B7280',
  clutches: '#9CA3AF',
  'shoulder-bags': '#D1D5DB',
  crossbody: '#E5E7EB',
  wallets: '#F3F4F6',
};

const STATUS_COLORS = {
  pending: '#F59E0B',
  processing: '#3B82F6',
  shipped: '#8B5CF6',
  delivered: '#10B981',
  cancelled: '#EF4444',
};

const PAYMENT_COLORS = {
  cod: '#1A1A1A',
  'bank-transfer': '#6B7280',
  easypaisa: '#10B981',
  jazzcash: '#EF4444',
};

// ─── sub-components ──────────────────────────────────────────────────────────

const StatCard = ({ label, value, sub, trend }) => (
  <div className="bg-white rounded-2xl p-5">
    <p className="text-[10px] tracking-widest uppercase text-[#6B7280] mb-3">{label}</p>
    <p className="text-3xl font-light text-[#1A1A1A] leading-none mb-1">{value}</p>
    <div className="flex items-center gap-2 mt-1">
      {trend !== undefined && (
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${trend >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-400'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
      {sub && <p className="text-xs text-[#6B7280]">{sub}</p>}
    </div>
  </div>
);

const ChartCard = ({ title, sub, children }) => (
  <div className="bg-white rounded-2xl p-5">
    <div className="mb-4">
      <p className="text-[10px] tracking-widest uppercase text-[#6B7280] mb-0.5">{sub}</p>
      <p className="text-sm font-medium text-[#1A1A1A]">{title}</p>
    </div>
    {children}
  </div>
);

// ─── main ────────────────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminAPI.getStats(), adminAPI.getAnalytics()])
      .then(([s, a]) => { setStats(s.data.data); setAnalytics(a.data.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="bg-[#FAFAFA] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex gap-8"><AdminSidebar /><div className="flex-1"><Spinner /></div></div>
      </div>
    </div>
  );

  // Derived chart data
  const revenueChartData = fillMonths(analytics?.monthlyRevenue || [], 'revenue');
  const ordersChartData = fillMonths(analytics?.monthlyOrders || [], 'count');
  const customersChartData = fillMonths(analytics?.newCustomers || [], 'count');

  const categoryDonutData = (analytics?.categoryRevenue || [])
    .filter((c) => c._id)
    .map((c) => ({ label: c._id.replace(/-/g, ' '), value: c.unitsSold, color: CATEGORY_COLORS[c._id] || '#9CA3AF' }));

  const statusDonutData = (analytics?.orderStatusBreakdown || [])
    .map((s) => ({ label: s._id, value: s.count, color: STATUS_COLORS[s._id] || '#9CA3AF' }));

  const paymentDonutData = (analytics?.paymentMethodBreakdown || [])
    .map((p) => ({ label: p._id, value: p.count, color: PAYMENT_COLORS[p._id] || '#9CA3AF' }));

  // MoM revenue trend
  const revTrend = stats?.lastMonthRevenue > 0
    ? Math.round(((stats.thisMonthRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100)
    : null;

  return (
    <div className="bg-[#FAFAFA] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex gap-8">
          <AdminSidebar />

          <main className="flex-1 min-w-0 space-y-6">

            {/* Header */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-[#6B7280] mb-1">Overview</p>
                <h1 className="text-2xl sm:text-3xl font-light text-[#1A1A1A] tracking-tight">Dashboard</h1>
              </div>
              <div className="flex gap-3">
                <Link to="/admin/products" className="text-xs tracking-widest uppercase text-[#6B7280] hover:text-[#1A1A1A] transition duration-300">Products →</Link>
                <Link to="/admin/orders" className="text-xs tracking-widest uppercase text-[#6B7280] hover:text-[#1A1A1A] transition duration-300">Orders →</Link>
              </div>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Revenue"
                value={formatPrice(stats?.revenue || 0)}
                sub="verified payments"
                trend={revTrend}
              />
              <StatCard
                label="Total Orders"
                value={stats?.totalOrders || 0}
                sub="all time"
              />
              <StatCard
                label="Pending Orders"
                value={stats?.pendingOrders || 0}
                sub="awaiting action"
              />
              <StatCard
                label="Customers"
                value={stats?.totalCustomers || 0}
                sub={`${stats?.totalProducts || 0} active products`}
              />
            </div>

            {/* Revenue + Orders charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartCard title="Monthly Revenue" sub="Last 6 months">
                <LineChart
                  data={revenueChartData}
                  color="#1A1A1A"
                  formatValue={(v) => `Rs.${(v / 1000).toFixed(0)}k`}
                />
              </ChartCard>
              <ChartCard title="Orders Volume" sub="Last 6 months">
                <BarChart
                  data={ordersChartData}
                  color="#1A1A1A"
                  formatValue={(v) => v}
                />
              </ChartCard>
            </div>

            {/* Category + Status + Payment */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <ChartCard title="Sales by Category" sub="Units sold">
                <DonutChart data={categoryDonutData} size={120} />
              </ChartCard>
              <ChartCard title="Order Status" sub="Breakdown">
                <DonutChart data={statusDonutData} size={120} />
              </ChartCard>
              <ChartCard title="Payment Methods" sub="Breakdown">
                <DonutChart data={paymentDonutData} size={120} />
              </ChartCard>
            </div>

            {/* Top products + Wishlist activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* Top selling */}
              <div className="bg-white rounded-2xl p-5">
                <div className="mb-4">
                  <p className="text-[10px] tracking-widest uppercase text-[#6B7280] mb-0.5">Sales</p>
                  <p className="text-sm font-medium text-[#1A1A1A]">Top Selling Products</p>
                </div>
                <div className="space-y-3">
                  {(analytics?.topProducts || []).length === 0 && (
                    <p className="text-xs text-[#6B7280] py-4 text-center">No sales data yet</p>
                  )}
                  {(analytics?.topProducts || []).map((p, i) => {
                    const maxUnits = analytics.topProducts[0]?.unitsSold || 1;
                    const pct = (p.unitsSold / maxUnits) * 100;
                    return (
                      <div key={p._id} className="flex items-center gap-3">
                        <span className="text-[10px] text-[#6B7280] w-4 shrink-0">{i + 1}</span>
                        <img src={p.image} alt={p.name} loading="lazy" className="w-9 h-10 object-cover rounded-lg shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#1A1A1A] truncate">{p.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1 bg-[#F5F5F5] rounded-full overflow-hidden">
                              <div className="h-full bg-[#1A1A1A] rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[10px] text-[#6B7280] shrink-0">{p.unitsSold} sold</span>
                          </div>
                        </div>
                        <span className="text-xs text-[#1A1A1A] shrink-0">{formatPrice(p.revenue)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Wishlist activity */}
              <div className="bg-white rounded-2xl p-5">
                <div className="mb-4">
                  <p className="text-[10px] tracking-widest uppercase text-[#6B7280] mb-0.5">Customer Behavior</p>
                  <p className="text-sm font-medium text-[#1A1A1A]">Most Wishlisted</p>
                </div>
                <div className="space-y-3">
                  {(analytics?.wishlistActivity || []).length === 0 && (
                    <p className="text-xs text-[#6B7280] py-4 text-center">No wishlist data yet</p>
                  )}
                  {(analytics?.wishlistActivity || []).map((p, i) => {
                    const maxCount = analytics.wishlistActivity[0]?.count || 1;
                    const pct = (p.count / maxCount) * 100;
                    return (
                      <div key={p._id} className="flex items-center gap-3">
                        <span className="text-[10px] text-[#6B7280] w-4 shrink-0">{i + 1}</span>
                        {p.image && <img src={p.image} alt={p.name} loading="lazy" className="w-9 h-10 object-cover rounded-lg shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#1A1A1A] truncate">{p.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1 bg-[#F5F5F5] rounded-full overflow-hidden">
                              <div className="h-full bg-[#6B7280] rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[10px] text-[#6B7280] shrink-0">{p.count} saves</span>
                          </div>
                        </div>
                        <span className="text-xs text-[#6B7280] shrink-0 capitalize">{p.category?.replace(/-/g, ' ')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* New customers chart */}
            <ChartCard title="New Customers" sub="Last 6 months">
              <BarChart
                data={customersChartData}
                color="#6B7280"
                formatValue={(v) => v}
                height={120}
              />
            </ChartCard>

            {/* Category revenue table */}
            <div className="bg-white rounded-2xl p-5">
              <div className="mb-4">
                <p className="text-[10px] tracking-widest uppercase text-[#6B7280] mb-0.5">Revenue</p>
                <p className="text-sm font-medium text-[#1A1A1A]">Sales by Category</p>
              </div>
              {(analytics?.categoryRevenue || []).length === 0 ? (
                <p className="text-xs text-[#6B7280] py-4 text-center">No data yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#EAEAEA]">
                        {['Category', 'Units Sold', 'Revenue', 'Share'].map((h) => (
                          <th key={h} className="text-left text-[10px] tracking-widest uppercase text-[#6B7280] pb-3 font-normal pr-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAEAEA]">
                      {(() => {
                        const totalRev = (analytics?.categoryRevenue || []).reduce((s, c) => s + c.revenue, 0) || 1;
                        return (analytics?.categoryRevenue || []).filter((c) => c._id).map((c) => (
                          <tr key={c._id} className="hover:bg-[#FAFAFA] transition duration-300">
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[c._id] || '#9CA3AF' }} />
                                <span className="text-sm text-[#1A1A1A] capitalize">{c._id.replace(/-/g, ' ')}</span>
                              </div>
                            </td>
                            <td className="py-3 pr-4 text-sm text-[#6B7280]">{c.unitsSold}</td>
                            <td className="py-3 pr-4 text-sm text-[#1A1A1A]">{formatPrice(c.revenue)}</td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-[#F5F5F5] rounded-full overflow-hidden">
                                  <div className="h-full bg-[#1A1A1A] rounded-full" style={{ width: `${(c.revenue / totalRev) * 100}%` }} />
                                </div>
                                <span className="text-xs text-[#6B7280]">{Math.round((c.revenue / totalRev) * 100)}%</span>
                              </div>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
