import TopNavigation from '@cloudscape-design/components/top-navigation';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const utilities = [];
  if (user) {
    utilities.push({
      type: 'menu-dropdown',
      text: user.role === 'admin' ? 'Admin' : 'Customer',
      iconName: 'user-profile',
      items: [{ id: 'signout', text: 'Sign out' }],
      onItemClick: ({ detail }) => {
        if (detail.id === 'signout') {
          logout();
          navigate('/login');
        }
      },
    });
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopNavigation
        identity={{
          href: user?.role === 'admin' ? '/admin' : '/onboarding',
          title: 'AnyBank',
          logo: { src: '/logo.svg', alt: 'AnyBank logo' },
        }}
        utilities={utilities}
      />
      <main style={{ flex: 1 }}>{children}</main>
      <footer style={{
        textAlign: 'center',
        padding: '16px 24px',
        fontSize: 12,
        color: '#687078',
        borderTop: '1px solid #e9ebed',
      }}>
        <div>© 2026 AnyBank. All rights reserved.</div>
        <div style={{ marginTop: 4 }}>
          AnyBank is regulated by the Bangko Sentral ng Pilipinas. Member, Philippine Deposit Insurance Corporation (PDIC). Deposits are insured up to ₱500,000.
        </div>
      </footer>
    </div>
  );
}
