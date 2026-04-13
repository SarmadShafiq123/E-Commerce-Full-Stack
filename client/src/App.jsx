import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import Spinner from './components/Spinner';
import { OrganizationJsonLd, WebSiteJsonLd } from './seo/JsonLd';
import ChatbotWidget from './components/ChatbotWidget';

// ── Eagerly loaded (critical path) ───────────────────────────────────────────
import Home         from './pages/Home';
import ProductList  from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Login        from './pages/Login';
import Register     from './pages/Register';

// ── Lazily loaded (code-split) ────────────────────────────────────────────────
const Cart             = lazy(() => import('./pages/Cart'));
const Checkout         = lazy(() => import('./pages/Checkout'));
const OrderSuccess     = lazy(() => import('./pages/OrderSuccess'));
const Profile          = lazy(() => import('./pages/Profile'));
const Orders           = lazy(() => import('./pages/Orders'));
const OrderDetail      = lazy(() => import('./pages/OrderDetail'));
const Wishlist         = lazy(() => import('./pages/Wishlist'));
const VerifyEmail      = lazy(() => import('./pages/VerifyEmail'));
const GoogleAuthSuccess = lazy(() => import('./pages/GoogleAuthSuccess'));

// Admin — separate chunk
const AdminDashboard  = lazy(() => import('./pages/AdminDashboard'));
const AdminProducts   = lazy(() => import('./pages/AdminProducts'));
const AdminOrders     = lazy(() => import('./pages/AdminOrders'));
const AdminInventory  = lazy(() => import('./pages/AdminInventory'));
const AdminCoupons    = lazy(() => import('./pages/AdminCoupons'));
const AdminReviews    = lazy(() => import('./pages/AdminReviews'));
const AdminOffers     = lazy(() => import('./pages/AdminOffers'));
const AdminAI         = lazy(() => import('./pages/AdminAI'));
const AdminChatbot    = lazy(() => import('./pages/AdminChatbot'));
const AdminHomepage   = lazy(() => import('./pages/AdminHomepage'));

const PageFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <Spinner />
  </div>
);

function App() {
  return (
    <Router>
      {/* Global structured data — injected once for every page */}
      <OrganizationJsonLd />
      <WebSiteJsonLd />

      <CartProvider>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Suspense fallback={<PageFallback />}>
              <Routes>
                {/* Public */}
                <Route path="/"                        element={<Home />} />
                <Route path="/products"                element={<ProductList />} />
                <Route path="/products/:id"            element={<ProductDetail />} />
                <Route path="/cart"                    element={<Cart />} />
                <Route path="/login"                   element={<Login />} />
                <Route path="/register"                element={<Register />} />
                <Route path="/verify-email/:token"     element={<VerifyEmail />} />
                <Route path="/auth/google/success"     element={<GoogleAuthSuccess />} />

                {/* Protected — customer */}
                <Route path="/checkout"     element={<PrivateRoute><Checkout /></PrivateRoute>} />
                <Route path="/order-success" element={<PrivateRoute><OrderSuccess /></PrivateRoute>} />
                <Route path="/profile"      element={<PrivateRoute><Profile /></PrivateRoute>} />
                <Route path="/orders"       element={<PrivateRoute><Orders /></PrivateRoute>} />
                <Route path="/orders/:id"   element={<PrivateRoute><OrderDetail /></PrivateRoute>} />
                <Route path="/wishlist"     element={<PrivateRoute><Wishlist /></PrivateRoute>} />

                {/* Protected — admin */}
                <Route path="/admin/dashboard"  element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/products"   element={<AdminRoute><AdminProducts /></AdminRoute>} />
                <Route path="/admin/orders"     element={<AdminRoute><AdminOrders /></AdminRoute>} />
                <Route path="/admin/inventory"  element={<AdminRoute><AdminInventory /></AdminRoute>} />
                <Route path="/admin/coupons"    element={<AdminRoute><AdminCoupons /></AdminRoute>} />
                <Route path="/admin/reviews"    element={<AdminRoute><AdminReviews /></AdminRoute>} />
                <Route path="/admin/offers"     element={<AdminRoute><AdminOffers /></AdminRoute>} />
                <Route path="/admin/ai"         element={<AdminRoute><AdminAI /></AdminRoute>} />
                <Route path="/admin/chatbot"    element={<AdminRoute><AdminChatbot /></AdminRoute>} />
                <Route path="/admin/homepage"   element={<AdminRoute><AdminHomepage /></AdminRoute>} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
          <ChatbotWidget />
        </div>
      </CartProvider>
    </Router>
  );
}

export default App;
