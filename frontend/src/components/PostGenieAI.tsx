import React, { useState, useRef, useCallback, useEffect } from "react";
import DotGrid from "./DotGrid";
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
  ChevronDown,
  ChevronUp,
  Upload,
  ImageIcon,
  X as XIcon,
  Loader2,
} from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

const cn = (...classes: (string | undefined | null | false)[]) =>
  classes.filter(Boolean).join(" ");

// (Deprecated) simple dotted background kept for reference.

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
  onPost?: (content: string, imageUrl?: string) => void;
  imageUrl?: string;
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
  onPost = (_c, _i) => console.log(`Posted to ${platform}`),
  imageUrl,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledInfo, setScheduledInfo] = useState<{ date: string; time: string } | null>(null);

  useEffect(() => {
    // Basic formatting of newlines and bold from AI output
    const formatted = content
      .replace(/\n/g, '<br/>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    setLocalContent(formatted);
  }, [content]);

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const textContent = localContent
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ');
    navigator.clipboard.writeText(textContent);

    // Trigger confetti from button position
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    const { default: confetti } = await import('canvas-confetti');
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { x, y },
      colors: ['#ec4899', '#f472b6', '#fbcfe8', '#fce7f3'],
    });

    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);

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
      postName: "X",
      icon: Twitter,
      color: "text-black",
      bgColor: "bg-white",
    },
    linkedin: {
      name: "LinkedIn Post",
      postName: "LinkedIn",
      icon: Linkedin,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    instagram: {
      name: "Instagram Caption",
      postName: "Instagram",
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
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white mt-1 disabled:opacity-50"
                  disabled={!scheduleDate || !scheduleTime || isPosting}
                  onClick={async (e) => {
                    e.stopPropagation();
                    setIsPosting(true);

                    const textContent = localContent
                      .replace(/<br\s*\/?>/gi, '\n')
                      .replace(/<[^>]+>/g, '')
                      .replace(/&nbsp;/g, ' ');

                    try {
                      await onSchedule(textContent, scheduleDate, scheduleTime);
                      setIsScheduled(true);
                      setScheduledInfo({ date: scheduleDate, time: scheduleTime });
                      setShowSchedule(false);
                      setScheduleDate('');
                      setScheduleTime('');
                    } finally {
                      setIsPosting(false);
                    }
                  }}
                >
                  {isPosting ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Icon className="w-3 h-3 mr-2" />
                      Schedule Post to {config.postName}
                    </>
                  )}
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

          {/* Image Preview after text content */}
          {imageUrl && (
            <div className="mt-3">
              <img
                src={imageUrl}
                alt={`${platform} post image`}
                className="w-full rounded-lg border border-gray-200"
              />
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t mt-2">
            {!isEditing ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className={isCopied ? "flex-1 bg-green-50 border-green-500 text-green-600" : "flex-1"}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(e);
                  }}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3 h-3 mr-1 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </>
                  )}
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

          {/* Post Button - Only show when not editing */}
          {!isEditing && (
            <>
              {isScheduled && scheduledInfo ? (
                <div className="w-full bg-green-50 border-2 border-green-500 text-green-700 rounded-lg px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Check className="w-5 h-5" />
                    <span className="font-semibold">Post Scheduled</span>
                  </div>
                  <p className="text-sm">
                    📅 {scheduledInfo.date} at {scheduledInfo.time}
                  </p>
                  <p className="text-xs mt-1 text-green-600">
                    Your post will be automatically published at the scheduled time
                  </p>
                </div>
              ) : (
                <Button
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white disabled:opacity-50"
                  disabled={isPosting}
                  onClick={async (e) => {
                    e.stopPropagation();
                    setIsPosting(true);

                    const textContent = localContent
                      .replace(/<br\s*\/?>/gi, '\n')
                      .replace(/<[^>]+>/g, '')
                      .replace(/&nbsp;/g, ' ');

                    try {
                      await onPost(textContent, imageUrl);
                    } finally {
                      setIsPosting(false);
                    }
                  }}
                >
                  {isPosting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Icon className="w-4 h-4 mr-2" />
                      Post to {config.postName}
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Input Node Component
interface InputNodeProps {
  position: { x: number; y: number };
  onGenerate: (prompt: string, images: { [platform: string]: string }) => void;
  onImageUpdate: (platform: string, imageUrl: string | null) => void;
  isGenerating: boolean;
  onPositionChange?: (pos: { x: number; y: number }) => void;
}

const InputNode: React.FC<InputNodeProps> = ({
  position,
  onGenerate,
  onImageUpdate,
  isGenerating,
  onPositionChange,
}) => {
  const [activeTab, setActiveTab] = useState<"text" | "image">("text");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");

  // Image tab states
  const [selectedPlatforms, setSelectedPlatforms] = useState<{
    twitter: boolean;
    linkedin: boolean;
    instagram: boolean;
  }>({ twitter: false, linkedin: false, instagram: false });

  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);

  const [imageMode, setImageMode] = useState<{
    twitter: "upload" | null;
    linkedin: "upload" | null;
    instagram: "upload" | null;
  }>({ twitter: null, linkedin: null, instagram: null });

  const [uploadedImages, setUploadedImages] = useState<{
    twitter: string | null;
    linkedin: string | null;
    instagram: string | null;
  }>({ twitter: null, linkedin: null, instagram: null });

  // generatingImages (AI) removed - only upload flow remains

  const [previewImages, setPreviewImages] = useState<{
    twitter: string | null;
    linkedin: string | null;
    instagram: string | null;
  }>({ twitter: null, linkedin: null, instagram: null });

  // Dragging state to allow the input node to be moved by the user
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDownNode = (e: React.MouseEvent) => {
    if (nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setIsDragging(true);
    }
  };

  const handleMouseMoveNode = useCallback(
    (e: MouseEvent) => {
      if (isDragging && nodeRef.current) {
        const parent = nodeRef.current.parentElement;
        if (parent) {
          const parentRect = parent.getBoundingClientRect();
          const newX = e.clientX - parentRect.left - dragOffset.x;
          const newY = e.clientY - parentRect.top - dragOffset.y;
          onPositionChange?.({ x: newX, y: newY });
        }
      }
    },
    [isDragging, dragOffset, onPositionChange]
  );

  const handleMouseUpNode = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMoveNode);
      document.addEventListener("mouseup", handleMouseUpNode);
      return () => {
        document.removeEventListener("mousemove", handleMouseMoveNode);
        document.removeEventListener("mouseup", handleMouseUpNode);
      };
    }
  }, [isDragging, handleMouseMoveNode, handleMouseUpNode]);

  const [confirmedImages, setConfirmedImages] = useState<{
    twitter: string | null;
    linkedin: string | null;
    instagram: string | null;
  }>({ twitter: null, linkedin: null, instagram: null });

  const fileInputRefs = {
    twitter: useRef<HTMLInputElement>(null),
    linkedin: useRef<HTMLInputElement>(null),
    instagram: useRef<HTMLInputElement>(null),
  };

  const platformConfig = {
    twitter: { name: "Twitter/X", icon: Twitter, color: "text-black" },
    linkedin: { name: "LinkedIn", icon: Linkedin, color: "text-blue-600" },
    instagram: { name: "Instagram", icon: Instagram, color: "text-pink-600" },
  };

  const handlePlatformToggle = (platform: keyof typeof selectedPlatforms) => {
    setSelectedPlatforms(prev => ({
      ...prev,
      [platform]: !prev[platform]
    }));
    if (!selectedPlatforms[platform]) {
      setExpandedPlatform(platform);
    } else {
      setExpandedPlatform(null);
      setImageMode(prev => ({ ...prev, [platform]: null }));
      setPreviewImages(prev => ({ ...prev, [platform]: null }));
      setConfirmedImages(prev => ({ ...prev, [platform]: null }));
      setUploadedImages(prev => ({ ...prev, [platform]: null }));
    }
  };

  const handleFileUpload = (platform: keyof typeof uploadedImages, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setUploadedImages(prev => ({ ...prev, [platform]: imageUrl }));
      setPreviewImages(prev => ({ ...prev, [platform]: imageUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (platform: keyof typeof uploadedImages, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type.startsWith('image/')) {
      handleFileUpload(platform, files[0]);
    }
  };

  // AI image generation removed; upload-only flow retained

  const removeConfirmedImage = (platform: keyof typeof confirmedImages) => {
    setConfirmedImages(prev => ({ ...prev, [platform]: null }));
    setPreviewImages(prev => ({ ...prev, [platform]: null }));
    setUploadedImages(prev => ({ ...prev, [platform]: null }));
    onImageUpdate(platform, null);
  };

  return (
    <motion.div
      ref={nodeRef}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="absolute"
      style={{
        left: position.x,
        top: position.y,
        zIndex: isDragging ? 60 : 20,
        cursor: isDragging ? "grabbing" : "grab",
      }}
    >
      <Card
        className="w-[580px] shadow-2xl bg-white border-gray-200"
        onMouseDown={handleMouseDownNode}
      >
        <CardContent className="p-6 space-y-4 min-h-[420px]">
          {/* Tab Headers */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              className={cn(
                "flex-1 pb-3 text-sm font-medium transition-colors relative",
                activeTab === "text"
                  ? "text-pink-600"
                  : "text-gray-500 hover:text-gray-700"
              )}
              onClick={() => setActiveTab("text")}
            >
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                Text Post
              </span>
              {activeTab === "text" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-600" />
              )}
            </button>
            <button
              className={cn(
                "flex-1 pb-3 text-sm font-medium transition-colors relative",
                activeTab === "image"
                  ? "text-pink-600"
                  : "text-gray-500 hover:text-gray-700"
              )}
              onClick={() => setActiveTab("image")}
            >
              <span className="flex items-center justify-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Image
              </span>
              {activeTab === "image" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-600" />
              )}
            </button>
          </div>

          {/* Text Post Tab Content */}
          {activeTab === "text" && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-pink-50">
                  <Sparkles className="w-5 h-5 text-pink-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  AI Content Generator
                </h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Topic <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g., Product Launch, Event Announcement, Achievement"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="text-gray-900 placeholder:text-gray-400 border-pink-300 focus:border-pink-500 focus:ring-pink-200"
                    disabled={isGenerating}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Description
                  </label>
                  <Textarea
                    placeholder="Provide details about your topic. The more context you give, the better the AI-generated posts will be."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[150px] resize-none text-gray-900 placeholder:text-gray-400 text-base border-pink-300 focus:border-pink-500 focus:ring-pink-200"
                    disabled={isGenerating}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white h-12"
                  onClick={() => {
                    // Combine topic and description into prompt
                    const fullPrompt = description
                      ? `Topic: ${topic}\n\nDescription: ${description}`
                      : `Topic: ${topic}`;

                    // Collect confirmed images
                    const images: { [key: string]: string } = {};
                    Object.keys(confirmedImages).forEach((platform) => {
                      const key = platform as keyof typeof confirmedImages;
                      if (confirmedImages[key]) {
                        images[platform] = confirmedImages[key]!;
                      }
                    });
                    onGenerate(fullPrompt, images);
                  }}
                  disabled={!topic.trim() || isGenerating}
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
            </>
          )}

          {/* Image Generation Tab Content */}
          {activeTab === "image" && (
            <div className="max-h-[400px] overflow-y-auto pr-2 custom-pink-scrollbar">
              <style>{`
                .custom-pink-scrollbar::-webkit-scrollbar {
                  width: 8px;
                }
                .custom-pink-scrollbar::-webkit-scrollbar-track {
                  background: #fce7f3;
                  border-radius: 4px;
                }
                .custom-pink-scrollbar::-webkit-scrollbar-thumb {
                  background: #fbcfe8;
                  border-radius: 4px;
                }
                .custom-pink-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: #f9a8d4;
                }
              `}</style>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-pink-50">
                  <ImageIcon className="w-5 h-5 text-pink-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Upload Images
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Upload images for your platforms. They'll be included when you generate text posts.
                  </p>
                </div>
              </div>

              {/* Platform Checkboxes */}
              <div className="space-y-3">
                {Object.entries(platformConfig).map(([platform, config]) => {
                  const platformKey = platform as keyof typeof selectedPlatforms;
                  const Icon = config.icon;
                  const isExpanded = expandedPlatform === platform;
                  const hasConfirmedImage = confirmedImages[platformKey];

                  return (
                    <div key={platform} className="border border-gray-200 rounded-lg p-3">
                      {/* Platform Header */}
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={selectedPlatforms[platformKey]}
                            onChange={() => handlePlatformToggle(platformKey)}
                            className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                          />
                          <Icon className={cn("w-5 h-5", config.color)} />
                          <span className="text-sm font-medium text-gray-700">
                            {config.name}
                          </span>
                          {hasConfirmedImage && (
                            <Check className="w-4 h-4 text-green-600 ml-auto" />
                          )}
                        </label>
                        {selectedPlatforms[platformKey] && (
                          <button
                            onClick={() => setExpandedPlatform(isExpanded ? null : platform)}
                            className="ml-2 text-gray-400 hover:text-gray-600"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Confirmed Image Preview */}
                      {hasConfirmedImage && !isExpanded && (
                        <div className="mt-2 relative">
                          <img
                            src={confirmedImages[platformKey]!}
                            alt={`${platform} confirmed`}
                            className="w-full h-24 object-cover rounded border border-gray-200"
                          />
                          <button
                            onClick={() => removeConfirmedImage(platformKey)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <XIcon className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* Expanded Content */}
                      <AnimatePresence>
                        {selectedPlatforms[platformKey] && isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 space-y-3 border-t border-gray-200 pt-3">
                              {/* Image Mode Selection */}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setImageMode(prev => ({
                                    ...prev,
                                    [platformKey]: prev[platformKey] === "upload" ? null : "upload"
                                  }))}
                                  className={cn(
                                    "flex-1 py-2 px-3 text-xs font-medium rounded-md border transition-colors",
                                    imageMode[platformKey] === "upload"
                                      ? "bg-pink-50 border-pink-600 text-pink-600"
                                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                                  )}
                                >
                                  <Upload className="w-3 h-3 inline mr-1" />
                                  Upload Image
                                </button>
                              </div>

                              {/* Upload Mode */}
                              {imageMode[platformKey] === "upload" && (
                                <div
                                  onDragOver={handleDragOver}
                                  onDrop={(e) => handleDrop(platformKey, e)}
                                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-pink-400 transition-colors cursor-pointer"
                                  onClick={() => fileInputRefs[platformKey].current?.click()}
                                >
                                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                  <p className="text-xs text-gray-600">
                                    Drag & drop or click to upload
                                  </p>
                                  <input
                                    ref={fileInputRefs[platformKey]}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleFileUpload(platformKey, file);
                                    }}
                                  />
                                </div>
                              )}

                              {/* AI generation removed; upload-only flow above */}

                              {/* Image Preview (for uploads) */}
                              {previewImages[platformKey] && !confirmedImages[platformKey] && (
                                <div className="space-y-2">
                                  <img
                                    src={previewImages[platformKey]!}
                                    alt={`${platform} preview`}
                                    className="w-full rounded-lg border border-gray-200"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                      onClick={() => {
                                        // Confirm the uploaded preview
                                        const imageUrl = previewImages[platformKey];
                                        if (imageUrl) {
                                          setConfirmedImages(prev => ({ ...prev, [platformKey]: imageUrl }));
                                          onImageUpdate(platformKey, imageUrl);
                                        }
                                      }}
                                    >
                                      <Check className="w-3 h-3 mr-1" />
                                      Confirm
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setPreviewImages(prev => ({ ...prev, [platformKey]: null }))}
                                    >
                                      <XIcon className="w-3 h-3 mr-1" />
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {/* Confirmed Image */}
                              {confirmedImages[platformKey] && (
                                <div className="space-y-2">
                                  <div className="relative">
                                    <img
                                      src={confirmedImages[platformKey]!}
                                      alt={`${platform} confirmed`}
                                      className="w-full rounded-lg border-2 border-green-500"
                                    />
                                    <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                                      <Check className="w-4 h-4" />
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => removeConfirmedImage(platformKey)}
                                  >
                                    <XIcon className="w-3 h-3 mr-1" />
                                    Remove Image
                                  </Button>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [generatedPosts, setGeneratedPosts] = useState<
    Array<{
      platform: "twitter" | "linkedin" | "instagram";
      content: string;
      position: { x: number; y: number };
      imageUrl?: string;
    }>
  >([]);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [inputNodePosition, setInputNodePosition] = useState({ x: 100, y: 200 });
  const [isInitialCentered, setIsInitialCentered] = useState(false);
  const [inputNodeWidth, setInputNodeWidth] = useState(500);

  const handleGenerate = async (prompt: string, images: { [platform: string]: string }) => {
    setIsGenerating(true);
    setOriginalPrompt(prompt); // Store the original prompt for regeneration

    try {
      // Call the real backend endpoint to generate posts via Amazon Bedrock
      const response = await api.post("/content/generate", { prompt });

      if (response && response.data && response.data.posts) {
        // Map the backend structure to our frontend format and attach images
        const newPosts = response.data.posts.map((post: any, index: number) => ({
          platform: post.platform,
          content: post.content,
          imageUrl: images[post.platform] || undefined,
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

  const handleImageUpdate = (platform: string, imageUrl: string | null) => {
    setGeneratedPosts((prev) =>
      prev.map((post) =>
        post.platform === platform
          ? { ...post, imageUrl: imageUrl || undefined }
          : post
      )
    );
  };


  // Always keep the input node centered
  useEffect(() => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const centeredX = rect.width / 2 - 290; // half of width (580)
      const centeredY = rect.height / 2 - 240; // half of approximate height (480)
      setInputNodePosition({ x: Math.max(20, centeredX), y: Math.max(20, centeredY) });
      setIsInitialCentered(true);
      setInputNodeWidth(580);
    }
  }, []);


  const handlePostPublish = async (
    platform: string,
    content: string,
    date: string,
    time: string,
    imageUrl?: string
  ) => {
    try {
      const localDate = new Date(`${date}T${time}`);
      const response = await api.post("/publish", {
        platform,
        content,
        imageUrl,
        scheduledAt: localDate.toISOString()
      });
      if (response && response.data && response.data.success) {
        if (response.data.scheduled) {
          alert(`✅ Post scheduled for ${platform} at ${date} ${time}!\n\nYour post will be automatically published at the scheduled time.`);
        } else {
          alert(`Successfully published to ${platform}!`);
        }
      } else if (response && response.success) {
        if (response.scheduled) {
          alert(`✅ Post scheduled for ${platform} at ${date} ${time}!\n\nYour post will be automatically published at the scheduled time.`);
        } else {
          alert(`Successfully published to ${platform}!`);
        }
      }
    } catch (error: any) {
      console.error("Publishing failed:", error);
      alert(error.message || `Failed to publish to ${platform}. Please ensure your account is connected in Settings.`);
    }
  };

  const handlePostNow = async (platform: string, content: string, imageUrl?: string) => {
    try {
      const response = await api.post("/publish", {
        platform,
        content,
        imageUrl
        // intentionally omitting scheduledAt so it posts immediately
      });
      if (response && response.data && response.data.success) {
        alert(`Successfully posted to ${platform}!`);
      } else if (response && response.success) {
        alert(`Successfully posted to ${platform}!`);
      }
    } catch (error: any) {
      console.error("Posting failed:", error);
      alert(error.message || `Failed to post to ${platform}. Please ensure your account is connected in Settings.`);
    }
  };

  const handleRegeneratePlatform = async (platform: string, originalPrompt: string, index: number) => {
    if (!originalPrompt) {
      alert("Cannot regenerate: original prompt not found. Please generate posts first.");
      return;
    }

    // Set loading state for this specific card
    setGeneratedPosts((prev) =>
      prev.map((post, i) =>
        i === index
          ? { ...post, content: "Regenerating..." }
          : post
      )
    );

    try {
      // Call backend to regenerate for specific platform
      const response = await api.post("/content/generate", {
        prompt: originalPrompt,
        platforms: [platform]
      });

      if (response && response.data && response.data.posts && response.data.posts.length > 0) {
        // Update only the specific post
        setGeneratedPosts((prev) =>
          prev.map((post, i) =>
            i === index
              ? { ...post, content: response.data.posts[0].content }
              : post
          )
        );
      } else {
        // Restore original content if regeneration fails
        alert("Failed to regenerate post. No content returned.");
      }
    } catch (error) {
      console.error("Failed to regenerate post:", error);
      alert("Failed to regenerate post. Please try again.");
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
      x: inputNodePosition.x + (inputNodeWidth / 2),
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
      <DotGrid baseColor="#FCE7F3" activeColor="#F472B6" dotSize={6} gap={24} />

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
          onImageUpdate={handleImageUpdate}
          isGenerating={isGenerating}
          onPositionChange={(pos) => {
            setInputNodePosition(pos);
            // if this was the initial centered state, mark moved and shrink to normal
            if (isInitialCentered) {
              localStorage.setItem("postgenie_input_moved", "true");
              setIsInitialCentered(false);
              setInputNodeWidth(500);
            }
          }}
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
                handleRegeneratePlatform(post.platform, originalPrompt, index);
              }}
              onCopy={() => {
                console.log("Copied to clipboard");
              }}
              onExport={() => console.log("Exported", post.platform)}
              onSchedule={(content, date, time) => handlePostPublish(post.platform, content, date, time, post.imageUrl)}
              onPost={(content, imageUrl) => handlePostNow(post.platform, content, imageUrl)}
              imageUrl={post.imageUrl}
            />
          ))}
        </AnimatePresence>

        {/* Connected Platforms Badge */}
        {generatedPosts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute z-30"
            style={{
              left: inputNodePosition.x + 290 - 200, // center relative to input node (290 is half of 580px width)
              top: inputNodePosition.y + 500, // position below the input node
              transform: 'translateX(-50%)',
            }}
          >
            <Badge
              variant="outline"
              className="px-4 py-2 bg-white/90 backdrop-blur-sm border-gray-200 text-gray-700 whitespace-nowrap"
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

export { ConnectionLine, PlatformCard, InputNode };
export default PostGenieAI;
