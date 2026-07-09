import { redirect } from 'next/navigation';

export default function UuidPage() {
  redirect('/security-tools?tab=uuid-gen');
}
