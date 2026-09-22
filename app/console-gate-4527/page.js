'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Sparkles,
  Save,
  CheckCircle2,
  AlertTriangle,
  Truck,
  Tag,
  FolderPlus,
  Layers,
} from 'lucide-react';
import { categories as fallbackCategories } from '@/data/products';
import styles from './admin.module.css';

export default function AdminConsolePage() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [loginEmail, setLoginEmail] = useState('admin@letsorganic.store');
  const [loginPassword, setLoginPassword] = useState('waqar4527');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Dashboard state
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'promo' | 'feedback' | 'settings'
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  // Data states
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [feedbackList, setFeedbackList] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackFilter, setFeedbackFilter] = useState('all'); // 'all' | 'pending' | 'approved'
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
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');

  // Check auth session
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAuthChecking(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
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
      fetchProducts();
      fetchFeedback();
      fetchSettings();
      fetchCategories();
    }
  }, [isAuthenticated, fetchProducts, fetchFeedback, fetchSettings, fetchCategories]);

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
        setIsAuthenticated(true);
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
    setNewImageUrl('');
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

  const addImage = () => {
    if (!newImageUrl.trim()) return;
    setProductForm({ ...productForm, images: [...productForm.images, newImageUrl.trim()] });
    setNewImageUrl('');
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
                placeholder="admin@letsorganic.store"
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
        <button
          className={`${styles.navTab} ${activeTab === 'products' ? styles.navTabActive : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <Package size={16} />
          <span>Products Catalog ({products.length})</span>
        </button>

        <button
          className={`${styles.navTab} ${activeTab === 'categories' ? styles.navTabActive : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <Tag size={16} />
          <span>Categories ({categoriesList.length})</span>
        </button>

        <button
          className={`${styles.navTab} ${activeTab === 'promo' ? styles.navTabActive : ''}`}
          onClick={() => setActiveTab('promo')}
        >
          <Megaphone size={16} />
          <span>Promotion Banner</span>
        </button>

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

        <button
          className={`${styles.navTab} ${activeTab === 'settings' ? styles.navTabActive : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={16} />
          <span>Store Settings & Branding</span>
        </button>
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
                              <img
                                src={prod.images?.[0] || 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=100&h=100&fit=crop'}
                                alt={prod.name}
                                className={styles.productThumb}
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
                      <img
                        src={cat.image || 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&h=700&fit=crop'}
                        alt={cat.name}
                        className={styles.categoryCardImg}
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
                  <input
                    type="url"
                    className={styles.formInput}
                    value={settings.promotionBanner?.imageUrl || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        promotionBanner: { ...settings.promotionBanner, imageUrl: e.target.value },
                      })
                    }
                    placeholder="https://..."
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
                  <label>Favicon Icon URL</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={settings.faviconUrl || ''}
                    onChange={(e) => setSettings({ ...settings, faviconUrl: e.target.value })}
                    placeholder="/favicon.svg"
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

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input
                    type="url"
                    className={styles.formInput}
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Paste image URL (e.g. https://images.unsplash.com/...)"
                  />
                  <button type="button" onClick={addImage} className={styles.primaryActionBtn}>
                    <Plus size={16} /> Add Image
                  </button>
                </div>

                <div className={styles.reorderList}>
                  {productForm.images.map((img, i) => (
                    <div key={i} className={styles.reorderItem}>
                      <span className={styles.reorderIndex}>#{i + 1}</span>
                      <img src={img} alt="" className={styles.reorderThumb} />
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
                  <label>Cover Image URL</label>
                  <input
                    type="url"
                    className={styles.formInput}
                    value={categoryForm.image}
                    onChange={(e) => setCategoryForm({ ...categoryForm, image: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-..."
                  />
                  {categoryForm.image && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        height: '130px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      <img
                        src={categoryForm.image}
                        alt="Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  )}
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
    </div>
  );
}
