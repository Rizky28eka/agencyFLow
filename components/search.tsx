'use client';

import * as React from "react";
import { Input } from "@/components/ui/input";
import { IconSearch } from "@tabler/icons-react";

export function Search() {
  return (
    <div className="relative w-full max-w-sm items-center">
      <Input id="search" type="text" placeholder="Search..." className="pl-10" />
      <span className="absolute start-0 inset-y-0 flex items-center justify-center px-2">
        <IconSearch className="size-4 text-muted-foreground" />
      </span>
    </div>
  );
}
