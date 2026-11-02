"use client";

import { useActionState, useState } from "react";
import { importList } from "./actions";
import { Button, Input, Label } from "@/components/ui";

export default function ImportListForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(importList, null);

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Import from LeetCode
      </Button>
    );
  }

  return (
    <form action={formAction} className="mb-6 flex w-full flex-col gap-4 rounded-lg border border-border p-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="import-source">LeetCode list link, or problem links</Label>
        <textarea
          id="import-source"
          name="source"
          required
          rows={4}
          placeholder={"https://leetcode.com/problem-list/abc123xy/\n\nor one problem per line:\nhttps://leetcode.com/problems/two-sum/\nlru-cache"}
          className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-foreground-tertiary transition-colors duration-150 hover:border-border-strong focus:border-border-strong focus:outline-none focus-visible:outline-2 focus-visible:outline-accent"
        />
        <p className="text-xs text-foreground-tertiary">
          The list must be public on LeetCode (open it → share → set to Public).
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="import-name">Name (optional)</Label>
        <Input id="import-name" name="name" maxLength={100} placeholder="Uses the LeetCode list's name" />
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Importing…" : "Import"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
