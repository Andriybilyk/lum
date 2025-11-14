import { Card } from './ui/card';
import { Skeleton } from './ui/skeleton';

export default function LoadingScreen() {
  return (
    <div className="p-4 space-y-4">
      <div className="pt-4 pb-2">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <Skeleton className="h-5 w-5 mb-2" />
          <Skeleton className="h-9 w-20 mb-1" />
          <Skeleton className="h-3 w-24" />
        </Card>
        <Card className="p-4">
          <Skeleton className="h-5 w-5 mb-2" />
          <Skeleton className="h-9 w-20 mb-1" />
          <Skeleton className="h-3 w-24" />
        </Card>
        <Card className="p-4 col-span-2">
          <Skeleton className="h-5 w-5 mb-2" />
          <Skeleton className="h-9 w-16 mb-1" />
          <Skeleton className="h-3 w-32" />
        </Card>
      </div>

      <div className="space-y-3 pt-2">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
    </div>
  );
}
