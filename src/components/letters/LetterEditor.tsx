import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateLetterContent } from "@/hooks/useDatabase";
import { Letter } from "@/types/database";
import { Save, Copy, Check, Loader2, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LetterEditorProps {
  letter: Letter;
  onClose?: () => void;
}

export function LetterEditor({ letter, onClose }: LetterEditorProps) {
  const [content, setContent] = useState(letter.content);
  const [copied, setCopied] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const updateContent = useUpdateLetterContent();
  const { toast } = useToast();

  useEffect(() => {
    setContent(letter.content);
    setHasChanges(false);
  }, [letter.content]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasChanges(newContent !== letter.content);
  };

  const handleSave = async () => {
    await updateContent.mutateAsync({
      letterId: letter.id,
      content,
    });
    setHasChanges(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast({
        title: "Copied to Clipboard",
        description: "Letter content has been copied.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setContent(letter.content);
    setHasChanges(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Edit your letter below before downloading or sending
        </p>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-muted-foreground"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-1 text-success" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </>
            )}
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || updateContent.isPending}
          >
            {updateContent.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>
      
      <Textarea
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        className="min-h-[400px] font-mono text-sm bg-secondary/30"
        placeholder="Letter content..."
      />
      
      {hasChanges && (
        <p className="text-xs text-amber-500">
          You have unsaved changes
        </p>
      )}
    </div>
  );
}
