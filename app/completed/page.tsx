import { redirect } from 'next/navigation';

export default function CompletedRedirectPage() {
  redirect('/orders');
}
