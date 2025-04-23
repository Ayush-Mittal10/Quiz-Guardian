
import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface QuizPublishedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testId: string;
  quizId: string;
}

export function QuizPublishedModal({ 
  open, 
  onOpenChange,
  testId,
  quizId 
}: QuizPublishedModalProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [copyIcon, setCopyIcon] = useState<'copy' | 'check'>('copy');
  
  const shareableLink = `${window.location.origin}/join-quiz/${testId}`;
  
  const copyTestId = () => {
    navigator.clipboard.writeText(testId);
    setCopyIcon('check');
    toast({
      title: "Copied!",
      description: "Test ID copied to clipboard"
    });
    
    setTimeout(() => setCopyIcon('copy'), 2000);
  };
  
  const copyLink = () => {
    navigator.clipboard.writeText(shareableLink);
    toast({
      title: "Copied!",
      description: "Shareable link copied to clipboard"
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quiz Published Successfully!</DialogTitle>
          <DialogDescription>
            Your quiz is now live. Share the test ID or link with your students.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium">Test ID</h4>
            <div className="flex items-center gap-2">
              <Input 
                value={testId} 
                readOnly 
                className="font-mono text-center text-lg" 
              />
              <Button variant="outline" size="icon" onClick={copyTestId}>
                {copyIcon === 'copy' ? <Copy className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                <span className="sr-only">Copy</span>
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Shareable Link</h4>
            <div className="flex items-center gap-2">
              <Input 
                value={shareableLink} 
                readOnly 
                className="text-sm" 
              />
              <Button variant="outline" size="icon" onClick={copyLink}>
                <Copy className="h-4 w-4" />
                <span className="sr-only">Copy</span>
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                onOpenChange(false);
                navigate(`/monitor-quiz/${quizId}`);
              }}
            >
              Monitor Quiz
            </Button>
            <Button 
              variant="secondary"
              onClick={() => {
                onOpenChange(false);
                navigate('/dashboard');
              }}
            >
              Go to Dashboard
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
