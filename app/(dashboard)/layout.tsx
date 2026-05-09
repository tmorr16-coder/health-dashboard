import BottomNav from "./_components/BottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ paddingBottom: 72 }}>
      {children}
      <BottomNav />
    </div>
  );
}
