"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { MiniIcon } from "@/components/mini-icon";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

// Pixolletta's capital glyphs occupy 800 of its 1000 em units.
const CAP_HEIGHT = "0.8em";
const BASELINE_CORRECTION = "0.14em";

function formatSegment(segment: string) {
  return decodeURIComponent(segment)
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function SiteBreadcrumbsPixel({ className }: { className?: string }) {
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
    <Breadcrumb className={cn("uppercase", className)}>
      <BreadcrumbList style={{ fontSize: "inherit", lineHeight: CAP_HEIGHT }}>
        {crumbs.map((crumb, index) => {
          const isCurrentPage = index === crumbs.length - 1;
          const content =
            index === 0 ? (
              <>
                <MiniIcon name="house" size={CAP_HEIGHT} />
                <span className="sr-only">Home</span>
              </>
            ) : (
              <span
                className="inline-block"
                style={{ transform: `translateY(${BASELINE_CORRECTION})` }}
              >
                {crumb.label}
              </span>
            );

          return (
            <Fragment key={crumb.href}>
              {index > 0 ? (
                <BreadcrumbSeparator className="flex items-center">
                  <MiniIcon name="chevron-right" size={CAP_HEIGHT} />
                </BreadcrumbSeparator>
              ) : null}
              <BreadcrumbItem>
                {isCurrentPage ? (
                  <BreadcrumbPage className="flex items-center">
                    {content}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    className="flex items-center"
                    render={<Link href={crumb.href} />}
                  >
                    {content}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
