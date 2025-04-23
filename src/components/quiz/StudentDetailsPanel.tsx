
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { QuizAttempt } from '@/types';

interface StudentDetailsPanelProps {
  attempt: QuizAttempt;
  onClose: () => void;
}

export const StudentDetailsPanel = ({ attempt, onClose }: StudentDetailsPanelProps) => {
  const { toast } = useToast();

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Student Details: {attempt.student?.name || 'Unknown Student'}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Warning Logs</h3>
            <div className="border rounded-md p-3">
              {attempt.warnings?.length ? (
                <div className="space-y-2">
                  {attempt.warnings.map((warning, index) => (
                    <div key={index} className="text-sm border-b pb-2">
                      <div className="text-red-500">{warning.type}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(warning.timestamp).toLocaleTimeString()}
                      </div>
                      {warning.description && (
                        <div className="text-xs">{warning.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No warnings recorded</div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                toast({
                  title: "Export Feature",
                  description: "This feature would export detailed results for this student"
                });
              }}
            >
              Export Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
