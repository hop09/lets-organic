'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Shield,
  Lock,
  Mail,
  Package,
  Megaphone,
  MessageSquare,
  Settings,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Video,
  Image as ImageIcon,
  ExternalLink,
  LogOut,
  Star,
  RefreshCw,
  Receipt,
  Sparkles,
  Save,
  CheckCircle2,
  AlertTriangle,
  Truck,
  Tag,
  FolderPlus,
  Layers,
  TicketPercent,
  Users,
} from 'lucide-react';
import { categories as fallbackCategories } from '@/data/products';
import SafeImage from '@/components/SafeImage/SafeImage';
import ImageUploader from '@/components/ImageUploader/ImageUploader';
import TeamTab from '@/components/Admin/TeamTab';
import { hasPermission } from '@/lib/permissionsClient';
import styles from './admin.module.css';

// Console tab → required permission key. Owners see everything.
const TAB_PERMISSIONS = {
  products: 'products.view',
  orders: 'orders.view',
  categories: 'categories.manage',
  coupons: 'coupons.manage',
  promo: 'settings.manage',
  feedback: 'feedback.moderate',
  messages: 'feedback.moderate',
  settings: 'settings.manage',
  team: 'users.manage',
};

const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const orderStatusStyle = (status) => {
  switch (status) {
    case 'pending':
      return { color: '#E5B288', background: 'rgba(200,149,108,0.2)' };
    case 'confirmed':
      return { color: '#8BB8E5', background: 'rgba(139,184,229,0.18)' };
    case 'shipped':
      return { color: '#C9A9E5', background: 'rgba(201,169,229,0.18)' };
    case 'delivered':
      return { color: '#75E089', background: 'rgba(40,167,69,0.15)' };
    case 'cancelled':
      return { color: '#FF808A', background: 'rgba(255,107,122,0.15)' };
    default:
      return { color: '#B5C2B1', background: 'rgba(255,255,255,0.08)' };
  }
};

export default function AdminConsolePage() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null); // {id,email,name,permissions,isOwner}
  const [authChecking, setAuthChecking] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Dashboard state
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'categories' | 'orders' | 'coupons' | 'promo' | 'feedback' | 'messages' | 'settings' | 'team'
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  // Data states
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [feedbackList, setFeedbackList] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackFilter, setFeedbackFilter] = useState('all'); // 'all' | 'pending' | 'approved'
  const [messagesList, setMessagesList] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesFilter, setMessagesFilter] = useState('all'); // 'all' | 'unread' | 'read'
  const [expandedMessageId, setExpandedMessageId] = useState(null);

  // Orders state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all'); // 'all' | ORDER_STATUSES
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersLimit] = useState(20);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderStatusUpdating, setOrderStatusUpdating] = useState(false);
  const [settings, setSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Category state
  const [categoriesList, setCategoriesList] = useState(fallbackCategories);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    image: '',
    badge: 'Organic Harvest',
    tagline: 'Pure & Natural Botanicals',
  });
  const [categorySaving, setCategorySaving] = useState(false);

  // Coupon state
  const [coupons, setCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [couponSaving, setCouponSaving] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    type: 'percent',
    value: '',
    minOrder: '',
    expiresAt: '',
    usageLimit: '',
    active: true,
  });

  // Product Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    originalPrice: '',
    category: 'skincare',
    badge: '',
    description: '',
    featuresText: '',
    tagsText: 'Organic',
    images: [],
    videos: [],
    inStock: true,
    stockCount: 50,
    isHero: false,
  });
  const [newVideoUrl, setNewVideoUrl] = useState('');

  // Check auth session
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
          setAdminUser(data.user || null);
        } else {
          setAdminUser(null);
        }
      } else {
        setAdminUser(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAuthChecking(false);
    }
  }, []);

  useEffect(() => {
    // Async IIFE: state updates happen in the fetch continuation (after await),
    // not synchronously in the effect body.
    (async () => {
      await checkAuth();
    })();
  }, [checkAuth]);

  // Load products
  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  // Load feedback
  const fetchFeedback = useCallback(async () => {
    setFeedbackLoading(true);
    try {
      const res = await fetch('/api/feedback?admin=true');
      const data = await res.json();
      if (data.success) {
        setFeedbackList(data.reviews || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFeedbackLoading(false);
    }
  }, []);

  // Load contact messages
  const fetchMessages = useCallback(async () => {
    setMessagesLoading(true);
    try {
      const res = await fetch('/api/contact');
      const data = await res.json();
      if (data.success) {
        setMessagesList(data.messages || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  // Load coupons (admin) — GET auto-seeds the default ORGANIC25 coupon when empty
  const fetchCoupons = useCallback(async () => {
    setCouponsLoading(true);
    try {
      const res = await fetch('/api/coupons');
      const data = await res.json();
      if (res.ok && data.success) {
        setCoupons(data.coupons || []);
      } else {
        console.error(data.error || 'Failed to load coupons');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCouponsLoading(false);
    }
  }, []);

  // Load orders (admin)
  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(ordersPage),
        limit: String(ordersLimit),
      });
      if (orderStatusFilter !== 'all') params.set('status', orderStatusFilter);
      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(data.orders || []);
        setOrdersTotal(data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setOrdersLoading(false);
    }
  }, [ordersPage, orderStatusFilter, ordersLimit]);

  // Pending orders count for the tab badge
  const fetchPendingOrdersCount = useCallback(async () => {
    try {
      const res = await fetch('/api/orders?status=pending&limit=1');
      const data = await res.json();
      if (res.ok && data.success) {
        setPendingOrdersCount(data.total || 0);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Load settings
  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  // Load categories
  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.categories && data.categories.length > 0) {
        setCategoriesList(data.categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      // Async IIFE: state updates happen in the fetch continuations (after await),
      // not synchronously in the effect body. Promise.all preserves the original
      // concurrent firing of the independent fetches.
      (async () => {
        await Promise.all([fetchProducts(), fetchFeedback(), fetchMessages(), fetchSettings(), fetchCategories()]);
      })();
    }
  }, [isAuthenticated, fetchProducts, fetchFeedback, fetchMessages, fetchSettings, fetchCategories]);

  // Load orders when the orders tab is opened (also on page/filter changes)
  useEffect(() => {
    if (isAuthenticated && activeTab === 'orders') {
      // Async IIFE: state updates happen in the fetch continuations (after await),
      // not synchronously in the effect body. Promise.all preserves the original
      // concurrent firing of the independent fetches.
      (async () => {
        await Promise.all([fetchOrders(), fetchPendingOrdersCount()]);
      })();
    }
  }, [isAuthenticated, activeTab, fetchOrders, fetchPendingOrdersCount]);

  // Load coupons when the coupons tab is opened
  useEffect(() => {
    if (isAuthenticated && activeTab === 'coupons') {
      // Async IIFE: state updates happen in the fetch continuation (after await),
      // not synchronously in the effect body.
      (async () => {
        await fetchCoupons();
      })();
    }
  }, [isAuthenticated, activeTab, fetchCoupons]);

  const showNotification = (type, text) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
  };

  const openCategoryModal = (cat = null) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryForm({
        name: cat.name || '',
        slug: cat.slug || cat.id || '',
        image: cat.image || '',
        badge: cat.badge || '',
        tagline: cat.tagline || '',
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        slug: '',
        image: '',
        badge: 'Organic Harvest',
        tagline: 'Pure & Natural Botanicals',
      });
    }
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      showNotification('error', 'Category name is required');
      return;
    }
    setCategorySaving(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCategoriesList(data.categories);
        setCategoryModalOpen(false);
        showNotification(
          'success',
          editingCategory
            ? `Category "${categoryForm.name}" updated successfully!`
            : `Category "${categoryForm.name}" added successfully!`
        );
      } else {
        showNotification('error', data.error || 'Failed to save category');
      }
    } catch (err) {
      showNotification('error', 'Network error saving category');
    } finally {
      setCategorySaving(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (
      !confirm(
        `Are you sure you want to delete "${cat.name}"? Products in this category will keep their label, but this category will be removed from store filters.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/categories?slug=${encodeURIComponent(cat.slug || cat.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCategoriesList(data.categories);
        showNotification('success', `Category "${cat.name}" removed successfully.`);
      } else {
        showNotification('error', data.error || 'Failed to remove category');
      }
    } catch (err) {
      showNotification('error', 'Network error deleting category');
    }
  };

  // ---------------------------------------------------------------------------
  // Coupon handlers
  // ---------------------------------------------------------------------------
  const openCouponModal = () => {
    setCouponForm({
      code: '',
      type: 'percent',
      value: '',
      minOrder: '',
      expiresAt: '',
      usageLimit: '',
      active: true,
    });
    setCouponModalOpen(true);
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    const code = couponForm.code.trim().toUpperCase();
    if (!code) {
      showNotification('error', 'Coupon code is required');
      return;
    }
    if (!couponForm.value || Number(couponForm.value) <= 0) {
      showNotification('error', 'Discount value must be greater than 0');
      return;
    }
    if (couponForm.type === 'percent' && Number(couponForm.value) > 100) {
      showNotification('error', 'Percent coupons cannot exceed 100%');
      return;
    }

    const payload = {
      code,
      type: couponForm.type,
      value: Number(couponForm.value),
      minOrder: couponForm.minOrder === '' ? 0 : Number(couponForm.minOrder),
      expiresAt: couponForm.expiresAt || null,
      usageLimit: couponForm.usageLimit === '' ? null : Number(couponForm.usageLimit),
      active: couponForm.active,
    };

    setCouponSaving(true);
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCoupons((prev) => [data.coupon, ...prev]);
        setCouponModalOpen(false);
        showNotification('success', `Coupon "${code}" created successfully!`);
      } else {
        showNotification('error', data.error || 'Failed to create coupon');
      }
    } catch (err) {
      showNotification('error', 'Network error saving coupon');
    } finally {
      setCouponSaving(false);
    }
  };

  const handleToggleCouponActive = async (coupon) => {
    try {
      const res = await fetch('/api/coupons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: coupon.code, active: !coupon.active }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCoupons((prev) =>
          prev.map((c) => (c.code === coupon.code ? { ...c, active: data.coupon.active } : c))
        );
        showNotification(
          'success',
          `Coupon "${coupon.code}" ${data.coupon.active ? 'activated' : 'deactivated'}.`
        );
      } else {
        showNotification('error', data.error || 'Failed to update coupon');
      }
    } catch (err) {
      showNotification('error', 'Network error updating coupon');
    }
  };

  const handleDeleteCoupon = async (coupon) => {
    if (
      !confirm(
        `Are you sure you want to delete the coupon "${coupon.code}"? Customers will no longer be able to use it.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/coupons?code=${encodeURIComponent(coupon.code)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCoupons((prev) => prev.filter((c) => c.code !== coupon.code));
        showNotification('success', `Coupon "${coupon.code}" deleted.`);
      } else {
        showNotification('error', data.error || 'Failed to delete coupon');
      }
    } catch (err) {
      showNotification('error', 'Network error deleting coupon');
    }
  };

  const formatCouponDiscount = (coupon) =>
    coupon.type === 'percent' ? `${coupon.value}%` : `PKR ${Number(coupon.value).toLocaleString()}`;

  const formatCouponUsage = (coupon) =>
    `${coupon.usedCount || 0}/${coupon.usageLimit != null ? coupon.usageLimit : '∞'}`;

  const formatCouponExpiry = (coupon) =>
    coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'Never';

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Re-run the session check so adminUser (permissions) is populated too.
        await checkAuth();
      } else {
        setLoginError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setLoginError('Server connection error. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    await fetch('/api/auth/me', { method: 'POST' });
    setIsAuthenticated(false);
    setAdminUser(null);
    setActiveTab('products');
  };

  // Open modal for Create/Edit
  const openProductModal = (prod = null) => {
    if (prod) {
      setEditingProduct(prod);
      setProductForm({
        name: prod.name || '',
        price: prod.price || '',
        originalPrice: prod.originalPrice || '',
        category: prod.category || 'skincare',
        badge: prod.badge || '',
        description: prod.description || '',
        featuresText: (prod.features || []).join('\n'),
        tagsText: (prod.tags || []).join(', '),
        images: [...(prod.images || [])],
        videos: [...(prod.videos || [])],
        inStock: prod.inStock !== false,
        stockCount: prod.stockCount || 50,
        isHero: !!prod.isHero,
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        price: '',
        originalPrice: '',
        category: 'skincare',
        badge: '',
        description: '',
        featuresText: '100% Certified Organic Ingredients\nCold-Pressed Extraction\nCruelty-Free & Vegan',
        tagsText: 'Organic, Natural, Clean',
        images: ['https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&h=600&fit=crop'],
        videos: [],
        inStock: true,
        stockCount: 50,
        isHero: false,
      });
    }
    setNewVideoUrl('');
    setModalOpen(true);
  };

  // Media reordering
  const moveImage = (index, direction) => {
    const list = [...productForm.images];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    setProductForm({ ...productForm, images: list });
  };

  const removeImage = (index) => {
    const list = productForm.images.filter((_, i) => i !== index);
    setProductForm({ ...productForm, images: list });
  };

  // Appends an image URL (from upload or paste) to the product image list.
  const appendProductImage = (url) => {
    if (!url || !url.trim()) return;
    setProductForm({ ...productForm, images: [...productForm.images, url.trim()] });
  };

  const addVideo = () => {
    if (!newVideoUrl.trim()) return;
    setProductForm({ ...productForm, videos: [...productForm.videos, newVideoUrl.trim()] });
    setNewVideoUrl('');
  };

  const removeVideo = (index) => {
    const list = productForm.videos.filter((_, i) => i !== index);
    setProductForm({ ...productForm, videos: list });
  };

  // Save Product (Create or Update)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price || !productForm.description) {
      alert('Please fill in required fields: Name, Price, Description');
      return;
    }

    const payload = {
      name: productForm.name,
      price: parseFloat(productForm.price),
      originalPrice: productForm.originalPrice ? parseFloat(productForm.originalPrice) : null,
      category: productForm.category,
      badge: productForm.badge,
      description: productForm.description,
      features: productForm.featuresText.split('\n').map(s => s.trim()).filter(Boolean),
      tags: productForm.tagsText.split(',').map(s => s.trim()).filter(Boolean),
      images: productForm.images,
      videos: productForm.videos,
      inStock: productForm.inStock,
      stockCount: parseInt(productForm.stockCount, 10) || 50,
      isHero: productForm.isHero,
    };

    try {
      let res;
      if (editingProduct) {
        res = await fetch(`/api/products/${editingProduct._id || editingProduct.slug}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (res.ok) {
        showNotification('success', editingProduct ? 'Product updated successfully' : 'Product created successfully');
        setModalOpen(false);
        fetchProducts();
      } else {
        showNotification('error', data.error || 'Failed to save product');
      }
    } catch (err) {
      showNotification('error', 'Network error saving product');
    }
  };

  // Delete product
  const handleDeleteProduct = async (id, name) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"?`)) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('success', 'Product deleted');
        fetchProducts();
      } else {
        showNotification('error', 'Failed to delete product');
      }
    } catch (err) {
      showNotification('error', 'Network error');
    }
  };

  // Set Hero Product directly from table
  const handleToggleHero = async (product) => {
    try {
      const res = await fetch(`/api/products/${product._id || product.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHero: !product.isHero }),
      });
      if (res.ok) {
        showNotification('success', !product.isHero ? `"${product.name}" is now the Hero Product!` : 'Hero status unset');
        fetchProducts();
      }
    } catch (e) {
      showNotification('error', 'Failed to toggle hero product');
    }
  };

  // Feedback status toggle
  const handleToggleFeedbackStatus = async (item, shouldApprove) => {
    try {
      const res = await fetch('/api/feedback', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackId: item._id, isApproved: shouldApprove }),
      });
      if (res.ok) {
        showNotification('success', shouldApprove ? 'Review approved & live on site!' : 'Review unapproved');
        fetchFeedback();
        fetchProducts();
      } else {
        showNotification('error', 'Failed to update review status');
      }
    } catch (e) {
      showNotification('error', 'Error updating feedback');
    }
  };

  // Delete Feedback
  const handleDeleteFeedback = async (id) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      const res = await fetch(`/api/feedback?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('success', 'Review deleted');
        fetchFeedback();
        fetchProducts();
      }
    } catch (e) {
      showNotification('error', 'Error deleting feedback');
    }
  };

  // Contact message read/unread toggle
  const handleToggleMessageRead = async (item, shouldMarkRead) => {
    try {
      const res = await fetch('/api/contact', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: item._id, read: shouldMarkRead }),
      });
      if (res.ok) {
        showNotification('success', shouldMarkRead ? 'Message marked as read' : 'Message marked as unread');
        fetchMessages();
      } else {
        showNotification('error', 'Failed to update message status');
      }
    } catch (e) {
      showNotification('error', 'Error updating message');
    }
  };

  // Delete contact message
  const handleDeleteMessage = async (id) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      const res = await fetch(`/api/contact?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('success', 'Message deleted');
        setExpandedMessageId((prev) => (prev === id ? null : prev));
        fetchMessages();
      } else {
        showNotification('error', 'Failed to delete message');
      }
    } catch (e) {
      showNotification('error', 'Error deleting message');
    }
  };

  // Update order status
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setOrderStatusUpdating(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders((prev) => prev.map((o) => (o._id === orderId ? data.order : o)));
        setSelectedOrder(data.order);
        fetchPendingOrdersCount();
        showNotification('success', `Order ${data.order.orderNumber} marked as ${newStatus}.`);
      } else {
        showNotification('error', data.error || 'Failed to update order status');
      }
    } catch (e) {
      showNotification('error', 'Network error updating order status');
    } finally {
      setOrderStatusUpdating(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!settings) return;
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        showNotification('success', 'Store settings and branding updated!');
      } else {
        showNotification('error', 'Failed to update store settings');
      }
    } catch (e) {
      showNotification('error', 'Network error saving settings');
    }
  };

  // Permission-gated tab visibility: hide tabs the current user can't view.
  const visibleTabs = useMemo(
    () =>
      Object.keys(TAB_PERMISSIONS).filter(
        (tab) => !adminUser || hasPermission(adminUser, TAB_PERMISSIONS[tab])
      ),
    [adminUser]
  );

  // Upload dropzones are only shown to admins with the media.upload permission
  // (the /api/upload endpoint enforces this again server-side).
  const canUpload = !adminUser || hasPermission(adminUser, 'media.upload');

  // If the active tab becomes hidden by permissions, fall back to the first visible tab.
  useEffect(() => {
    // Async IIFE: the fallback runs in the continuation (after await),
    // not synchronously in the effect body.
    (async () => {
      await Promise.resolve();
      if (isAuthenticated && adminUser && !visibleTabs.includes(activeTab)) {
        setActiveTab(visibleTabs[0] || 'products');
      }
    })();
  }, [isAuthenticated, adminUser, activeTab, visibleTabs]);

  // Loading state
  if (authChecking) {
    return (
      <div className={styles.loginShield}>
        <div style={{ color: '#8C9988' }}>Verifying secure terminal...</div>
      </div>
    );
  }

  // --- 1. LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className={styles.loginShield}>
        <div className={styles.loginCard}>
          <div className={styles.loginHeader}>
            <div className={styles.loginIcon}>
              <Shield size={28} />
            </div>
            <h1 className={styles.loginTitle}>Management Portal</h1>
            <p className={styles.loginSubtitle}>Enter authorized credentials to access control vault.</p>
          </div>

          {loginError && (
            <div className={styles.errorBanner}>
              <AlertTriangle size={18} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className={styles.loginForm}>
            <div className={styles.formGroup}>
              <label>Administrator Email</label>
              <input
                type="email"
                required
                className={styles.formInput}
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Secure Password</label>
              <input
                type="password"
                required
                className={styles.formInput}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <button type="submit" className={styles.loginBtn} disabled={loginLoading}>
              {loginLoading ? (
                <>
                  <RefreshCw size={18} className="spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Lock size={18} />
                  Authorize Access
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Pending feedback count
  const pendingFeedbackCount = feedbackList.filter(f => !f.isApproved).length;

  // Filtered feedback
  const filteredFeedback = feedbackList.filter(f => {
    if (feedbackFilter === 'pending') return !f.isApproved;
    if (feedbackFilter === 'approved') return f.isApproved;
    return true;
  });

  // Unread contact messages count
  const unreadMessagesCount = messagesList.filter(m => !m.read).length;

  // Filtered contact messages
  const filteredMessages = messagesList.filter(m => {
    if (messagesFilter === 'unread') return !m.read;
    if (messagesFilter === 'read') return m.read;
    return true;
  });

  // Tab visibility helper (visibleTabs is computed above from the user's permissions)
  const canViewTab = (tab) => visibleTabs.includes(tab);

  // --- 2. AUTHENTICATED DASHBOARD ---
  return (
    <div className={styles.adminWrapper}>
      {/* Topbar */}
      <header className={styles.topbar}>
        <div className={styles.brandArea}>
          <div className={styles.brandLogo}>
            <Shield size={20} color="#79A36E" />
            <span>Lets Organic</span>
          </div>
          <span className={styles.brandTag}>Console HQ</span>
          <div className={styles.dbIndicator}>
            <span className={styles.dbDot} />
            <span>MongoDB Atlas Connected</span>
          </div>
        </div>

        <div className={styles.topbarActions}>
          <Link href="/" target="_blank" className={styles.viewStoreBtn}>
            <span>View Live Store</span>
            <ExternalLink size={14} />
          </Link>
          <button onClick={handleLogout} className={styles.logoutBtn} title="Sign Out">
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Tabs Navigation */}
      <nav className={styles.navTabs}>
        {canViewTab('products') && (
          <button
            className={`${styles.navTab} ${activeTab === 'products' ? styles.navTabActive : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <Package size={16} />
            <span>Products Catalog ({products.length})</span>
          </button>
        )}

        {canViewTab('orders') && (
          <button
            className={`${styles.navTab} ${activeTab === 'orders' ? styles.navTabActive : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <Receipt size={16} />
            <span>Orders</span>
            {pendingOrdersCount > 0 && (
              <span className={styles.badgeCount}>{pendingOrdersCount} pending</span>
            )}
          </button>
        )}

        {canViewTab('categories') && (
          <button
            className={`${styles.navTab} ${activeTab === 'categories' ? styles.navTabActive : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            <Tag size={16} />
            <span>Categories ({categoriesList.length})</span>
          </button>
        )}

        {canViewTab('coupons') && (
          <button
            className={`${styles.navTab} ${activeTab === 'coupons' ? styles.navTabActive : ''}`}
            onClick={() => setActiveTab('coupons')}
          >
            <TicketPercent size={16} />
            <span>Discount Coupons ({coupons.length})</span>
          </button>
        )}

        {canViewTab('promo') && (
          <button
            className={`${styles.navTab} ${activeTab === 'promo' ? styles.navTabActive : ''}`}
            onClick={() => setActiveTab('promo')}
          >
            <Megaphone size={16} />
            <span>Promotion Banner</span>
          </button>
        )}

        {canViewTab('feedback') && (
          <button
            className={`${styles.navTab} ${activeTab === 'feedback' ? styles.navTabActive : ''}`}
            onClick={() => setActiveTab('feedback')}
          >
            <MessageSquare size={16} />
            <span>Reviews & Feedback</span>
            {pendingFeedbackCount > 0 && (
              <span className={styles.badgeCount}>{pendingFeedbackCount} pending</span>
            )}
          </button>
        )}

        {canViewTab('messages') && (
          <button
            className={`${styles.navTab} ${activeTab === 'messages' ? styles.navTabActive : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            <Mail size={16} />
            <span>Messages</span>
            {unreadMessagesCount > 0 && (
              <span className={styles.badgeCount}>{unreadMessagesCount} unread</span>
            )}
          </button>
        )}

        {canViewTab('settings') && (
          <button
            className={`${styles.navTab} ${activeTab === 'settings' ? styles.navTabActive : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={16} />
            <span>Store Settings & Branding</span>
          </button>
        )}

        {canViewTab('team') && (
          <button
            className={`${styles.navTab} ${activeTab === 'team' ? styles.navTabActive : ''}`}
            onClick={() => setActiveTab('team')}
          >
            <Users size={16} />
            <span>Team</span>
          </button>
        )}
      </nav>

      {/* Notification banner */}
      {statusMsg.text && (
        <div style={{ maxWidth: '1400px', margin: '1rem auto 0', padding: '0 2rem' }}>
          <div className={statusMsg.type === 'error' ? styles.errorBanner : styles.successBanner}>
            {statusMsg.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            <span>{statusMsg.text}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {/* No console permissions at all */}
        {visibleTabs.length === 0 && (
          <div className={styles.settingsCard} style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <Shield size={36} color="#8C9988" style={{ marginBottom: '1rem' }} />
            <h2 className={styles.tabTitle}>No console access</h2>
            <p className={styles.tabSubtitle}>
              Your account doesn&apos;t have permission to view any console section.
              Please contact the store owner.
            </p>
          </div>
        )}
        {/* ===================== TAB 1: PRODUCTS ===================== */}
        {activeTab === 'products' && (
          <div>
            <div className={styles.tabHeader}>
              <div>
                <h2 className={styles.tabTitle}>Product Inventory</h2>
                <p className={styles.tabSubtitle}>Manage products, carousel photos, video previews, and the Hero Product.</p>
              </div>
              <button onClick={() => openProductModal()} className={styles.primaryActionBtn}>
                <Plus size={16} />
                <span>Add Product</span>
              </button>
            </div>

            <div className={styles.tableCard}>
              <div className={styles.tableWrapper}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Badge</th>
                      <th>Hero Product</th>
                      <th>Media</th>
                      <th>Stock</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={8} className={styles.emptyState}>
                          {productsLoading ? 'Loading database...' : 'No products found. Click "Add Product" to create one.'}
                        </td>
                      </tr>
                    ) : (
                      products.map((prod) => (
                        <tr key={prod._id || prod.slug}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <SafeImage
                                src={prod.images?.[0] || 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=100&h=100&fit=crop'}
                                alt={prod.name}
                                className={styles.productThumb}
                                width={48}
                                height={48}
                              />
                              <div>
                                <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{prod.name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#8C9988' }}>/{prod.slug}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ textTransform: 'capitalize' }}>{prod.category}</span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>PKR {prod.price?.toLocaleString() || prod.price}</div>
                            {prod.originalPrice && (
                              <div style={{ fontSize: '0.75rem', color: '#8C9988', textDecoration: 'line-through' }}>
                                PKR {prod.originalPrice?.toLocaleString() || prod.originalPrice}
                              </div>
                            )}
                          </td>
                          <td>
                            {prod.badge ? (
                              <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.08)', padding: '0.2rem 0.5rem', borderRadius: 4 }}>
                                {prod.badge}
                              </span>
                            ) : '—'}
                          </td>
                          <td>
                            <button
                              onClick={() => handleToggleHero(prod)}
                              className={prod.isHero ? styles.heroTagBadge : styles.iconBtn}
                              title="Toggle Hero Spotlight on Home Page"
                            >
                              <Sparkles size={14} />
                              <span>{prod.isHero ? 'HERO STAR' : 'Set as Hero'}</span>
                            </button>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', color: '#B5C2B1' }}>
                              <span>{prod.images?.length || 0} pics</span>
                              {prod.videos?.length > 0 && (
                                <span style={{ color: '#79A36E', display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Video size={12} /> {prod.videos.length} vid
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span style={{ color: prod.inStock ? '#75E089' : '#FF808A', fontSize: '0.8125rem' }}>
                              {prod.inStock ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </td>
                          <td>
                            <div className={styles.tableActions}>
                              <button
                                onClick={() => openProductModal(prod)}
                                className={styles.iconBtn}
                                title="Edit Product"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(prod._id || prod.slug, prod.name)}
                                className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                title="Delete Product"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB: ORDERS ===================== */}
        {activeTab === 'orders' && (
          <div>
            <div className={styles.tabHeader}>
              <div>
                <h2 className={styles.tabTitle}>Order Management</h2>
                <p className={styles.tabSubtitle}>Review customer orders, update fulfillment status, and track deliveries. Click an order number for full details.</p>
              </div>
              <button
                onClick={() => { fetchOrders(); fetchPendingOrdersCount(); }}
                className={styles.primaryActionBtn}
              >
                <RefreshCw size={16} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Status filter */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => { setOrderStatusFilter('all'); setOrdersPage(1); }}
                className={`${styles.iconBtn} ${orderStatusFilter === 'all' ? styles.navTabActive : ''}`}
                style={{ padding: '0.5rem 1rem' }}
              >
                All
              </button>
              {ORDER_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => { setOrderStatusFilter(s); setOrdersPage(1); }}
                  className={`${styles.iconBtn} ${orderStatusFilter === s ? styles.navTabActive : ''}`}
                  style={{ padding: '0.5rem 1rem', textTransform: 'capitalize' }}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className={styles.tableCard}>
              <div className={styles.tableWrapper}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className={styles.emptyState}>
                          {ordersLoading ? 'Loading orders...' : 'No orders found for this filter.'}
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr key={order._id}>
                          <td>
                            <button
                              onClick={() => setSelectedOrder(order)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: '#79A36E', fontSize: '0.9rem', padding: 0 }}
                              title="View order details"
                            >
                              {order.orderNumber}
                            </button>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: '#8C9988', whiteSpace: 'nowrap' }}>
                            {new Date(order.createdAt).toLocaleString()}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{order.customer?.fullName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#8C9988' }}>{order.customer?.phone}</div>
                          </td>
                          <td>
                            {(order.items || []).reduce((sum, i) => sum + i.quantity, 0)} pcs
                            <span style={{ color: '#8C9988', fontSize: '0.75rem' }}> ({(order.items || []).length} lines)</span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700 }}>PKR {order.total?.toLocaleString()}</div>
                            {order.paymentMethod && (
                              <div style={{ fontSize: '0.72rem', color: '#8C9988' }}>{order.paymentMethod}</div>
                            )}
                          </td>
                          <td>
                            <span
                              style={{
                                ...orderStatusStyle(order.status),
                                padding: '0.25rem 0.6rem',
                                borderRadius: 4,
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                textTransform: 'capitalize',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className={styles.iconBtn}
                              title="View order details"
                            >
                              <ExternalLink size={15} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {ordersTotal > ordersLimit && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <span style={{ color: '#8C9988', fontSize: '0.85rem' }}>
                  Page {ordersPage} of {Math.max(1, Math.ceil(ordersTotal / ordersLimit))} — {ordersTotal} orders
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className={styles.iconBtn}
                    style={{ padding: '0.5rem 1rem' }}
                    disabled={ordersPage <= 1}
                    onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                  >
                    ‹ Prev
                  </button>
                  <button
                    className={styles.iconBtn}
                    style={{ padding: '0.5rem 1rem' }}
                    disabled={ordersPage >= Math.ceil(ordersTotal / ordersLimit)}
                    onClick={() => setOrdersPage((p) => p + 1)}
                  >
                    Next ›
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB: CATEGORIES ===================== */}
        {activeTab === 'categories' && (
          <div>
            <div className={styles.tabHeader}>
              <div>
                <h2 className={styles.tabTitle}>Category Management</h2>
                <p className={styles.tabSubtitle}>
                  Create, edit, and organize store collections. Real-time changes appear immediately across the live store.
                </p>
              </div>
              <button
                onClick={() => openCategoryModal()}
                className={styles.primaryActionBtn}
              >
                <Plus size={16} />
                <span>Add New Category</span>
              </button>
            </div>

            {categoriesLoading ? (
              <div className={styles.loadingBox}>
                <RefreshCw size={24} className={styles.spinning} />
                <p>Loading categories...</p>
              </div>
            ) : categoriesList.length === 0 ? (
              <div className={styles.emptyState}>
                <Tag size={40} color="#79A36E" style={{ marginBottom: '1rem' }} />
                <h3>No Categories Found</h3>
                <p>Add your first product category to organize your store inventory.</p>
                <button
                  onClick={() => openCategoryModal()}
                  className={styles.primaryActionBtn}
                  style={{ marginTop: '1rem' }}
                >
                  <Plus size={16} />
                  <span>Create Category</span>
                </button>
              </div>
            ) : (
              <div className={styles.categoryCardGrid}>
                {categoriesList.map((cat) => (
                  <div key={cat.slug || cat.id} className={styles.categoryCard}>
                    <div className={styles.categoryCardBanner}>
                      <SafeImage
                        src={cat.image || 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&h=700&fit=crop'}
                        alt={cat.name}
                        className={styles.categoryCardImg}
                        fill
                        sizes="400px"
                      />
                      {cat.badge && (
                        <span className={styles.categoryBadgeTag}>{cat.badge}</span>
                      )}
                    </div>
                    <div className={styles.categoryCardBody}>
                      <div className={styles.categoryCardHeader}>
                        <h3 className={styles.categoryCardTitle}>{cat.name}</h3>
                        <span className={styles.categoryCardSlug}>/{cat.slug || cat.id}</span>
                      </div>
                      <p className={styles.categoryCardTagline}>
                        {cat.tagline || 'Pure Organic Collection'}
                      </p>
                      <div className={styles.categoryCardFooter}>
                        <span className={styles.categoryProductCount}>
                          {cat.count !== undefined ? `${cat.count} Products` : 'Active Collection'}
                        </span>
                        <div className={styles.categoryActions}>
                          <button
                            onClick={() => openCategoryModal(cat)}
                            className={styles.iconBtn}
                            title="Edit Category"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat)}
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            title="Remove Category"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB: DISCOUNT COUPONS ===================== */}
        {activeTab === 'coupons' && (
          <div>
            <div className={styles.tabHeader}>
              <div>
                <h2 className={styles.tabTitle}>Discount Coupons</h2>
                <p className={styles.tabSubtitle}>
                  Create and manage discount codes. Codes are validated at checkout — an invalid or expired
                  code rejects the order so the customer can fix it.
                </p>
              </div>
              <button onClick={openCouponModal} className={styles.primaryActionBtn}>
                <Plus size={16} />
                <span>Add Coupon</span>
              </button>
            </div>

            {couponsLoading ? (
              <div className={styles.loadingBox}>
                <RefreshCw size={24} className={styles.spinning} />
                <p>Loading coupons...</p>
              </div>
            ) : coupons.length === 0 ? (
              <div className={styles.emptyState}>
                <TicketPercent size={40} color="#79A36E" style={{ marginBottom: '1rem' }} />
                <h3>No Coupons Yet</h3>
                <p>Create your first discount coupon to reward your customers.</p>
                <button
                  onClick={openCouponModal}
                  className={styles.primaryActionBtn}
                  style={{ marginTop: '1rem' }}
                >
                  <Plus size={16} />
                  <span>Create Coupon</span>
                </button>
              </div>
            ) : (
              <div className={styles.tableCard}>
                <div className={styles.tableWrapper}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Discount</th>
                        <th>Min Order</th>
                        <th>Usage</th>
                        <th>Expiry</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coupons.map((coupon) => (
                        <tr key={coupon.code}>
                          <td>
                            <strong style={{ letterSpacing: '0.05em' }}>{coupon.code}</strong>
                          </td>
                          <td>{formatCouponDiscount(coupon)}</td>
                          <td>
                            {coupon.minOrder > 0
                              ? `PKR ${Number(coupon.minOrder).toLocaleString()}`
                              : '—'}
                          </td>
                          <td>{formatCouponUsage(coupon)}</td>
                          <td>{formatCouponExpiry(coupon)}</td>
                          <td>
                            <button
                              type="button"
                              onClick={() => handleToggleCouponActive(coupon)}
                              title={`Click to ${coupon.active ? 'deactivate' : 'activate'}`}
                              style={{
                                padding: '0.25rem 0.6rem',
                                borderRadius: 4,
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                textTransform: 'capitalize',
                                whiteSpace: 'nowrap',
                                border: 'none',
                                cursor: 'pointer',
                                color: coupon.active ? '#75E089' : '#FF808A',
                                background: coupon.active
                                  ? 'rgba(40,167,69,0.15)'
                                  : 'rgba(255,107,122,0.15)',
                              }}
                            >
                              {coupon.active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td>
                            <div className={styles.tableActions}>
                              <button
                                onClick={() => handleDeleteCoupon(coupon)}
                                className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                title="Delete coupon"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 2: PROMOTION BANNER ===================== */}
        {activeTab === 'promo' && settings && (
          <form onSubmit={handleSaveSettings} style={{ maxWidth: '800px' }}>
            <div className={styles.tabHeader}>
              <div>
                <h2 className={styles.tabTitle}>Promotional Banner Control</h2>
                <p className={styles.tabSubtitle}>Configure the high-converting announcement banner on the home page.</p>
              </div>
              <button type="submit" className={styles.primaryActionBtn}>
                <Save size={16} />
                <span>Save Banner</span>
              </button>
            </div>

            <div className={styles.settingsCard}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={settings.promotionBanner?.enabled ?? true}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        promotionBanner: { ...settings.promotionBanner, enabled: e.target.checked },
                      })
                    }
                  />
                  <span>Enable Promotion Banner on Home Page</span>
                </label>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Promo Badge Text</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={settings.promotionBanner?.badge || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        promotionBanner: { ...settings.promotionBanner, badge: e.target.value },
                      })
                    }
                    placeholder="e.g. Seasonal Harvest Offer"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Coupon / Discount Code</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={settings.promotionBanner?.couponCode || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        promotionBanner: { ...settings.promotionBanner, couponCode: e.target.value },
                      })
                    }
                    placeholder="e.g. ORGANIC25"
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Headline</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={settings.promotionBanner?.headline || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        promotionBanner: { ...settings.promotionBanner, headline: e.target.value },
                      })
                    }
                    placeholder="Experience Nature at Its Purest — 25% Off"
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Subheadline / Description</label>
                  <textarea
                    className={`${styles.formInput} ${styles.textarea}`}
                    style={{ minHeight: '80px' }}
                    value={settings.promotionBanner?.subheadline || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        promotionBanner: { ...settings.promotionBanner, subheadline: e.target.value },
                      })
                    }
                    placeholder="Handcrafted organic serums, cold-pressed botanicals & pure superfoods."
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Call to Action Button Text</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={settings.promotionBanner?.buttonText || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        promotionBanner: { ...settings.promotionBanner, buttonText: e.target.value },
                      })
                    }
                    placeholder="Claim 25% Off"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Button Link Destination</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={settings.promotionBanner?.buttonLink || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        promotionBanner: { ...settings.promotionBanner, buttonLink: e.target.value },
                      })
                    }
                    placeholder="/shop"
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Banner Background Image URL</label>
                  <ImageUploader
                    value={settings.promotionBanner?.imageUrl || ''}
                    onChange={(url) =>
                      setSettings({
                        ...settings,
                        promotionBanner: { ...settings.promotionBanner, imageUrl: url },
                      })
                    }
                    canUpload={canUpload}
                  />
                </div>
              </div>
            </div>
          </form>
        )}

        {/* ===================== TAB 3: FEEDBACK MODERATION ===================== */}
        {activeTab === 'feedback' && (
          <div>
            <div className={styles.tabHeader}>
              <div>
                <h2 className={styles.tabTitle}>Customer Reviews & Moderation</h2>
                <p className={styles.tabSubtitle}>Approve customer reviews submitted on product pages. Only approved feedback appears on the live store.</p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setFeedbackFilter('all')}
                  className={`${styles.iconBtn} ${feedbackFilter === 'all' ? styles.navTabActive : ''}`}
                >
                  All ({feedbackList.length})
                </button>
                <button
                  onClick={() => setFeedbackFilter('pending')}
                  className={`${styles.iconBtn} ${feedbackFilter === 'pending' ? styles.navTabActive : ''}`}
                >
                  Pending ({pendingFeedbackCount})
                </button>
                <button
                  onClick={() => setFeedbackFilter('approved')}
                  className={`${styles.iconBtn} ${feedbackFilter === 'approved' ? styles.navTabActive : ''}`}
                >
                  Approved ({feedbackList.length - pendingFeedbackCount})
                </button>
              </div>
            </div>

            <div className={styles.tableCard}>
              <div className={styles.tableWrapper}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Product</th>
                      <th>Customer</th>
                      <th>Rating</th>
                      <th>Review Comments</th>
                      <th>Submitted Date</th>
                      <th>Moderation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFeedback.length === 0 ? (
                      <tr>
                        <td colSpan={7} className={styles.emptyState}>
                          {feedbackLoading ? 'Loading reviews...' : 'No feedback items found matching filter.'}
                        </td>
                      </tr>
                    ) : (
                      filteredFeedback.map((item) => (
                        <tr key={item._id}>
                          <td>
                            {item.isApproved ? (
                              <span style={{ color: '#75E089', background: 'rgba(40,167,69,0.15)', padding: '0.25rem 0.5rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                                Live on Store
                              </span>
                            ) : (
                              <span style={{ color: '#E5B288', background: 'rgba(200,149,108,0.2)', padding: '0.25rem 0.5rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                                Pending Approval
                              </span>
                            )}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{item.productName || item.productSlug}</div>
                            <Link href={`/product/${item.productSlug}`} target="_blank" style={{ fontSize: '0.75rem', color: '#79A36E' }}>
                              View Product ↗
                            </Link>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{item.userName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#8C9988' }}>{item.userEmail}</div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Star size={14} fill="#C8956C" color="#C8956C" />
                              <span style={{ fontWeight: 600 }}>{item.rating}/5</span>
                            </div>
                          </td>
                          <td style={{ maxWidth: '300px' }}>
                            {item.title && <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{item.title}</div>}
                            <div style={{ color: '#B5C2B1', fontSize: '0.8125rem', whiteSpace: 'normal' }}>{item.comment}</div>
                          </td>
                          <td style={{ fontSize: '0.75rem', color: '#8C9988' }}>
                            {new Date(item.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            <div className={styles.tableActions}>
                              {!item.isApproved ? (
                                <button
                                  onClick={() => handleToggleFeedbackStatus(item, true)}
                                  className={`${styles.iconBtn} ${styles.iconBtnSuccess}`}
                                  title="Approve & Publish to Store"
                                >
                                  <Check size={16} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleToggleFeedbackStatus(item, false)}
                                  className={styles.iconBtn}
                                  title="Unapprove"
                                >
                                  <X size={16} />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteFeedback(item._id)}
                                className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                title="Delete Permanently"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB: CONTACT MESSAGES ===================== */}
        {activeTab === 'messages' && (
          <div>
            <div className={styles.tabHeader}>
              <div>
                <h2 className={styles.tabTitle}>Contact Messages</h2>
                <p className={styles.tabSubtitle}>Messages submitted through the contact form. Click a message to read it in full.</p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setMessagesFilter('all')}
                  className={`${styles.iconBtn} ${messagesFilter === 'all' ? styles.navTabActive : ''}`}
                >
                  All ({messagesList.length})
                </button>
                <button
                  onClick={() => setMessagesFilter('unread')}
                  className={`${styles.iconBtn} ${messagesFilter === 'unread' ? styles.navTabActive : ''}`}
                >
                  Unread ({unreadMessagesCount})
                </button>
                <button
                  onClick={() => setMessagesFilter('read')}
                  className={`${styles.iconBtn} ${messagesFilter === 'read' ? styles.navTabActive : ''}`}
                >
                  Read ({messagesList.length - unreadMessagesCount})
                </button>
              </div>
            </div>

            <div className={styles.tableCard}>
              <div className={styles.tableWrapper}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Name</th>
                      <th>Subject</th>
                      <th>Message</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMessages.length === 0 ? (
                      <tr>
                        <td colSpan={6} className={styles.emptyState}>
                          {messagesLoading ? 'Loading messages...' : 'No messages found matching filter.'}
                        </td>
                      </tr>
                    ) : (
                      filteredMessages.flatMap((item) => {
                        const expanded = expandedMessageId === item._id;
                        const excerpt = item.message.length > 90 ? `${item.message.slice(0, 90)}…` : item.message;
                        return [
                          <tr key={item._id} style={!item.read ? { background: 'rgba(91,117,83,0.08)' } : undefined}>
                            <td>
                              {!item.read ? (
                                <span style={{ color: '#C8956C', background: 'rgba(200,149,108,0.2)', padding: '0.25rem 0.5rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                                  New
                                </span>
                              ) : (
                                <span style={{ color: '#8C9988', background: 'rgba(255,255,255,0.06)', padding: '0.25rem 0.5rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                                  Read
                                </span>
                              )}
                            </td>
                            <td style={{ fontSize: '0.75rem', color: '#8C9988', whiteSpace: 'nowrap' }}>
                              {new Date(item.createdAt).toLocaleDateString()}
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{item.name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#8C9988' }}>{item.email}</div>
                              {item.phone && (
                                <div style={{ fontSize: '0.75rem', color: '#8C9988' }}>{item.phone}</div>
                              )}
                            </td>
                            <td style={{ fontSize: '0.8125rem', color: '#B5C2B1' }}>
                              {item.subject || '—'}
                            </td>
                            <td style={{ maxWidth: '320px' }}>
                              <button
                                onClick={() => {
                                  setExpandedMessageId(expanded ? null : item._id);
                                  if (!item.read && !expanded) handleToggleMessageRead(item, true);
                                }}
                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', color: '#B5C2B1', fontSize: '0.8125rem', whiteSpace: 'normal' }}
                                title="Click to expand"
                              >
                                {expanded ? 'Hide full message' : excerpt}
                              </button>
                            </td>
                            <td>
                              <div className={styles.tableActions}>
                                {!item.read ? (
                                  <button
                                    onClick={() => handleToggleMessageRead(item, true)}
                                    className={`${styles.iconBtn} ${styles.iconBtnSuccess}`}
                                    title="Mark as read"
                                  >
                                    <Check size={16} />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleToggleMessageRead(item, false)}
                                    className={styles.iconBtn}
                                    title="Mark as unread"
                                  >
                                    <Mail size={16} />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteMessage(item._id)}
                                  className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                  title="Delete Permanently"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>,
                          expanded && (
                            <tr key={`${item._id}-expanded`}>
                              <td colSpan={6} style={{ background: 'rgba(91,117,83,0.05)', padding: '1rem 1.25rem' }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8C9988', marginBottom: '0.5rem' }}>
                                  Full message
                                </div>
                                {item.subject && (
                                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#E4EBE2', marginBottom: '0.5rem' }}>
                                    {item.subject}
                                  </div>
                                )}
                                <p style={{ color: '#D9E2D6', fontSize: '0.9rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>
                                  {item.message}
                                </p>
                              </td>
                            </tr>
                          ),
                        ];
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 4: STORE SETTINGS & BRANDING ===================== */}
        {activeTab === 'settings' && settings && (
          <form onSubmit={handleSaveSettings} style={{ maxWidth: '900px' }}>
            <div className={styles.tabHeader}>
              <div>
                <h2 className={styles.tabTitle}>Store Identity & Branding</h2>
                <p className={styles.tabSubtitle}>Control website name, logo, favicon, hero spotlight, and announcement messages.</p>
              </div>
              <button type="submit" className={styles.primaryActionBtn}>
                <Save size={16} />
                <span>Save All Settings</span>
              </button>
            </div>

            {/* Brand Identity */}
            <div className={styles.settingsCard}>
              <h3 className={styles.settingsCardTitle}>
                <Sparkles size={18} color="#79A36E" />
                <span>Store Identity & Logos</span>
              </h3>
              <p className={styles.settingsCardDesc}>Customizes site name, logo text, and browser tab icon.</p>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Website Name</label>
                  <input
                    type="text"
                    required
                    className={styles.formInput}
                    value={settings.siteName || ''}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    placeholder="Lets Organic"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Brand Tagline</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={settings.tagline || ''}
                    onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                    placeholder="Pure Organic Living"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Logo Text</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={settings.logoText || ''}
                    onChange={(e) => setSettings({ ...settings, logoText: e.target.value })}
                    placeholder="Lets Organic"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Logo Image URL</label>
                  <ImageUploader
                    value={settings.logoImageUrl || ''}
                    onChange={(url) => setSettings({ ...settings, logoImageUrl: url })}
                    canUpload={canUpload}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Favicon Icon URL</label>
                  <ImageUploader
                    value={settings.faviconUrl || ''}
                    onChange={(url) => setSettings({ ...settings, faviconUrl: url })}
                    canUpload={canUpload}
                  />
                </div>
              </div>
            </div>

            {/* Hero Section Config */}
            <div className={styles.settingsCard}>
              <h3 className={styles.settingsCardTitle}>
                <Package size={18} color="#79A36E" />
                <span>Hero Section Content</span>
              </h3>
              <p className={styles.settingsCardDesc}>Fine-tune the main headline and featured hero product on the homepage.</p>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Hero Badge</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={settings.heroBadge || ''}
                    onChange={(e) => setSettings({ ...settings, heroBadge: e.target.value })}
                    placeholder="Pure Organic Living"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Spotlight Hero Product</label>
                  <select
                    className={styles.formInput}
                    value={products.find(p => p.isHero)?.slug || ''}
                    onChange={async (e) => {
                      const selectedSlug = e.target.value;
                      if (!selectedSlug) return;
                      const p = products.find(prod => prod.slug === selectedSlug);
                      if (p) handleToggleHero(p);
                    }}
                  >
                    <option value="">— Select Star Product —</option>
                    {products.map(p => (
                      <option key={p.slug} value={p.slug}>
                        {p.name} (PKR {p.price?.toLocaleString() || p.price})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Hero Title</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={settings.heroTitle || ''}
                    onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                    placeholder="Discover Nature's Best Kept Secrets"
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Hero Subtitle / Description</label>
                  <textarea
                    className={`${styles.formInput} ${styles.textarea}`}
                    value={settings.heroSubtitle || ''}
                    onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                    placeholder="Shop curated organic skincare, superfoods, and wellness products..."
                  />
                </div>
              </div>
            </div>

            {/* Shipping & Delivery Controls */}
            <div className={styles.settingsCard}>
              <h3 className={styles.settingsCardTitle}>
                <Truck size={18} color="#79A36E" />
                <span>Shipping & Delivery Options</span>
              </h3>
              <p className={styles.settingsCardDesc}>Configure free delivery, standard delivery fee, and free shipping thresholds across Pakistan.</p>

              <div style={{ marginBottom: '1.25rem' }}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={settings.shipping?.freeDelivery ?? false}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        shipping: { ...settings.shipping, freeDelivery: e.target.checked },
                      })
                    }
                  />
                  <span>Enable 100% Free Delivery Storewide (No delivery charge for all customers)</span>
                </label>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Standard Delivery Fee (PKR)</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={settings.shipping?.deliveryFee ?? 250}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        shipping: { ...settings.shipping, deliveryFee: parseFloat(e.target.value) || 0 },
                      })
                    }
                    placeholder="250"
                  />
                  <span style={{ fontSize: '0.75rem', color: '#8C9988' }}>Charged when free delivery is not met.</span>
                </div>

                <div className={styles.formGroup}>
                  <label>Free Delivery Minimum Order (PKR)</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={settings.shipping?.freeDeliveryThreshold ?? 2500}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        shipping: { ...settings.shipping, freeDeliveryThreshold: parseFloat(e.target.value) || 0 },
                      })
                    }
                    placeholder="2500"
                  />
                  <span style={{ fontSize: '0.75rem', color: '#8C9988' }}>Orders at or above this PKR amount get automatic free shipping.</span>
                </div>
              </div>
            </div>

            {/* Announcement Ticker */}
            <div className={styles.settingsCard}>
              <h3 className={styles.settingsCardTitle}>
                <Megaphone size={18} color="#79A36E" />
                <span>Header Announcement Ticker</span>
              </h3>
              <p className={styles.settingsCardDesc}>Add or remove lines that scroll at the very top of the customer store.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(settings.announcements || []).map((msg, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={msg}
                      onChange={(e) => {
                        const copy = [...settings.announcements];
                        copy[i] = e.target.value;
                        setSettings({ ...settings, announcements: copy });
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const copy = settings.announcements.filter((_, idx) => idx !== i);
                        setSettings({ ...settings, announcements: copy });
                      }}
                      className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setSettings({
                      ...settings,
                      announcements: [...(settings.announcements || []), 'Fresh Organic Harvest Just In'],
                    })
                  }
                  className={styles.iconBtn}
                  style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem', marginTop: '0.5rem' }}
                >
                  <Plus size={14} /> Add Announcement Line
                </button>
              </div>
            </div>

            {/* Contact Details */}
            <div className={styles.settingsCard}>
              <h3 className={styles.settingsCardTitle}>
                <Mail size={18} color="#79A36E" />
                <span>Customer Support & Contact Info</span>
              </h3>
              <p className={styles.settingsCardDesc}>Displayed in the footer and checkout confirmation emails.</p>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Support Email</label>
                  <input
                    type="email"
                    className={styles.formInput}
                    value={settings.contactEmail || ''}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Support Phone</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={settings.contactPhone || ''}
                    onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Office / Warehouse Address</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={settings.contactAddress || ''}
                    onChange={(e) => setSettings({ ...settings, contactAddress: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </form>
        )}

        {/* ===================== TAB 9: TEAM ===================== */}
        {activeTab === 'team' && <TeamTab adminUser={adminUser} />}
      </main>

      {/* ===================== ADD / EDIT PRODUCT MODAL ===================== */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add New Organic Product'}
              </h3>
              <button onClick={() => setModalOpen(false)} className={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct}>
              <div className={styles.formGrid}>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Product Name *</label>
                  <input
                    type="text"
                    required
                    className={styles.formInput}
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="e.g. Organic Rosehip Face Oil"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Category *</label>
                  <select
                    className={styles.formInput}
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  >
                    {(categoriesList.length > 0 ? categoriesList : fallbackCategories).map((cat) => (
                      <option key={cat.slug || cat.id} value={cat.slug || cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Badge Tag</label>
                  <select
                    className={styles.formInput}
                    value={productForm.badge}
                    onChange={(e) => setProductForm({ ...productForm, badge: e.target.value })}
                  >
                    <option value="">None</option>
                    <option value="New">New</option>
                    <option value="Sale">Sale</option>
                    <option value="Bestseller">Bestseller</option>
                    <option value="Featured">Featured</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Price (PKR) *</label>
                  <input
                    type="number"
                    step="1"
                    required
                    className={styles.formInput}
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="3500"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Original / Strikethrough Price (PKR)</label>
                  <input
                    type="number"
                    step="1"
                    className={styles.formInput}
                    value={productForm.originalPrice}
                    onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value })}
                    placeholder="4500"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Tags (comma separated)</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={productForm.tagsText}
                    onChange={(e) => setProductForm({ ...productForm, tagsText: e.target.value })}
                    placeholder="Organic, Vegan, Cold-Pressed"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Stock Count</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className={styles.formInput}
                    value={productForm.stockCount}
                    onChange={(e) => setProductForm({ ...productForm, stockCount: e.target.value })}
                    placeholder="50"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Stock Status</label>
                  <div style={{ display: 'flex', alignItems: 'center', height: '42px', gap: '1rem' }}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={productForm.inStock}
                        onChange={(e) => setProductForm({ ...productForm, inStock: e.target.checked })}
                      />
                      <span>In Stock</span>
                    </label>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={productForm.isHero}
                        onChange={(e) => setProductForm({ ...productForm, isHero: e.target.checked })}
                      />
                      <span style={{ color: '#E5B288' }}>★ Spotlight as Hero</span>
                    </label>
                  </div>
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Product Description *</label>
                  <textarea
                    required
                    className={`${styles.formInput} ${styles.textarea}`}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="Describe the organic benefits, ingredients, and usage instructions..."
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Key Features (one per line)</label>
                  <textarea
                    className={`${styles.formInput} ${styles.textarea}`}
                    value={productForm.featuresText}
                    onChange={(e) => setProductForm({ ...productForm, featuresText: e.target.value })}
                    placeholder="100% pure organic cold-pressed&#10;Rich in antioxidants & vitamins&#10;Chemical and pesticide free"
                  />
                </div>
              </div>

              {/* --- IMAGE REORDERING & CAROUSEL MANAGER --- */}
              <div className={styles.mediaSection}>
                <div className={styles.mediaSectionTitle}>
                  <ImageIcon size={16} color="#79A36E" />
                  <span>Product Images & Carousel Sequence (Reorderable)</span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#8C9988', marginBottom: '0.75rem' }}>
                  Use the Up/Down arrows to reorder how images will appear in the customer slider. The top image is the primary cover.
                </p>

                <div style={{ marginBottom: '1rem' }}>
                  <ImageUploader
                    value=""
                    onChange={appendProductImage}
                    label="Add an image (upload or paste a URL)"
                    canUpload={canUpload}
                  />
                </div>

                <div className={styles.reorderList}>
                  {productForm.images.map((img, i) => (
                    <div key={i} className={styles.reorderItem}>
                      <span className={styles.reorderIndex}>#{i + 1}</span>
                      <SafeImage src={img} alt="" className={styles.reorderThumb} width={44} height={44} />
                      <span className={styles.reorderUrl}>{img}</span>
                      <div className={styles.reorderControls}>
                        <button
                          type="button"
                          onClick={() => moveImage(i, -1)}
                          disabled={i === 0}
                          className={styles.iconBtn}
                          title="Move earlier in slider"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(i, 1)}
                          disabled={i === productForm.images.length - 1}
                          className={styles.iconBtn}
                          title="Move later in slider"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                          title="Remove image"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* --- VIDEO CAROUSEL MANAGER --- */}
              <div className={styles.mediaSection}>
                <div className={styles.mediaSectionTitle}>
                  <Video size={16} color="#79A36E" />
                  <span>Product Carousel Videos (MP4, YouTube, Vimeo)</span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#8C9988', marginBottom: '0.75rem' }}>
                  Add video demonstration URLs that customers can play directly in the product detail carousel.
                </p>

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input
                    type="url"
                    className={styles.formInput}
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    placeholder="e.g. https://.../sample.mp4 or https://www.youtube.com/watch?v=..."
                  />
                  <button type="button" onClick={addVideo} className={styles.primaryActionBtn}>
                    <Plus size={16} /> Add Video
                  </button>
                </div>

                <div className={styles.reorderList}>
                  {productForm.videos.map((vid, i) => (
                    <div key={i} className={styles.reorderItem}>
                      <Video size={20} color="#79A36E" />
                      <span className={styles.reorderUrl}>{vid}</span>
                      <button
                        type="button"
                        onClick={() => removeVideo(i)}
                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className={styles.iconBtn}
                  style={{ padding: '0.75rem 1.5rem' }}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.primaryActionBtn} style={{ padding: '0.75rem 1.75rem' }}>
                  <Save size={16} /> Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal (Add / Edit) */}
      {categoryModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setCategoryModalOpen(false)}>
          <div className={styles.modalCard} style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Add New Category'}
              </h3>
              <button onClick={() => setCategoryModalOpen(false)} className={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory}>
              <div className={styles.formGrid}>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Category Name *</label>
                  <input
                    type="text"
                    required
                    className={styles.formInput}
                    value={categoryForm.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setCategoryForm({
                        ...categoryForm,
                        name: newName,
                        slug: !editingCategory
                          ? newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
                          : categoryForm.slug,
                      });
                    }}
                    placeholder="e.g. Herbal Teas, Bath & Body, Essential Oils"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>URL Slug *</label>
                  <input
                    type="text"
                    required
                    className={styles.formInput}
                    value={categoryForm.slug}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''),
                      })
                    }
                    placeholder="e.g. herbal-teas"
                  />
                  <small style={{ color: '#8C9988', fontSize: '0.75rem', marginTop: '4px' }}>
                    Store filter path: /shop?category={categoryForm.slug || 'slug'}
                  </small>
                </div>

                <div className={styles.formGroup}>
                  <label>Badge Tag</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={categoryForm.badge}
                    onChange={(e) => setCategoryForm({ ...categoryForm, badge: e.target.value })}
                    placeholder="e.g. 6 Formulas, Fresh Harvest"
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Tagline / Pitch</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={categoryForm.tagline}
                    onChange={(e) => setCategoryForm({ ...categoryForm, tagline: e.target.value })}
                    placeholder="e.g. Nourish & Glow, Daily Rituals"
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <ImageUploader
                    value={categoryForm.image || ''}
                    onChange={(url) => setCategoryForm({ ...categoryForm, image: url })}
                    label="Cover Image"
                    canUpload={canUpload}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className={styles.iconBtn}
                  style={{ padding: '0.75rem 1.5rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={categorySaving}
                  className={styles.primaryActionBtn}
                  style={{ padding: '0.75rem 1.75rem' }}
                >
                  <Save size={16} />{' '}
                  {categorySaving
                    ? 'Saving...'
                    : editingCategory
                    ? 'Update Category'
                    : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupon Modal */}
      {couponModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setCouponModalOpen(false)}>
          <div className={styles.modalCard} style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add New Coupon</h3>
              <button onClick={() => setCouponModalOpen(false)} className={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon}>
              <div className={styles.formGrid}>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Coupon Code *</label>
                  <input
                    type="text"
                    required
                    className={styles.formInput}
                    value={couponForm.code}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        code: e.target.value.toUpperCase().replace(/[^A-Z0-9-_]/g, ''),
                      })
                    }
                    placeholder="e.g. ORGANIC25, WELCOME500"
                    style={{ textTransform: 'uppercase' }}
                  />
                  <small style={{ color: '#8C9988', fontSize: '0.75rem', marginTop: '4px' }}>
                    Stored uppercase — customers can type it in any case.
                  </small>
                </div>

                <div className={styles.formGroup}>
                  <label>Discount Type *</label>
                  <select
                    className={styles.formInput}
                    value={couponForm.type}
                    onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value })}
                  >
                    <option value="percent">Percent (%)</option>
                    <option value="flat">Flat (PKR)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Discount Value *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    className={styles.formInput}
                    value={couponForm.value}
                    onChange={(e) => setCouponForm({ ...couponForm, value: e.target.value })}
                    placeholder={couponForm.type === 'percent' ? 'e.g. 25' : 'e.g. 500'}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Min Order (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className={styles.formInput}
                    value={couponForm.minOrder}
                    onChange={(e) => setCouponForm({ ...couponForm, minOrder: e.target.value })}
                    placeholder="0 = no minimum"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className={styles.formInput}
                    value={couponForm.usageLimit}
                    onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value })}
                    placeholder="Empty = unlimited"
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Expiry Date</label>
                  <input
                    type="date"
                    className={styles.formInput}
                    value={couponForm.expiresAt}
                    onChange={(e) => setCouponForm({ ...couponForm, expiresAt: e.target.value })}
                  />
                  <small style={{ color: '#8C9988', fontSize: '0.75rem', marginTop: '4px' }}>
                    Leave empty for a coupon that never expires.
                  </small>
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={couponForm.active}
                      onChange={(e) => setCouponForm({ ...couponForm, active: e.target.checked })}
                    />
                    <span>Active — customers can use this coupon right away</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setCouponModalOpen(false)}
                  className={styles.iconBtn}
                  style={{ padding: '0.75rem 1.5rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={couponSaving}
                  className={styles.primaryActionBtn}
                  style={{ padding: '0.75rem 1.75rem' }}
                >
                  <Save size={16} /> {couponSaving ? 'Saving...' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className={styles.modalOverlay} onClick={() => setSelectedOrder(null)}>
          <div className={styles.modalCard} style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Order {selectedOrder.orderNumber}</h3>
              <button onClick={() => setSelectedOrder(null)} className={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            {/* Status row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  ...orderStatusStyle(selectedOrder.status),
                  padding: '0.35rem 0.75rem',
                  borderRadius: 4,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textTransform: 'capitalize',
                }}
              >
                {selectedOrder.status}
              </span>
              <select
                className={styles.formInput}
                style={{ maxWidth: '200px' }}
                value={selectedOrder.status}
                disabled={orderStatusUpdating}
                onChange={(e) => handleUpdateOrderStatus(selectedOrder._id, e.target.value)}
                aria-label="Update order status"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
              {orderStatusUpdating && <span style={{ fontSize: '0.8rem', color: '#8C9988' }}>Updating...</span>}
              <span style={{ fontSize: '0.8rem', color: '#8C9988', marginLeft: 'auto' }}>
                Placed {new Date(selectedOrder.createdAt).toLocaleString()}
              </span>
            </div>

            {/* Line items */}
            <h4 style={{ color: '#FFFFFF', marginBottom: '0.5rem' }}>Items</h4>
            <div style={{ marginBottom: '1.5rem' }}>
              {(selectedOrder.items || []).map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'center',
                    padding: '0.6rem 0',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <SafeImage
                    src={item.image || 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=100&h=100&fit=crop'}
                    alt={item.name}
                    className={styles.productThumb}
                    width={48}
                    height={48}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#8C9988' }}>
                      PKR {item.price?.toLocaleString()} × {item.quantity}
                      {item.slug && <span> · /{item.slug}</span>}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                    PKR {(item.price * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div style={{ marginBottom: '1.5rem', maxWidth: '320px', marginLeft: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.9rem', color: '#B5C2B1' }}>
                <span>Subtotal</span>
                <span>PKR {selectedOrder.subtotal?.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.9rem', color: '#B5C2B1' }}>
                <span>Discount{selectedOrder.couponCode ? ` (${selectedOrder.couponCode})` : ''}</span>
                <span>− PKR {selectedOrder.discount?.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.9rem', color: '#B5C2B1' }}>
                <span>Delivery Fee</span>
                <span>{selectedOrder.shipping === 0 ? 'FREE' : `PKR ${selectedOrder.shipping?.toLocaleString()}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontWeight: 800, fontSize: '1.05rem', color: '#FFFFFF', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '0.25rem' }}>
                <span>Total</span>
                <span>PKR {selectedOrder.total?.toLocaleString()}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#8C9988', textAlign: 'right' }}>
                Payment: {selectedOrder.paymentMethod || 'COD'}
              </div>
            </div>

            {/* Customer */}
            <h4 style={{ color: '#FFFFFF', marginBottom: '0.5rem' }}>Customer & Delivery</h4>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '1rem', fontSize: '0.9rem', lineHeight: 1.8 }}>
              <div><strong style={{ color: '#FFFFFF' }}>{selectedOrder.customer?.fullName}</strong></div>
              <div style={{ color: '#B5C2B1' }}>{selectedOrder.customer?.phone} · {selectedOrder.customer?.email}</div>
              <div style={{ color: '#B5C2B1', marginTop: '0.5rem' }}>
                {selectedOrder.customer?.address}<br />
                {selectedOrder.customer?.city}
                {selectedOrder.customer?.state ? `, ${selectedOrder.customer.state}` : ''} {selectedOrder.customer?.zip}<br />
                {selectedOrder.customer?.country}
              </div>
              {selectedOrder.customer?.notes && (
                <div style={{ color: '#E5B288', marginTop: '0.5rem' }}>
                  <strong>Notes:</strong> {selectedOrder.customer.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
