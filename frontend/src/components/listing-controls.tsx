"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { changeListing } from "@/app/listings/manage-actions";
import { Button } from "@/components/ui/button";

export function ListingControls({
  id,
  status,
  revision,
}: {
  id: string;
  status: "draft" | "published";
  revision: number;
}) {
  const [state, action, pending] = useActionState(changeListing, {});
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <div className="space-y-3">
      <form action={action}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="revision" value={revision} />
        <fieldset
          disabled={pending}
          className="flex flex-wrap items-center gap-3"
        >
          <Button asChild variant="outline" size="sm">
            <Link href={`/listings/${id}/edit`}>Edit</Link>
          </Button>
          <Button
            size="sm"
            type="submit"
            name="operation"
            value={status === "draft" ? "publish" : "unpublish"}
          >
            {pending ? "Saving…" : status === "draft" ? "Publish" : "Unpublish"}
          </Button>
          {!confirmDelete ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </Button>
          ) : (
            <>
              <p className="w-full text-sm">
                Delete this listing? It will disappear from your dashboard and
                public pages. Historical booking records are retained.
              </p>
              <Button
                type="submit"
                size="sm"
                name="operation"
                value="delete"
                className="bg-destructive text-white"
              >
                Confirm delete
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(false)}
              >
                Keep listing
              </Button>
            </>
          )}
        </fieldset>
      </form>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="text-sm text-primary">
          {state.success}
        </p>
      )}
    </div>
  );
}
