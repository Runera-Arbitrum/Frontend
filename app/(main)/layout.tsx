import AuthGuard from '@/components/layout/AuthGuard';
import BottomNav from '@/components/layout/BottomNav';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="mobile-container pb-24">
        {children}
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
