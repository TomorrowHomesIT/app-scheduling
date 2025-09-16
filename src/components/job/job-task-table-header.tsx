import { TableHead, TableHeader, TableRow, Table } from "../ui/table";

// This component is seperate from the table data so we can use it as a sticky header with the accordion

export function JobTaskTableHeader() {
  return (
    <div className="-mx-4 px-4 lg:mx-0 lg:px-0">
      <Table className="sticky top-0 bg-white z-100">
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-20 bg-white w-4"></TableHead>
            <TableHead className="sticky left-4 z-20 bg-white w-32 lg:w-48 xl:w-64 text-gray-600 text-xs after:absolute after:right-0 after:top-0 after:bottom-0 after:w-px after:bg-gray-200">
              Name
            </TableHead>
            <TableHead className="w-28 lg:w-36 text-gray-600 text-xs">Supplier</TableHead>
            <TableHead className="w-20 text-gray-600 text-xs">Start date</TableHead>
            <TableHead className="w-32 lg:w-40 text-gray-600 text-xs">Notes</TableHead>
            <TableHead className="w-18 lg:w-20 text-gray-600 text-xs">PO</TableHead>
            <TableHead className="w-18 lg:w-20 text-gray-600 text-xs">Plans</TableHead>
            <TableHead className="w-32 lg:w-32 text-gray-600 text-xs">Email</TableHead>
            <TableHead className="w-28 lg:w-32 text-gray-600 text-xs">Progress</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    </div>
  );
}
