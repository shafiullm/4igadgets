import StoreApp from "@/components/StoreApp";

// The entire interactive storefront + admin is a client app (preserving the
// exported prototype's design and presenter chrome). All data comes from the
// D1-backed API routes under /app/api.
export default function Page() {
  return <StoreApp />;
}
