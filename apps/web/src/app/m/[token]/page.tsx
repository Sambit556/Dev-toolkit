import MobileUploadClient from './MobileUploadClient';

export default async function MobileUploadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <MobileUploadClient token={token} />;
}
