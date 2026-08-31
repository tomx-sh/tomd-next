"use client";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { StyledLink } from "@/components/styled-link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function formatSegment(segment: string) {
  return decodeURIComponent(segment)
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function SiteBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const crumbs = [
    { href: "/", label: "Home" },
    ...segments.map((segment, index) => ({
      href: `/${segments.slice(0, index + 1).join("/")}`,
      label: formatSegment(segment),
    })),
  ];

  return (
    <Breadcrumb className="font-mono uppercase">
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isCurrentPage = index === crumbs.length - 1;
          const content = index === 0 ? <span>Home</span> : crumb.label;

          return (
            <Fragment key={crumb.href}>
              {index > 0 ? <BreadcrumbSeparator /> : null}
              <BreadcrumbItem>
                {isCurrentPage ? (
                  <BreadcrumbPage>{content}</BreadcrumbPage>
                ) : (
                  <StyledLink href={crumb.href}>{content}</StyledLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
