import { redirect } from 'next/navigation';

export default function YamlJsonPage() {
  redirect('/converters?tab=yaml-json');
}
