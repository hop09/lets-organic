import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { SettingsProvider } from '@/context/SettingsContext';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import CartSidebar from '@/components/CartSidebar/CartSidebar';
import ToastContainer from '@/components/Toast/ToastContainer';

export const metadata = {
  title: 'Lets Organic — Pure Organic Living',
  description: 'Discover premium certified organic skincare, superfoods, wellness remedies, and botanical essentials. Shop Lets Organic for a pure, sustainable, vibrant lifestyle.',
  keywords: 'organic, natural skincare, certified superfoods, botanical oils, eco-friendly, clean living, lets organic',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SettingsProvider>
          <CartProvider>
            <WishlistProvider>
              <Header />
              <main>{children}</main>
              <Footer />
              <CartSidebar />
              <ToastContainer />
            </WishlistProvider>
          </CartProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
