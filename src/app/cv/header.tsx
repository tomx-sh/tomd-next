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
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    if (!copyStatus) return;

    const timeout = setTimeout(() => setCopyStatus(""), 3000);
    return () => clearTimeout(timeout);
  }, [copyStatus]);

  async function copyCommand() {
    setCopyStatus("");
    try {
      await navigator.clipboard.writeText("curl cv.tomd.sh");
      setCopyStatus("Command copied!");
    } catch {
      setCopyStatus("Could not copy command. Please try again.");
    }
  }

  return (
    <header className="flex items-center justify-end gap-3 p-3 print:hidden">
      <span role="status" className="text-sm text-muted-foreground">
        {copyStatus}
      </span>
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
        <DropdownMenu>
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
                aria-label="Copy terminal command: curl cv.tomd.sh"
                onClick={copyCommand}
              >
                <ChevronRightIcon className="translate-y-px" />
                <code className="font-mono">curl cv.tomd.sh</code>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </ButtonGroup>
    </header>
  );
}
