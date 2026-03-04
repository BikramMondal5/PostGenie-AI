import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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

// Export components
export { DottedGridBackground, ConnectionLine, PlatformCard, InputNode, SettingsPanel };

// Platform Card Component
interface PlatformCardProps {
  platform: "twitter" | "linkedin" | "instagram";
  content: string;
  position: { x: number; y: number };
  onPositionChange: (pos: { x: number; y: number }) => void;
  onRegenerate: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onExport: () => void;
}

const PlatformCard: React.FC<PlatformCardProps> = ({
  platform,
  content,
  position,
  onPositionChange,
  onRegenerate,
  onCopy,
  onEdit,
  onExport,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

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
        className="w-80 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white border-gray-200"
        onMouseDown={handleMouseDown}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-lg", config.bgColor)}>
              <Icon className={cn("w-5 h-5", config.color)} />
            </div>
            <CardTitle className="text-base font-semibold">
              {config.name}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="max-h-40 overflow-y-auto text-sm text-gray-700 leading-relaxed">
            {content}
          </div>
          <div className="flex gap-2 pt-2 border-t">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onCopy();
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
                onEdit();
              }}
            >
              <Edit className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onExport();
              }}
            >
              <Download className="w-3 h-3" />
            </Button>
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
  onQueue: (prompt: string) => void;
  isGenerating: boolean;
}

const InputNode: React.FC<InputNodeProps> = ({
  position,
  onGenerate,
  onQueue,
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
              className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
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
            <Button
              variant="outline"
              onClick={() => onQueue(prompt)}
              disabled={!prompt.trim() || isGenerating}
            >
              Queue for Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Settings Panel Component
const SettingsPanel: React.FC = () => {
  const [connectedPlatforms, setConnectedPlatforms] = useState({
    twitter: true,
    linkedin: true,
    instagram: false,
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900">
          Connected Platforms
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <Twitter className="w-5 h-5 text-black" />
              <Label htmlFor="twitter" className="text-gray-900">
                X (Twitter)
              </Label>
            </div>
            <Switch
              id="twitter"
              checked={connectedPlatforms.twitter}
              onCheckedChange={(checked) =>
                setConnectedPlatforms({ ...connectedPlatforms, twitter: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <Linkedin className="w-5 h-5 text-blue-600" />
              <Label htmlFor="linkedin" className="text-gray-900">
                LinkedIn
              </Label>
            </div>
            <Switch
              id="linkedin"
              checked={connectedPlatforms.linkedin}
              onCheckedChange={(checked) =>
                setConnectedPlatforms({ ...connectedPlatforms, linkedin: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <Instagram className="w-5 h-5 text-pink-600" />
              <Label htmlFor="instagram" className="text-gray-900">
                Instagram
              </Label>
            </div>
            <Switch
              id="instagram"
              checked={connectedPlatforms.instagram}
              onCheckedChange={(checked) =>
                setConnectedPlatforms({ ...connectedPlatforms, instagram: checked })
              }
            />
          </div>
        </div>
      </div>
      <div>
        <Button variant="outline" className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Export Dataset
        </Button>
      </div>
    </div>
  );
};

// Main Component
const PostGenieAI: React.FC = () => {
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
    // Simulate AI generation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const platforms: Array<"twitter" | "linkedin" | "instagram"> = [
      "twitter",
      "linkedin",
      "instagram",
    ];

    const newPosts = platforms.map((platform, index) => ({
      platform,
      content: `${prompt}\n\nOptimized for ${platform}. This is AI-generated content tailored for maximum engagement on this platform. #AI #ContentGeneration #PostGenieAI`,
      position: {
        x: inputNodePosition.x + 600,
        y: inputNodePosition.y + index * 280 - 200,
      },
    }));

    setGeneratedPosts(newPosts);
    setIsGenerating(false);
  };

  const handleQueue = (prompt: string) => {
    console.log("Queued for later:", prompt);
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
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Connect Accounts
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-white">
                <SheetHeader>
                  <SheetTitle className="text-gray-900">Settings</SheetTitle>
                  <SheetDescription className="text-gray-600">
                    Manage your connected platforms and preferences
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                  <SettingsPanel />
                </div>
              </SheetContent>
            </Sheet>
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5 text-gray-700" />
            </Button>
            <Avatar>
              <AvatarImage src="" />
              <AvatarFallback className="bg-pink-100 text-pink-600">
                <User className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
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
          onQueue={handleQueue}
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
              onRegenerate={() => console.log("Regenerate", post.platform)}
              onCopy={() => {
                navigator.clipboard.writeText(post.content);
                console.log("Copied to clipboard");
              }}
              onEdit={() => console.log("Edit", post.platform)}
              onExport={() => console.log("Export", post.platform)}
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

export default PostGenieAI;
