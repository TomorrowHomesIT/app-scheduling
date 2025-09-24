import { JobsTable } from "@/app/jobs/jobs-table";
import useOwnersStore from "@/store/owners-store";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/components/auth/auth-context";

export default function JobsPage() {
  const { owners } = useOwnersStore();
  const { user } = useAuth();

  const currentUserOwner = owners.find((owner) => owner.userId === user?.id);

  const visibleOwners = currentUserOwner ? [currentUserOwner] : owners;

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="border-b bg-background">
        <PageHeader title="Jobs" backLink="/" description="View your active and on-going jobs"></PageHeader>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="xl:max-w-6xl max-w-4xl mx-auto">
          <JobsTable owners={visibleOwners} mode="current" />
        </div>
      </div>
    </div>
  );
}
