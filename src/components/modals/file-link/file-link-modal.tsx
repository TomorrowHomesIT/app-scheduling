"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, ExternalLink, AlertCircle, Paperclip } from "lucide-react";
import type { IJobTaskUrl } from "@/models/job.model";
import { isValidUrl, getGoogleDriveWebViewLink, extractGoogleDriveId, isValidGoogleDriveId, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ModalTriggerButton } from "@/components/ui/buttons/modal-trigger-button";

interface FileLinkModalProps {
  links: IJobTaskUrl[];
  onSave: (links: IJobTaskUrl[]) => void;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FileLinkModal({ links, onSave, title, open, onOpenChange }: FileLinkModalProps) {
  const [localLinks, setLocalLinks] = useState<IJobTaskUrl[]>(links);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [urlError, setUrlError] = useState("");

  useEffect(() => {
    setLocalLinks(links);
  }, [links]);

  // Check if there are any changes by comparing current links with original
  const hasChanges = () => {
    if (localLinks.length !== links.length) return true;

    // Deep comparison of links
    return localLinks.some((localLink, index) => {
      const originalLink = links[index];
      if (!originalLink) return true;

      return (
        localLink.name !== originalLink.name ||
        localLink.url !== originalLink.url ||
        localLink.googleDriveId !== originalLink.googleDriveId
      );
    });
  };

  const handleAddLink = () => {
    if (!newUrl.trim()) {
      setUrlError("URL or Google Drive ID is required");
      return;
    }

    const trimmedUrl = newUrl.trim();
    const newLink: IJobTaskUrl = { name: newName.trim() };

    // Check if it's a Google Drive URL or ID
    const googleDriveId = extractGoogleDriveId(trimmedUrl);

    if (googleDriveId && isValidGoogleDriveId(googleDriveId)) {
      // It's a Google Drive ID or URL
      newLink.googleDriveId = googleDriveId;
    } else if (isValidUrl(trimmedUrl)) {
      // It's a regular URL
      newLink.url = trimmedUrl;
    } else {
      setUrlError("Please enter a valid URL or Google Drive ID");
      return;
    }

    setLocalLinks([...localLinks, newLink]);
    setNewName("");
    setNewUrl("");
    setUrlError("");
  };

  const handleRemoveLink = (index: number) => {
    setLocalLinks(localLinks.filter((_, i) => i !== index));
  };

  const handleOpenLink = (link: IJobTaskUrl) => {
    const url = link.googleDriveId ? getGoogleDriveWebViewLink(link.googleDriveId) : link.url;

    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleSave = () => {
    onSave(localLinks);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setLocalLinks(links);
    setNewName("");
    setNewUrl("");
    setUrlError("");
    onOpenChange(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newName.trim() && newUrl.trim()) {
      e.preventDefault();
      handleAddLink();
    }
  };

  const getDisplayUrl = (link: IJobTaskUrl): string => {
    if (link.googleDriveId) {
      return getGoogleDriveWebViewLink(link.googleDriveId);
    }

    return link.url || "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <div className="flex flex-col gap-2">
            <div>
              <Label htmlFor="url">Google Drive Link</Label>
              <Input
                id="url"
                value={newUrl}
                onChange={(e) => {
                  setNewUrl(e.target.value);
                  setUrlError("");
                }}
                onKeyDown={handleKeyPress}
                placeholder="https://drive.google.com/..."
                className={cn(urlError && "border-red-500")}
              />
              {urlError && (
                <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  {urlError}
                </div>
              )}
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
              <div className="w-full">
                <Label htmlFor="name">Display name</Label>
                <Input
                  id="name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="e.g. SOL"
                />
              </div>
              <Button
                onClick={handleAddLink}
                disabled={!newName.trim() || !newUrl.trim()}
                variant="default"
                className="w-full"
              >
                Add Link
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2 py-2 overflow-y-auto">
          <Label>Links ({localLinks.length})</Label>
          {localLinks.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center border rounded-md">No links added yet</div>
          ) : (
            <div className="space-y-2 mt-2">
              {localLinks.map((link, index) => (
                <div
                  key={`${link.name}-${link.googleDriveId || link.url}-${index}`}
                  className="grid grid-cols-[1fr_auto] items-stretch gap-2"
                >
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleOpenLink(link)}
                    className="flex-1 justify-between min-w-0 py-2 px-4 h-auto box-border"
                  >
                    <div className="flex flex-col text-left gap-1 w-full">
                      <div className="flex items-center gap-1">
                        <ExternalLink className="h-2 w-3 max-w-3" />
                        <div className="font-medium text-sm truncate">{link.name}</div>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{getDisplayUrl(link)}</div>
                    </div>
                  </Button>
                  <Button
                    variant="destructive"
                    size="lg"
                    onClick={() => handleRemoveLink(index)}
                    className="h-full min-h-full"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges()}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FileLinkModalTrigger({
  links,
  onSave,
  title,
}: {
  links: IJobTaskUrl[];
  onSave: (links: IJobTaskUrl[]) => void;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const count = links.length;

  return (
    <>
      <ModalTriggerButton hasValue={count > 0} setOpen={setOpen}>
        <Badge variant="secondary" className="gap-1 p-1 h-auto justify-start">
          <Paperclip className="h-3 w-3" />
          <span className="text-xs">{count}</span>
        </Badge>
      </ModalTriggerButton>
      <FileLinkModal open={open} links={links} onSave={onSave} title={title} onOpenChange={setOpen} />
    </>
  );
}
