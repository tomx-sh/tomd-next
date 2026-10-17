"use client";

import { ChevronDownIcon, ChevronRightIcon, DownloadIcon } from "lucide-react";
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
  return (
    <header className="flex justify-end p-3 print:hidden">
      <ButtonGroup aria-label="Resume downloads">
        <Button
          variant="outline"
          nativeButton={false}
          render={<a href="/cv-tomd.pdf" download="cv-tomd.pdf" />}
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
                render={<a href="/cv-md" download="cv-tomd.md" />}
              >
                <DownloadIcon />
                .md
              </DropdownMenuItem>
              <DropdownMenuItem
                aria-label="Copy terminal command: curl cv.tomd.sh"
                onClick={() => navigator.clipboard.writeText("curl cv.tomd.sh")}
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
