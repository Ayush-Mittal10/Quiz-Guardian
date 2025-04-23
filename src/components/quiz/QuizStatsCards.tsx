
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QuizAttempt } from '@/types';

interface QuizStatsCardsProps {
  attempts: QuizAttempt[];
}

export const QuizStatsCards = ({ attempts }: QuizStatsCardsProps) => {
  const averageScore = attempts.length > 0 
    ? attempts.reduce((sum, result) => sum + result.score, 0) / attempts.length
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Average Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{averageScore.toFixed(1)}%</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Total Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{attempts.length}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Integrity Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {attempts.filter(r => r.warnings && r.warnings.length > 0).length}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
