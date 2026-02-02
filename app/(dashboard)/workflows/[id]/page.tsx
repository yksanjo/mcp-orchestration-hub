import { redirect } from 'next/navigation';

// Redirect to edit page by default
export default async function WorkflowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/workflows/${id}/edit`);
}
