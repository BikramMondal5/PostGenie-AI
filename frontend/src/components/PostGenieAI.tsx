import React, { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Plus,
  Twitter,
  Linkedin,
  Instagram,
  Copy,
  RefreshCw,
  Edit,
  Download,
  Sparkles,
  LogIn,
  Check,
  Clock,
} from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

const cn = (...classes: (string | undefined | null | false)[]) =>
  classes.filter(Boolean).join(" ");

// Dotted Grid Background Component
const DottedGridBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(236, 72, 153, 0.15) 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />
    </div>
  );
};

// Node Connection Line Component
interface ConnectionLineProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color?: string;
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({
  from,
  to,
  color = "#ec4899",
}) => {
  const midX = (from.x + to.x) / 2;
  const controlX1 = from.x + (midX - from.x) * 0.5;
  const controlX2 = to.x - (to.x - midX) * 0.5;
  const path = `M ${from.x} ${from.y} C ${controlX1} ${from.y}, ${controlX2} ${to.y}, ${to.x} ${to.y}`;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    >
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <motion.path
        d={path}
        stroke={color}
        strokeWidth="2"
        strokeDasharray="8 8"
        fill="none"
        filter="url(#glow)"
        initial={{ pathLength: 0, opacity: 0, strokeDashoffset: 0 }}
        animate={{
          pathLength: 1,
          opacity: 0.6,
          strokeDashoffset: [0, -16],
        }}
        transition={{
          pathLength: { duration: 0.8, ease: "easeInOut" },
          opacity: { duration: 0.8, ease: "easeInOut" },
          strokeDashoffset: {
            duration: 2,
            ease: "linear",
            repeat: Infinity,
          },
        }}
      />
    </svg>
  );
};

// Platform Card Component
interface PlatformCardProps {
  platform: "twitter" | "linkedin" | "instagram";
  content: string;
  position: { x: number; y: number };
  onPositionChange: (pos: { x: number; y: number }) => void;
  onRegenerate: () => void;
  onCopy: () => void;
  onExport: () => void;
  onSchedule?: (content: string, date: string, time: string) => void;
}

const PlatformCard: React.FC<PlatformCardProps> = ({
  platform,
  content,
  position,
  onPositionChange,
  onRegenerate,
  onCopy,
  onExport,
  onSchedule = (_c, d, t) => console.log(`Scheduled content to ${platform} for ${d} at ${t}`),
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  useEffect(() => {
    // Basic formatting of newlines and bold from AI output
    const formatted = content
      .replace(/\n/g, '<br/>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    setLocalContent(formatted);
  }, [content]);

  const handleCopy = () => {
    const textContent = localContent
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ');
    navigator.clipboard.writeText(textContent);
    onCopy();
  };

  const handleExport = () => {
    const textContent = localContent
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ');
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${platform}-post.txt`;
    a.click();
    URL.revokeObjectURL(url);
    onExport();
  };

  const platformConfig = {
    twitter: {
      name: "X Post",
      icon: Twitter,
      color: "text-black",
      bgColor: "bg-white",
    },
    linkedin: {
      name: "LinkedIn Post",
      icon: Linkedin,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    instagram: {
      name: "Instagram Caption",
      icon: Instagram,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
  };

  const config = platformConfig[platform];
  const Icon = config.icon;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging && cardRef.current) {
        const parent = cardRef.current.parentElement;
        if (parent) {
          const parentRect = parent.getBoundingClientRect();
          const newX = e.clientX - parentRect.left - dragOffset.x;
          const newY = e.clientY - parentRect.top - dragOffset.y;
          onPositionChange({ x: newX, y: newY });
        }
      }
    },
    [isDragging, dragOffset, onPositionChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="absolute"
      style={{
        left: position.x,
        top: position.y,
        zIndex: isDragging ? 50 : 10,
        cursor: isDragging ? "grabbing" : "grab",
      }}
    >
      <Card
        className={cn(
          "shadow-lg transition-all duration-300 bg-white border-gray-200",
          isEditing ? "w-[500px]" : "w-80",
          !isEditing && "hover:shadow-xl"
        )}
        onMouseDown={handleMouseDown}
      >
        <CardHeader className="pb-3 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn("p-2 rounded-lg", config.bgColor)}>
                <Icon className={cn("w-5 h-5", config.color)} />
              </div>
              <CardTitle className="text-base font-semibold">
                {config.name}
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500 hover:text-pink-600 rounded-full h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                setShowSchedule(!showSchedule);
              }}
            >
              <Clock className="w-4 h-4" />
            </Button>
          </div>

          {/* Schedule Popover */}
          <AnimatePresence>
            {showSchedule && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute top-14 right-4 w-60 bg-white border border-gray-200 shadow-xl rounded-lg p-3 z-50 flex flex-col gap-3"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <h4 className="text-sm font-semibold text-gray-900 border-b pb-2">Schedule Post</h4>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-600">Date</label>
                  <input
                    type="date"
                    className="border rounded text-sm px-2 py-1 w-full"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-600">Time</label>
                  <input
                    type="time"
                    className="border rounded text-sm px-2 py-1 w-full"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>
                <Button
                  size="sm"
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white mt-1"
                  disabled={!scheduleDate || !scheduleTime}
                  onClick={() => {
                    const textContent = localContent
                      .replace(/<br\s*\/?>/gi, '\n')
                      .replace(/<[^>]+>/g, '')
                      .replace(/&nbsp;/g, ' ');
                    onSchedule(textContent, scheduleDate, scheduleTime);
                    setShowSchedule(false);
                  }}
                >
                  <Check className="w-3 h-3 mr-2" />
                  Confirm Schedule
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardHeader>
        <CardContent className="space-y-3">
          {isEditing ? (
            <div className="bg-white rounded" onMouseDown={(e) => e.stopPropagation()}>
              <ReactQuill
                theme="snow"
                value={localContent}
                onChange={setLocalContent}
                style={{ minHeight: '150px' }}
              />
            </div>
          ) : (
            <div
              className="max-h-60 overflow-y-auto text-sm text-gray-700 leading-relaxed quill-content"
              dangerouslySetInnerHTML={{ __html: localContent }}
            />
          )}

          <div className="flex gap-2 pt-2 border-t mt-2">
            {!isEditing ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy();
                  }}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRegenerate();
                  }}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Regenerate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExport();
                  }}
                >
                  <Download className="w-3 h-3" />
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(false);
                }}
              >
                <Check className="w-4 h-4 mr-2" />
                Done Editing
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Input Node Component
interface InputNodeProps {
  position: { x: number; y: number };
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
}

const InputNode: React.FC<InputNodeProps> = ({
  position,
  onGenerate,
  isGenerating,
}) => {
  const [prompt, setPrompt] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="absolute"
      style={{
        left: position.x,
        top: position.y,
        zIndex: 20,
      }}
    >
      <Card className="w-[500px] shadow-2xl bg-white border-gray-200">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-pink-50">
              <Sparkles className="w-5 h-5 text-pink-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              AI Content Generator
            </h3>
          </div>
          <Textarea
            placeholder="Describe your event, idea, or announcement. PostGenie AI will generate optimized posts for your connected platforms."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[120px] resize-none text-gray-900 placeholder:text-gray-400"
            disabled={isGenerating}
          />
          <div className="flex gap-3">
            <Button
              className="w-full bg-pink-600 hover:bg-pink-700 text-white"
              onClick={() => onGenerate(prompt)}
              disabled={!prompt.trim() || isGenerating}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Posts
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Main Component
interface PostGenieAIProps {
  onLogout: () => void;
}

const PostGenieAI: React.FC<PostGenieAIProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<
    Array<{
      platform: "twitter" | "linkedin" | "instagram";
      content: string;
      position: { x: number; y: number };
    }>
  >([]);
  const canvasRef = useRef<HTMLDivElement>(null);

  const inputNodePosition = { x: 100, y: 200 };

  const handleGenerate = async (prompt: string) => {
    setIsGenerating(true);

    try {
      // Call the real backend endpoint to generate posts via Amazon Bedrock
      const response = await api.post("/content/generate", { prompt });

      if (response && response.data && response.data.posts) {
        // Map the backend structure to our frontend format
        const newPosts = response.data.posts.map((post: any, index: number) => ({
          platform: post.platform,
          content: post.content,
          position: {
            x: inputNodePosition.x + 600,
            y: inputNodePosition.y + index * 280 - 200,
          },
        }));

        setGeneratedPosts(newPosts);
      }
    } catch (error) {
      console.error("Failed to generate posts:", error);
      // Fallback on error or show toast notification (handled gracefully for now)
      alert("Failed to generate posts. Please check your connection or backend logic.");
    } finally {
      setIsGenerating(false);
    }
  };


  const handlePostPublish = async (platform: string, content: string, date: string, time: string) => {
    try {
      const response = await api.post("/publish", { platform, content, scheduledAt: `${date}T${time}` });
      if (response && response.data && response.data.success) {
        alert(`Successfully published to ${platform}!`);
      }
    } catch (error: any) {
      console.error("Publishing failed:", error);
      alert(error.message || `Failed to publish to ${platform}. Please ensure your account is connected in Settings.`);
    }
  };

  const updateCardPosition = (
    index: number,
    position: { x: number; y: number }
  ) => {
    setGeneratedPosts((prev) =>
      prev.map((post, i) => (i === index ? { ...post, position } : post))
    );
  };

  const getConnectionPoints = () => {
    const inputCenter = {
      x: inputNodePosition.x + 250,
      y: inputNodePosition.y + 100,
    };

    return generatedPosts.map((post) => ({
      from: inputCenter,
      to: {
        x: post.position.x,
        y: post.position.y + 100,
      },
    }));
  };

  return (
    <div className="w-full h-screen bg-white overflow-hidden relative">
      <DottedGridBackground />

      {/* Top Navigation */}
      <nav className="relative z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-pink-100">
              <Sparkles className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">PostGenie AI</h1>
              <p className="text-xs text-gray-600">AI Magic for Every Post</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/settings')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Connect Accounts
            </Button>
            <Button variant="ghost" size="icon" onClick={onLogout}>
              <LogIn className="w-5 h-5 text-gray-700 hover:text-pink-600 rotate-180" />
            </Button>
            <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
              <User className="w-5 h-5" />
            </div>
          </div>
        </div>
      </nav>

      {/* Canvas Area */}
      <div
        ref={canvasRef}
        className="relative w-full h-[calc(100vh-73px)] overflow-hidden"
      >
        {/* Connection Lines */}
        {generatedPosts.length > 0 &&
          getConnectionPoints().map((connection, index) => (
            <ConnectionLine
              key={index}
              from={connection.from}
              to={connection.to}
            />
          ))}

        {/* Input Node */}
        <InputNode
          position={inputNodePosition}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />

        {/* Platform Cards */}
        <AnimatePresence>
          {generatedPosts.map((post, index) => (
            <PlatformCard
              key={`${post.platform}-${index}`}
              platform={post.platform}
              content={post.content}
              position={post.position}
              onPositionChange={(pos) => updateCardPosition(index, pos)}
              onRegenerate={() => {
                console.log("Regenerate", post.platform);
                handleGenerate(post.content); // basic regeneration
              }}
              onCopy={() => {
                console.log("Copied to clipboard");
              }}
              onExport={() => console.log("Exported", post.platform)}
              onSchedule={(content, date, time) => handlePostPublish(post.platform, content, date, time)}
            />
          ))}
        </AnimatePresence>

        {/* Connected Platforms Badge */}
        {generatedPosts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30"
          >
            <Badge
              variant="outline"
              className="px-4 py-2 bg-white/90 backdrop-blur-sm border-gray-200 text-gray-700"
            >
              <Sparkles className="w-3 h-3 mr-2 text-pink-600" />
              Enter your idea to generate posts for all connected platforms
            </Badge>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export { DottedGridBackground, ConnectionLine, PlatformCard, InputNode };
export default PostGenieAI;
