"use client";

import { ChevronDownIcon, ChevronRightIcon, DownloadIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function CvHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    if (!isOpen || copyStatus !== "Copied") return;

    const timeout = setTimeout(() => {
      setIsOpen(false);
      setCopyStatus("");
    }, 2000);
    return () => clearTimeout(timeout);
  }, [isOpen, copyStatus]);

  async function copyCommand() {
    setCopyStatus("");
    try {
      await navigator.clipboard.writeText("curl cv.tomd.sh");
      setCopyStatus("Copied");
    } catch {
      setCopyStatus("Could not copy. Try again.");
    }
  }

  return (
    <header className="flex justify-end p-3 print:hidden">
      <ButtonGroup aria-label="Resume downloads">
        <Button
          variant="outline"
          nativeButton={false}
          render={<a href="/cv.pdf" download="cv-tomd.pdf" />}
          aria-label="Download resume as PDF"
        >
          <DownloadIcon />
          PDF
        </Button>
        <DropdownMenu
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open);
            setCopyStatus("");
          }}
        >
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                aria-label="More resume options"
              >
                <ChevronDownIcon />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-max whitespace-nowrap">
            <DropdownMenuGroup>
              <DropdownMenuItem
                render={<a href="/cv.md" download="cv-tomd.md" />}
              >
                <DownloadIcon />
                .md
              </DropdownMenuItem>
              <DropdownMenuItem
                aria-label={
                  copyStatus || "Copy terminal command: curl cv.tomd.sh"
                }
                closeOnClick={false}
                onClick={copyCommand}
              >
                <ChevronRightIcon className="translate-y-px" />
                <span aria-live="polite">
                  {copyStatus || (
                    <code className="font-mono">curl cv.tomd.sh</code>
                  )}
                </span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </ButtonGroup>
    </header>
  );
}
