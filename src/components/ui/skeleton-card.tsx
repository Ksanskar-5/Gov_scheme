import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export function SchemeCardSkeleton() {
  return (
    <Card className="h-full flex flex-col bg-card border border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <Skeleton className="h-6 w-full max-w-[200px]" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 pb-4">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-4" />
        
        <div className="space-y-2">
          <Skeleton className="h-4 w-full max-w-[180px]" />
          <Skeleton className="h-4 w-24" />
        </div>

        <Skeleton className="mt-4 h-16 w-full rounded-lg" />
      </CardContent>
      
      <CardFooter className="pt-0">
        <Skeleton className="h-10 w-full rounded-md" />
      </CardFooter>
    </Card>
  );
}

export function SchemeDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      
      <Skeleton className="h-40 rounded-lg" />
      <Skeleton className="h-60 rounded-lg" />
    </div>
  );
}
