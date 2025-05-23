import { getCategories } from "@/lib/placeholder-data";
import { CategoryForm } from "@/components/forms/CategoryForm";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';
import { CategoryActions } from "./_components/CategoryActions"; // Placeholder for edit/delete

export default async function AdminCategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Category Management</h1>
      <p className="text-muted-foreground">Create, view, and manage forum categories.</p>

      {/* Reuse CategoryForm for creation */}
      <CategoryForm />

       <h2 className="text-xl font-semibold mt-8 pt-4 border-t">Existing Categories</h2>
       {/* Add overflow-x-auto for responsiveness */}
       <div className="border rounded-lg shadow-sm overflow-x-auto">
            <Table>
            <TableCaption>A list of all forum categories.</TableCaption>
            <TableHeader>
                <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[100px] text-center">Topics</TableHead> {/* Center align counts */}
                <TableHead className="w-[100px] text-center">Posts</TableHead> {/* Center align counts */}
                <TableHead className="w-[150px] whitespace-nowrap">Created Date</TableHead> {/* Prevent wrap */}
                <TableHead className="text-right w-[100px] px-3">Actions</TableHead> {/* Adjust padding */}
                </TableRow>
            </TableHeader>
            <TableBody>
                {categories.map((category) => (
                <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate" title={category.description}> {/* Truncate description */}
                        {category.description || '-'}
                    </TableCell>
                    <TableCell className="text-center">{category.topicCount ?? 0}</TableCell> {/* Center align counts */}
                    <TableCell className="text-center">{category.postCount ?? 0}</TableCell> {/* Center align counts */}
                    <TableCell className="whitespace-nowrap">{format(new Date(category.createdAt), 'PP')}</TableCell> {/* Prevent wrap */}
                    <TableCell className="text-right px-3"> {/* Adjust padding */}
                         <CategoryActions category={category} />
                    </TableCell>
                </TableRow>
                ))}
                {categories.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                            No categories found. Create one above.
                        </TableCell>
                    </TableRow>
                 )}
            </TableBody>
            </Table>
       </div>
    </div>
  );
}
