import { SiteBreadcrumbs } from "@/components/site-breadcrumbs";

export default function ArticlesLayout({ children }: LayoutProps<"/articles">) {
  return (
    <>
      <header className="flex items-center justify-between gap-4 p-4">
        <SiteBreadcrumbs />
      </header>
      {children}
    </>
  );
}
