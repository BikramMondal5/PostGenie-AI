import React, { useState } from 'react';
import { Book, Rocket, Database, FileText, ChevronRight, ChevronDown, Search, ExternalLink } from 'lucide-react';
import Navbar from './Navbar';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

interface Subsection {
    id: string;
    title: string;
    badge: string | null;
    hasChildren?: boolean;
    children?: { id: string; title: string; badge: null }[];
}

interface DocSection {
    title: string;
    icon: any;
    subsections: Subsection[];
}

interface DocsProps {
    onLogout: () => void;
}

const Docs: React.FC<DocsProps> = ({ onLogout }) => {
    const [activeSection, setActiveSection] = useState('introduction');
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        'getting-started': true,
        'core-concepts': false,
        'guides': false,
        'resources': false
    });
    const [expandedQuickStart, setExpandedQuickStart] = useState(false);

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const documentation: Record<string, DocSection> = {
        'getting-started': {
            title: 'Getting Started',
            icon: Rocket,
            subsections: [
                { id: 'introduction', title: 'Introduction', badge: null },
                {
                    id: 'quick-start',
                    title: 'Quick Start Guide',
                    badge: 'Popular',
                    hasChildren: true,
                    children: [
                        { id: 'quick-start-users', title: 'For Content Creators', badge: null },
                        { id: 'quick-start-developers', title: 'For Developers', badge: null }
                    ]
                }
            ]
        },
        'core-concepts': {
            title: 'Core Concepts',
            icon: Book,
            subsections: [
                { id: 'how-it-works', title: 'How PostGenie AI Works', badge: null },
                { id: 'workflow-engine', title: 'Content Workflow Engine', badge: null },
                { id: 'rag-system', title: 'Fine-Tuning Engine', badge: null }
            ]
        },
        'guides': {
            title: 'User Guides',
            icon: FileText,
            subsections: [
                { id: 'running-analysis', title: 'Generating Content', badge: null }
            ]
        },
        'resources': {
            title: 'Resources',
            icon: Database,
            subsections: [
                { id: 'examples', title: 'Example Prompts', badge: 'Popular' },
                { id: 'troubleshooting', title: 'Troubleshooting', badge: null }
            ]
        }
    };

    const getContent = (sectionId: string) => {
        const contentMap: Record<string, string> = {
            'introduction': `# Welcome to PostGenie AI Documentation

**PostGenie AI** is an AI-powered content creation platform that accelerates social media post generation from hours to minutes. Designed for creators and brands, it orchestrates an automated workflow to generate high-quality, platform-specific content simultaneously.

## What is PostGenie AI?

PostGenie AI transforms how social media content is created by:

- **Automating Content Generation**: No more staring at a blank screen for hours
- **Multi-Platform Support**: Generate versioned content for Twitter, LinkedIn, and Instagram in one go
- **Intelligent Tone Matching**: AI fine-tunes content based on your specific voice and requirements
- **Visual Integration**: Seamlessly upload or generate images to accompany your posts

## Why PostGenie AI?

Traditional content creation requires:
- Researching topics (1-2 hours)
- Writing drafts for each platform (2-3 hours)
- Finding/Creating matching images (1 hour)
- Scheduling across platforms (30 minutes)

**With PostGenie AI**: Complete this entire process in **2-5 minutes**.

## Who Should Use This?

- **Content Creators**: Scale your social media presence without extra effort
- **Social Media Managers**: Manage multiple accounts with consistent, high-quality output
- **Biotech Startups**: Share your complex innovations in digestible, engaging formats
- **Marketing Teams**: Quickly create and iterate on campaign messaging

## Key Features

### Automated Content Studio
Platform-specific generators work in parallel to craft content optimized for the unique constraints and audiences of different social platforms.

### Fine-Tuning Engine
Train the AI on your specific brand voice, past successful posts, and preferred formatting to ensure every generated post sounds like you.

### Real-Time Canvas
Watch your content ecosystem grow in real-time on our interactive canvas, showing the relationships between your ideas and platform-specific executions.
`,

            'quick-start-users': `# Quick Start Guide for Creators

Get started with PostGenie AI in minutes - no technical skills required!

## What You'll Need

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- Internet connection
- Your social media account credentials (for integration)

## Accessing PostGenie AI

### Visit the Dashboard
Visit **https://postgenie.ai** to access your personal content studio.

### Integration (One-Time Setup)
1. Navigate to **"Integrations"**
2. Connect your Twitter, LinkedIn, and Instagram accounts
3. Once connected, your "Canvas" is ready!

## Your First Post (2 minutes)

### Step 1: Navigate to the Canvas
Click on **"Canvas"** in the top navigation menu.

### Step 2: Enter Your Topic
Type a clear, specific idea. Examples:

**Good prompts:**
- "A post about our new feature launch: AI-powered scheduling for LinkedIn"
- "Share 5 tips for better engagement on Twitter for tech startups"
- "Announcement of our series A funding round and what it means for our users"

### Step 3: Click "Generate Posts"
The system will automatically:
- Craft a punchy thread for **Twitter**
- Write a professional, detailed post for **LinkedIn**
- Create an engaging caption and hashtag set for **Instagram**

### Step 4: Refine and Edit
Use the interactive cards to:
- Edit the text directly
- Regenerate content if it's not quite right
- Upload or generate matching images

### Step 5: Post or Schedule
Click **"Post to [Platform]"** to publish immediately or use the **Clock icon** to schedule for later (Available for X and LinkedIn).

## Tips for Better Results

### Be Specific
**GOOD**: "Announcement of a new partnership with Google Cloud to improve our infrastructure"  
**AVOID**: "Big news"

### Define Your Tone
Mention if you want it to be "Professional", "Enthusiastic", "Casual", or "Urgent".

## Getting Help

- Check the **Troubleshooting** section for common issues
- Review **Example Prompts** for inspiration
- Contact our support team via the chat widget`,

            'quick-start-developers': `# Quick Start Guide for Developers

Set up PostGenie AI development environment and start contributing.

## Prerequisites

Before you begin, ensure you have:

- **AWS Account** for deployment
- **Amazon Bedrock Access** (Nova models)
- **Groq API Key** (for Llama 3 fallback)

## Installation (10 minutes)

### Step 1: Clone the Repository

\`\`\`bash
git clone https://github.com/BikramMondal5/PostGenie-AI.git
cd PostGenie-AI
\`\`\`

### Step 2: Backend Setup

\`\`\`bash
# Install dependencies
npm install

# Deploy backend infrastructure
npx sst deploy --stage prod
\`\`\`

### Step 3: Frontend Setup

\`\`\`bash
cd frontend
npm install
\`\`\`

### Step 4: Configure Environment Variables

Create \`.env.local\` in the \`frontend\` directory:

\`\`\`env
# API Configuration (Get this from sst output)
VITE_API_URL=https://your-api-url.execute-api.us-east-1.amazonaws.com/prod
\`\`\`

## Running the Development Environment

### Start Frontend Development Server

\`\`\`bash
npm run dev
\`\`\`

Frontend will start on **http://localhost:5173**

## Project Structure

\`\`\`
PostGenie-AI/
├── backend/                # AWS Lambda / SST Backend
│   ├── src/               # Backend logic
├── frontend/               # React (Vite) Frontend
│   ├── src/               # Frontend source
│   │   ├── components/    # React components
│   │   ├── lib/           # APIs and Context
└── sst.config.ts           # Infrastructure as Code
\`\`\`

## Adding a New Platform

1. **Backend**: Update the content generation prompt in \`backend/src/functions/content/generate.ts\`.
2. **Frontend**: Add a new icon and configuration in \`PlatformCard\` component within \`PostGenieAI.tsx\`.

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/BikramMondal5/PostGenie-AI/issues)
- **Discord**: Join our developer community`,

            'how-it-works': `# How PostGenie AI Works

## System Architecture Overview

PostGenie AI uses a sophisticated orchestration layer powered by **Amazon Bedrock** and **Groq** to generate parallel content across multiple platforms.

## The Generation Pipeline

### Phase 1: Intent Analysis
When you submit a topic, our **Core Orchestrator**:
1. Parses your intent and key talking points using High-intelligence models (Nova Pro)
2. Extracts specific entities and goals
3. Decomposes the task for platform-specific prompts

### Phase 2: Parallel Content Creation
Small, specialized generators work simultaneously:
- **X (Twitter) Workflow**: Focuses on character limits and engagement hooks
- **LinkedIn Workflow**: Crafts long-form, professional narrative
- **Instagram Workflow**: Focuses on visual storytelling and hashtags

### Phase 3: Fine-Tuning Overlay
The **Fine-Tuning Engine** sits above the workflow, applying your personal tone, vocabulary, and formatting preferences recorded in your settings.

### Phase 4: Dynamic Canvas
Results are streamed to your interactive **Canvas**, allowing you to see the "Post Ecosystem" at a glance and how each platform's message connects to the core idea.

### Phase 5: Direct Publishing
Our API bridges the gap between AI generation and social platforms, allowing for one-click publishing or precise scheduling.`,

            'workflow-engine': `# Content Workflow Architecture

## Workflow Hierarchy

PostGenie AI employs an automated multi-platform workflow where a Core Orchestrator coordinates specialized content generators.

## Core Orchestrator

**Role**: Central coordinator and strategist  
**Technology**: Amazon Bedrock (Nova) & Groq (Llama 3.3)

### Responsibilities
1. Logic decomposition
2. Cross-platform consistency check
3. Fine-tuning application
4. Final synthesis

## Specialized Workers

### 1. X (Twitter) Generator
**Focus**: Virality & Conciseness
- Master of the 280-character limit
- Experts in thread construction
- Uses "hooks" to stop the scroll

### 2. LinkedIn Generator
**Focus**: Thought Leadership & Professionalism
- Optimized for the "See More" fold
- Uses professional formatting (bullets, spacing)
- Encourages industry discussion

### 3. Instagram Generator
**Focus**: Engagement & Aesthetics
- High-impact first lines
- Strategic hashtag placement
- Direction for matching visuals

### 4. Image Generation Workflow
**Focus**: Semantic Visualization
- Translates text themes into DALL-E/Stable Diffusion prompts
- Ensures visual consistency across platform-specific images`,

            'rag-system': `# Fine-Tuning Engine

Our Fine-Tuning engine ensures the AI doesn't just write *well*, but writes like *you*.

## How it Works

Unlike generic AI models, our engine uses your past activity and specific instructions to bias the generation process.

### Instruction Sets
In the **Fine Tuning** settings, you can provide platform-specific rules:
- "Always use 3 emojis at the end of LinkedIn posts"
- "Never use hashtags on X"
- "Avoid corporate jargon"

### Tonality Maps
We build a profile of your preferred voice across several axes:
- Formality (Casual vs. Formal)
- Humor (Serious vs. Witty)
- Length (Concise vs. Elaborate)

## Best Practices for Fine-Tuning

1. **Be Specific**: "Write professionally" is less helpful than "Write like a senior tech entrepreneur".
2. **Provide Examples**: Paste 3-5 of your best-performing past posts into the instruction box.
3. **Platform-Specific**: What works for you on X might not work on LinkedIn. Update each one individually.`,

            'running-analysis': `# Generating Content

Complete guide to mastering the PostGenie Canvas.

## The Ideal Prompt

The better your input, the better the output.

**GOOD**: "Write a post about the future of remote work, focusing on how AI tools improve productivity for small teams. Tone should be optimistic but practical."

## Managing the Canvas

- **Dragging**: Click and drag the headers to organize your workspace.
- **Editing**: Click the **pencil icon** to enter full-screen editor mode with Rich Text support.
- **Regenerating**: If a specific platform's result isn't perfect, click **Regenerate** on just that card without affecting the others.

## Visuals

- **Upload**: Drop any image onto the card to attach it.
- **AI Generation**: Use the **"Image"** tab to create visuals from your text automatically via Pollinations AI (Flux model).

## Scheduling

Click the **Clock icon** on any card to set a future date and time. Our backend will handle the publishing while you sleep.`,

            'examples': `# Example Prompts

Get inspired by these high-converting prompt patterns.

## Product Launches
> "Announcing our new 'Fine-Tuning' feature. It allows users to train the AI on their own voice. We've been working on this for 3 months and it's a game changer for personal branding."

## Educational Content
> "5 common mistakes creators make when starting a newsletter. Target audience is first-time writers."

## Personal Milestones
> "Celebrating our 100th user today! It's been an incredible journey since launching 2 weeks ago. Grateful for the community support."

## Industry Insights
> "Sharing thoughts on the recent trend of decentralized remote work. Why it's better for talent diversity but harder for logistics."`,

            'troubleshooting': `# Troubleshooting

Common issues and solutions.

## Connection Issues

### "Failed to connect to backend"
- Check your internet connection.
- Ensure your session hasn't expired (try logging out and back in).
- Check our official status page or social media for outages.

### "Account not connected"
- Social platforms require you to refresh your connection periodically.
- Go to **Settings > Integrations** and reconnect the affected platform.

## Generation Issues

### "API Quota Exceeded"
- We limit the number of posts per day based on your plan.
- Check your usage in Account settings.

### "Content is truncated"
- Platforms like X have strict limits. Our AI tries to fit, but sometimes complex ideas require threads.
- Check if "Thread Mode" is enabled in your settings.

## Getting Help

- **Email**: support@postgenie.ai
- **Discord**: Join our community help-desk
- **Twitter**: DM us @PostGenieAI`
        };

        return contentMap[sectionId] || '# Content not found';
    };

    // Custom components for ReactMarkdown
    const markdownComponents: Components = {
        h1: ({ children }) => (
            <h1 className="text-4xl font-black mt-8 mb-6 text-gray-900 border-b pb-4">
                {children}
            </h1>
        ),
        h2: ({ children }) => (
            <h2 className="text-2xl font-bold mt-10 mb-4 text-gray-800 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-pink-500 rounded-full" />
                {children}
            </h2>
        ),
        h3: ({ children }) => (
            <h3 className="text-xl font-bold mt-8 mb-3 text-gray-800">
                {children}
            </h3>
        ),
        p: ({ children }) => (
            <p className="text-gray-600 mb-5 leading-relaxed text-base">
                {children}
            </p>
        ),
        ul: ({ children }) => (
            <ul className="list-none space-y-3 mb-6">
                {children}
            </ul>
        ),
        ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-3 mb-6 text-gray-600">
                {children}
            </ol>
        ),
        li: ({ children }) => (
            <li className="flex items-start gap-3 text-gray-600">
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-pink-400 flex-shrink-0" />
                <span>{children}</span>
            </li>
        ),
        code: ({ inline, children, ...props }: any) => {
            return inline ? (
                <code className="bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded text-sm font-mono font-bold" {...props}>
                    {children}
                </code>
            ) : (
                <code className="block bg-gray-900 text-pink-100 p-5 rounded-xl my-6 font-mono text-sm overflow-x-auto shadow-inner" {...props}>
                    {children}
                </code>
            );
        },
        pre: ({ children }) => (
            <pre className="bg-transparent border-none p-0 m-0">
                {children}
            </pre>
        ),
        strong: ({ children }) => (
            <strong className="font-black text-gray-900">
                {children}
            </strong>
        ),
        a: ({ href, children }) => (
            <a href={href} className="text-pink-600 hover:text-pink-700 font-bold underline decoration-pink-200 underline-offset-4 transition-colors" target="_blank" rel="noopener noreferrer">
                {children}
            </a>
        ),
        blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-pink-500 bg-pink-50/50 px-6 py-4 my-6 italic text-gray-700 rounded-r-xl">
                {children}
            </blockquote>
        ),
    };

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Navbar onLogout={onLogout} />

            <div className="flex min-h-[calc(100vh-73px)]">
                {/* Sidebar */}
                <div className="w-64 lg:w-80 bg-white border-r border-gray-200 overflow-y-auto h-[calc(100vh-73px)] sticky top-[73px] hidden md:block">
                    <div className="p-6">
                        <div className="mb-6">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search docs..."
                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 text-gray-900 placeholder:text-gray-400 transition-all"
                                />
                            </div>
                        </div>

                        {Object.entries(documentation).map(([key, section]) => {
                            const Icon = section.icon;
                            return (
                                <div key={key} className="mb-4">
                                    <button
                                        onClick={() => toggleSection(key)}
                                        className="w-full flex items-center justify-between px-3 py-2 text-sm font-bold text-gray-900 hover:bg-pink-50 rounded-xl transition-colors group"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <Icon className="w-4 h-4 text-gray-400 group-hover:text-pink-500 transition-colors" />
                                            <span>{section.title}</span>
                                        </div>
                                        {expandedSections[key] ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                                    </button>

                                    {expandedSections[key] && (
                                        <div className="ml-4 mt-1 border-l-2 border-gray-100 pl-2 space-y-1">
                                            {section.subsections.map(sub => (
                                                <div key={sub.id}>
                                                    {sub.hasChildren ? (
                                                        <>
                                                            <button
                                                                onClick={() => setExpandedQuickStart(!expandedQuickStart)}
                                                                className="w-full text-left px-3 py-2 text-sm rounded-lg transition-colors text-gray-600 hover:bg-gray-50 flex items-center justify-between font-medium"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span>{sub.title}</span>
                                                                    {sub.badge && (
                                                                        <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-pink-100 text-pink-600 uppercase tracking-wider">
                                                                            {sub.badge}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {expandedQuickStart ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
                                                            </button>
                                                            {expandedQuickStart && sub.children && (
                                                                <div className="ml-4 mt-1 space-y-1">
                                                                    {sub.children.map(child => (
                                                                        <button
                                                                            key={child.id}
                                                                            onClick={() => setActiveSection(child.id)}
                                                                            className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-all ${activeSection === child.id
                                                                                ? 'bg-pink-50 text-pink-600 font-bold'
                                                                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                                                                }`}
                                                                        >
                                                                            {child.title}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() => setActiveSection(sub.id)}
                                                            className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all ${activeSection === sub.id
                                                                ? 'bg-pink-50 text-pink-600 font-bold'
                                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                                                }`}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span>{sub.title}</span>
                                                                {sub.badge && (
                                                                    <span className={`px-2 py-0.5 text-[10px] font-black rounded-full ${sub.badge === 'Popular' ? 'bg-pink-100 text-pink-600' :
                                                                        sub.badge === 'New' ? 'bg-green-100 text-green-600' :
                                                                            'bg-blue-100 text-blue-600'
                                                                        } uppercase tracking-wider`}>
                                                                        {sub.badge}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 bg-white">
                    <div className="max-w-4xl mx-auto p-4 sm:p-8 md:p-12 lg:p-20">
                        <div className="markdown-content">
                            <ReactMarkdown components={markdownComponents}>
                                {getContent(activeSection)}
                            </ReactMarkdown>
                        </div>

                        <div className="mt-20 pt-10 border-t border-gray-100">
                            <div className="flex items-center justify-between text-xs text-gray-400 font-bold uppercase tracking-widest">
                                <span>Last updated: March 2026</span>
                                <a href="https://github.com/BikramMondal5/PostGenie-AI" className="flex items-center gap-1.5 text-pink-500 hover:text-pink-600 transition-colors">
                                    View on GitHub <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Docs;
