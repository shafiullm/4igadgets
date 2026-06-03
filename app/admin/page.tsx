import StoreApp from "@/components/StoreApp";

// Private admin entry point at /admin. It boots the app straight into the admin
// area; the server-guarded admin session decides whether the dashboard or the
// admin login screen is shown. There is no public link to this route from the
// storefront.
export default function AdminPage() {
  return <StoreApp initialRoute="admin-dashboard" />;
}
