
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { QuizAttempt } from '@/types';

interface StudentResultsTableProps {
  attempts: QuizAttempt[];
  selectedStudent: string | null;
  onSelectStudent: (studentId: string) => void;
}

export const StudentResultsTable = ({
  attempts,
  selectedStudent,
  onSelectStudent,
}: StudentResultsTableProps) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sortedAttempts = [...attempts].sort((a, b) => {
    if (!a.submittedAt && !b.submittedAt) return 0;
    if (!a.submittedAt) return 1;
    if (!b.submittedAt) return -1;
    
    return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
  });

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Time Spent</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Warnings</TableHead>
            <TableHead>Integrity</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAttempts.map((result) => {
            // Ensure warnings is an array, not undefined
            const warnings = Array.isArray(result.warnings) ? result.warnings : [];
            const warningsCount = warnings.length;
            
            return (
              <TableRow
                key={result.id}
                className={selectedStudent === result.studentId ? 'bg-blue-50' : ''}
              >
                <TableCell>
                  <div>{result.student?.name || 'Unknown Student'}</div>
                  <div className="text-xs text-muted-foreground">{result.student?.email || ''}</div>
                </TableCell>
                <TableCell>
                  <div className={`font-medium ${
                    (result.score || 0) >= 70 ? 'text-green-600' :
                    (result.score || 0) >= 50 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {result.score || 0}%
                  </div>
                </TableCell>
                <TableCell>{result.timeSpent ? formatTime(result.timeSpent) : '00:00'}</TableCell>
                <TableCell>
                  <div>{result.submittedAt ? new Date(result.submittedAt).toLocaleDateString() : 'Not submitted'}</div>
                  <div className="text-xs text-muted-foreground">
                    {result.submittedAt ? new Date(result.submittedAt).toLocaleTimeString() : ''}
                  </div>
                </TableCell>
                <TableCell>
                  {warningsCount > 0 ? (
                    <span className="text-red-500">{warningsCount}</span>
                  ) : (
                    <span className="text-green-500">0</span>
                  )}
                </TableCell>
                <TableCell>
                  {result.autoSubmitted ? (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                      Auto-submitted
                    </span>
                  ) : warningsCount > 0 ? (
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">
                      Warning
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      Good
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onSelectStudent(result.studentId)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}

          {attempts.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No quiz attempts found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
