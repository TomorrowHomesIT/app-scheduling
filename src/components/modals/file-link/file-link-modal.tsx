"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Paperclip } from "lucide-react";
import type { IJobTaskUrl } from "@/models/job.model";
import { getGoogleDriveWebViewLink } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ModalTriggerButton } from "@/components/modal-trigger-button";

interface FileLinkModalProps {
  links: IJobTaskUrl[];
  onSave: (links: IJobTaskUrl[]) => void;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FileLinkModal({ links, title, open, onOpenChange }: FileLinkModalProps) {
  const [localLinks, setLocalLinks] = useState<IJobTaskUrl[]>(links);

  useEffect(() => {
    setLocalLinks(links);
  }, [links]);

  const handleOpenLink = (link: IJobTaskUrl) => {
    const url = link.googleDriveId ? getGoogleDriveWebViewLink(link.googleDriveId) : link.url;

    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-2 overflow-y-auto">
          {localLinks.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center border rounded-md">
              No attachments available
            </div>
          ) : (
            <div className="space-y-2 mt-2 flex flex-col">
              {localLinks.map((link, index) => (
                <Button
                  key={`${link.name}-${link.googleDriveId || link.url}-${index}`}
                  variant="outline"
                  size="lg"
                  onClick={() => handleOpenLink(link)}
                  className="flex-1 justify-between min-w-0 py-4 px-4 h-auto box-border"
                >
                  <div className="flex text-left gap-4 w-full items-center">
                    <ExternalLink className="h-5 w-5 max-w-5" />
                    <div className="flex flex-col gap-1 ">
                      <div className="flex items-center gap-1">
                        <div className="font-medium text-sm truncate">{link.name}</div>
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>
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
          {count > 1 && <span className="text-xs">{count}</span>}
        </Badge>
      </ModalTriggerButton>
      <FileLinkModal open={open} links={links} onSave={onSave} title={title} onOpenChange={setOpen} />
    </>
  );
}
