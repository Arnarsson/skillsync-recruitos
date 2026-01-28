"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Download,
  Loader2,
  AlertCircle,
  Users,
} from "lucide-react";

interface CandidateRow {
  url: string;
  name?: string;
  email?: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  error?: string;
  profileData?: any;
}

export default function BatchUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const csvFile = acceptedFiles[0];
    if (!csvFile) return;

    setFile(csvFile);
    
    // Parse CSV
    const text = await csvFile.text();
    const rows = text.split('\n').filter(row => row.trim());
    
    // Skip header if exists
    const hasHeader = rows[0].toLowerCase().includes('url') || 
                      rows[0].toLowerCase().includes('linkedin');
    const dataRows = hasHeader ? rows.slice(1) : rows;
    
    // Extract LinkedIn URLs
    const parsedCandidates: CandidateRow[] = dataRows.map(row => {
      const columns = row.split(',').map(col => col.trim().replace(/['"]/g, ''));
      
      // Try to find LinkedIn URL in the row
      const linkedInUrl = columns.find(col => 
        col.includes('linkedin.com/in/')
      );
      
      return {
        url: linkedInUrl || columns[0], // Fallback to first column
        name: columns[1] || undefined,
        email: columns[2] || undefined,
        status: 'pending' as const,
      };
    }).filter(c => c.url); // Remove empty rows
    
    setCandidates(parsedCandidates);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    multiple: false,
  });

  const processQueue = async () => {
    setProcessing(true);
    setProgress(0);

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      
      // Update status to processing
      setCandidates(prev => prev.map((c, idx) => 
        idx === i ? { ...c, status: 'processing' } : c
      ));

      try {
        // Extract username from LinkedIn URL
        const match = candidate.url.match(/linkedin\.com\/in\/([^/]+)/);
        const username = match ? match[1] : null;

        if (!username) {
          throw new Error('Invalid LinkedIn URL format');
        }

        // Call the personality profile generation API
        // Note: You'll need to create this endpoint or adapt existing one
        const response = await fetch('/api/profile/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            linkedInUrl: candidate.url,
            username: candidate.name || username,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to process: ${response.statusText}`);
        }

        const data = await response.json();

        // Update status to complete
        setCandidates(prev => prev.map((c, idx) => 
          idx === i ? { 
            ...c, 
            status: 'complete',
            profileData: data,
          } : c
        ));
      } catch (error) {
        // Update status to error
        setCandidates(prev => prev.map((c, idx) => 
          idx === i ? { 
            ...c, 
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          } : c
        ));
      }

      // Update progress
      setProgress(((i + 1) / candidates.length) * 100);
    }

    setProcessing(false);
  };

  const downloadResults = () => {
    const completed = candidates.filter(c => c.status === 'complete');
    
    // Create CSV content
    const csvContent = [
      ['URL', 'Name', 'Status', 'Alignment Score', 'Top Skills', 'Personality Type'].join(','),
      ...completed.map(c => [
        c.url,
        c.name || '',
        c.status,
        c.profileData?.alignmentScore || '',
        c.profileData?.skills?.join('; ') || '',
        c.profileData?.persona?.archetype || '',
      ].join(',')),
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personality-profiles-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const completedCount = candidates.filter(c => c.status === 'complete').length;
  const errorCount = candidates.filter(c => c.status === 'error').length;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Batch Profile Generation</h1>
              <p className="text-muted-foreground">
                Upload a CSV of LinkedIn URLs to generate personality profiles in bulk
              </p>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        {!file && (
          <Card>
            <CardContent className="pt-6">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">
                  {isDragActive
                    ? 'Drop your CSV file here'
                    : 'Drag & drop a CSV file here, or click to browse'}
                </p>
                <p className="text-sm text-muted-foreground">
                  CSV should contain LinkedIn URLs (e.g., https://linkedin.com/in/username)
                </p>
              </div>

              {/* CSV Format Help */}
              <Alert className="mt-6">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  <strong>CSV Format:</strong> Your file should have LinkedIn URLs in the first column.
                  Optional columns: Name, Email. Header row is optional.
                  <br />
                  <strong>Example:</strong> <code>https://linkedin.com/in/johndoe, John Doe, john@example.com</code>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* File Loaded */}
        {file && candidates.length > 0 && (
          <div className="space-y-6">
            {/* File Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{file.name}</CardTitle>
                      <CardDescription>
                        {candidates.length} candidates found
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFile(null);
                        setCandidates([]);
                        setProgress(0);
                      }}
                      disabled={processing}
                    >
                      Clear
                    </Button>
                    {!processing && completedCount === 0 && (
                      <Button
                        onClick={processQueue}
                        disabled={processing}
                      >
                        Start Processing
                      </Button>
                    )}
                    {completedCount > 0 && (
                      <Button
                        onClick={downloadResults}
                        disabled={processing}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Results
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Progress */}
            {processing && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Processing...</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {completedCount} of {candidates.length} profiles completed
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Results Summary */}
            {!processing && (completedCount > 0 || errorCount > 0) && (
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{candidates.length}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{completedCount}</p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                        <XCircle className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{errorCount}</p>
                        <p className="text-xs text-muted-foreground">Errors</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Candidate List */}
            <Card>
              <CardHeader>
                <CardTitle>Candidates</CardTitle>
                <CardDescription>
                  Processing status for each candidate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {candidates.map((candidate, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {candidate.status === 'pending' && (
                          <div className="w-2 h-2 rounded-full bg-gray-400" />
                        )}
                        {candidate.status === 'processing' && (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        )}
                        {candidate.status === 'complete' && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                        {candidate.status === 'error' && (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {candidate.name || candidate.url}
                          </p>
                          {candidate.error && (
                            <p className="text-xs text-red-500">{candidate.error}</p>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant={
                          candidate.status === 'complete' ? 'default' :
                          candidate.status === 'error' ? 'destructive' :
                          'secondary'
                        }
                      >
                        {candidate.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
