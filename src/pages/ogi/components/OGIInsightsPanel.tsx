import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Activity, UserCheck, FileText, Clock, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';

interface InsightItem {
  id: string;
  type: 'pattern' | 'insight' | 'action';
  title: string;
  description: string;
  severity?: 'high' | 'medium' | 'low';
}

interface ActivityItem {
  id: string;
  agent: string;
  action: string;
  status: 'completed' | 'in_progress' | 'pending';
  timestamp: string;
}

interface OGIInsightsPanelProps {}

export function OGIInsightsPanel({}: OGIInsightsPanelProps = {}) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const insightScrollRef = useRef<HTMLDivElement>(null);

  // Initial mock activities
  const initialActivities: ActivityItem[] = [
    {
      id: '1',
      agent: 'Recruiter Agent',
      action: 'Screened 23 candidates for Senior Developer role',
      status: 'completed',
      timestamp: '5 min ago',
    },
    {
      id: '2',
      agent: 'Onboarding Agent',
      action: 'Processing onboarding for 3 new hires',
      status: 'in_progress',
      timestamp: '12 min ago',
    },
    {
      id: '3',
      agent: 'JD Creator Agent',
      action: 'Generated job description for Product Manager',
      status: 'completed',
      timestamp: '28 min ago',
    },
  ];

  // Pool of possible new activities for simulation
  const activityPool = [
    {
      agent: 'Performance Evaluation Agent',
      action: 'Completed performance reviews for 15 employees',
      status: 'completed' as const,
    },
    {
      agent: 'Learning & Development Agent',
      action: 'Scheduled training session for new hires',
      status: 'in_progress' as const,
    },
    {
      agent: 'HR Agent',
      action: 'Updated benefits documentation',
      status: 'completed' as const,
    },
    {
      agent: 'Exit Process Agent',
      action: 'Processing exit interview feedback',
      status: 'pending' as const,
    },
    {
      agent: 'Recruiter Agent',
      action: 'Posted 5 new job openings',
      status: 'completed' as const,
    },
    {
      agent: 'Onboarding Agent',
      action: 'Sent welcome package to new employee',
      status: 'completed' as const,
    },
    {
      agent: 'JD Creator Agent',
      action: 'Updating job descriptions for compliance',
      status: 'in_progress' as const,
    },
    {
      agent: 'Performance Evaluation Agent',
      action: 'Analyzing quarterly performance metrics',
      status: 'in_progress' as const,
    },
    {
      agent: 'Learning & Development Agent',
      action: 'Identified skill gaps in engineering team',
      status: 'completed' as const,
    },
    {
      agent: 'HR Agent',
      action: 'Processing 12 time-off requests',
      status: 'in_progress' as const,
    },
  ];

  // Initialize activities
  useEffect(() => {
    setActivities(initialActivities);
  }, []);

  // Simulate live insights stream with slower, random intervals
  useEffect(() => {
    if (isCollapsed) return;

    let timeoutId: NodeJS.Timeout;

    const scheduleNextInsight = () => {
      // Random interval between 8-15 seconds (slower than activities)
      const randomDelay = Math.random() * 7000 + 8000;

      timeoutId = setTimeout(() => {
        const randomInsight = insightPool[Math.floor(Math.random() * insightPool.length)];
        const newInsight: InsightItem = {
          id: `insight-${Date.now()}-${Math.random()}`,
          type: randomInsight.type,
          title: randomInsight.title,
          description: randomInsight.description,
        };

        setInsights((prev) => {
          const updated = [newInsight, ...prev];
          // Keep only last 8 insights
          return updated.slice(0, 8);
        });

        // Auto-scroll to top to show new insight
        if (insightScrollRef.current) {
          insightScrollRef.current.scrollTop = 0;
        }

        // Schedule next insight
        scheduleNextInsight();
      }, randomDelay);
    };

    // Start the cycle
    scheduleNextInsight();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isCollapsed]);

  // Simulate live activity stream with random intervals
  useEffect(() => {
    if (isCollapsed) return;

    let timeoutId: NodeJS.Timeout;

    const scheduleNextActivity = () => {
      // Random interval between 1-4 seconds (like real organizational activity)
      const randomDelay = Math.random() * 3000 + 1000;

      timeoutId = setTimeout(() => {
        const randomActivity = activityPool[Math.floor(Math.random() * activityPool.length)];
        const newActivity: ActivityItem = {
          id: `activity-${Date.now()}-${Math.random()}`,
          agent: randomActivity.agent,
          action: randomActivity.action,
          status: randomActivity.status,
          timestamp: 'Just now',
        };

        setActivities((prev) => {
          const updated = [newActivity, ...prev];
          // Keep only last 15 activities
          return updated.slice(0, 15);
        });

        // Auto-scroll to top to show new activity
        if (scrollRef.current) {
          scrollRef.current.scrollTop = 0;
        }

        // Schedule next activity
        scheduleNextActivity();
      }, randomDelay);
    };

    // Start the cycle
    scheduleNextActivity();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isCollapsed]);

  // Initial mock insights
  const initialInsights: InsightItem[] = [
    {
      id: '1',
      type: 'insight',
      title: 'High Recruitment Demand',
      description: 'Recruiter Agent processing 3x more job applications than usual. Consider scaling resources.',
    },
    {
      id: '2',
      type: 'pattern',
      title: 'Onboarding Efficiency Up',
      description: 'Onboarding Agent completing processes 40% faster with JD Creator integration.',
    },
  ];

  // Pool of possible insights for simulation
  const insightPool = [
    {
      type: 'insight' as const,
      title: 'Performance Metrics Improved',
      description: 'Overall team performance scores increased by 18% this quarter across all departments.',
    },
    {
      type: 'pattern' as const,
      title: 'Training Completion Rate Rising',
      description: 'Learning & Development Agent reports 85% course completion rate, up from 67%.',
    },
    {
      type: 'insight' as const,
      title: 'Exit Rate Analysis',
      description: 'Exit Process Agent detected 15% increase in voluntary exits. HR Agent notified.',
    },
    {
      type: 'action' as const,
      title: 'Performance Review Cycle',
      description: 'Performance Evaluation Agent needs to initiate Q4 reviews for 127 employees.',
    },
    {
      type: 'pattern' as const,
      title: 'Recruitment Pipeline Strong',
      description: 'Recruiter Agent maintaining healthy candidate pipeline with 3.5x applications per role.',
    },
    {
      type: 'insight' as const,
      title: 'Skill Gap Identified',
      description: 'Learning & Development Agent found critical gaps in cloud architecture expertise.',
    },
    {
      type: 'action' as const,
      title: 'Policy Update Required',
      description: 'HR Agent recommends updating remote work policy based on employee feedback analysis.',
    },
    {
      type: 'pattern' as const,
      title: 'Onboarding Time Reduced',
      description: 'Average onboarding completion time decreased from 14 to 9 days with new workflow.',
    },
  ];

  // Initialize insights
  useEffect(() => {
    setInsights(initialInsights);
  }, []);


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'in_progress':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'pending':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <UserCheck className="h-3 w-3" />;
      case 'in_progress':
        return <Activity className="h-3 w-3" />;
      case 'pending':
        return <Clock className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

 

  return (
    <div className="flex items-center h-full relative">
      {/* Panel Content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex flex-col gap-4 w-[28vw] h-full p-4 pointer-events-auto"
          >
            {/* OGI Intelligence (OI) - Top Section */}
      <Card className={cn(
        'flex flex-col h-[45vh]',
        'bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl',
        'border border-gray-200/50 dark:border-gray-700/50 shadow-2xl',
        'rounded-2xl'
      )}>
        {/* Header */}
        <div className="p-3 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <h3 className="font-semibold text-sm">OGI Intelligence</h3>
            <span className="ml-auto px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-[10px] font-medium text-purple-700 dark:text-purple-300">
              OI
            </span>
          </div>
        </div>

        {/* Intelligence Content */}
        <ScrollArea className="flex-1" ref={insightScrollRef}>
          <div className="p-2 space-y-2">
            <AnimatePresence mode="popLayout">
              {insights.map((insight, index) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: -20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.9 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    delay: index * 0.02
                  }}
                  layout
                >
                  <Card className={cn(
                    'p-2.5 border transition-all hover:shadow-md cursor-pointer relative overflow-hidden',
                    'bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm',
                    'hover:border-purple-400 dark:hover:border-purple-600'
                  )}>
                    <div className="flex items-start gap-2 mb-1">
                      <h4 className="text-xs font-medium line-clamp-1 flex-1">
                        {insight.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 line-clamp-2">
                      {insight.description}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </Card>

      {/* OGI Activity (OA) - Bottom Section */}
      <Card className={cn(
        'flex flex-col h-[45vh]',
        'bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl',
        'border border-gray-200/50 dark:border-gray-700/50 shadow-2xl',
        'rounded-2xl'
      )}>
        {/* Header */}
        <div className="p-3 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-sm">OGI Activity</h3>
            <span className="ml-auto px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-[10px] font-medium text-blue-700 dark:text-blue-300">
              OA
            </span>
          </div>
        </div>

        {/* Activity Content */}
        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="p-2 space-y-2">
            <AnimatePresence mode="popLayout">
              {activities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: -20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.9 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    delay: index * 0.02
                  }}
                  layout
                >
                <Card className={cn(
                  'p-2.5 border transition-all hover:shadow-md cursor-pointer relative overflow-hidden',
                  'bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm',
                  'hover:border-blue-400 dark:hover:border-blue-600',
                  activity.timestamp === 'Just now' && 'ring-2 ring-blue-400 dark:ring-blue-500 ring-opacity-50'
                )}>
                  {/* New activity indicator */}
                  {activity.timestamp === 'Just now' && (
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 5 }}
                      className="absolute top-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"
                    />
                  )}
                  <div className="flex items-start gap-2">
                    <div className={cn(
                      'p-1.5 rounded-lg shrink-0',
                      getStatusColor(activity.status)
                    )}>
                      {getStatusIcon(activity.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {activity.agent}
                        </span>
                        <span className="text-[9px] text-gray-400 dark:text-gray-500 shrink-0">
                          {activity.timestamp}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 dark:text-gray-400 line-clamp-2 mb-1">
                        {activity.action}
                      </p>
                      <span className={cn(
                        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium capitalize',
                        activity.status === 'completed' && 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
                        activity.status === 'in_progress' && 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
                        activity.status === 'pending' && 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                      )}>
                        {activity.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-Page Vertical Toggle Bar */}
      <button
        onClick={() => {
          console.log('Toggle clicked!');
          setIsCollapsed(!isCollapsed);
        }}
        className={cn(
          'w-12 h-full rounded-l-2xl',
          'bg-gradient-to-b from-purple-50 via-white to-blue-50 dark:from-purple-900/20 dark:via-gray-800/80 dark:to-blue-900/20',
          'backdrop-blur-xl',
          'border-l border-t border-b border-gray-300/70 dark:border-gray-600/70',
          'hover:border-blue-400 dark:hover:border-blue-500',
          'shadow-2xl transition-all',
          'flex flex-col items-center justify-center gap-6',
          'group cursor-pointer',
          'pointer-events-auto',
          'relative z-50'
        )}
      >
        {isCollapsed ? (
          <>
            <div className="flex flex-col items-center gap-4">
              {/* OI Section */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                  <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span
                  className="text-sm font-bold text-purple-600 dark:text-purple-400 tracking-wider"
                  style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                >
                  OGI INTELLIGENCE
                </span>
              </div>

              {/* Divider */}
              <div className="w-8 h-px bg-gradient-to-r from-transparent via-gray-400 dark:via-gray-500 to-transparent" />

              {/* OA Section */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span
                  className="text-sm font-bold text-blue-600 dark:text-blue-400 tracking-wider"
                  style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                >
                  OGI ACTIVITY
                </span>
              </div>
            </div>

            {/* Expand Arrow */}
            <div className="mt-6">
              <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors animate-pulse" />
            </div>
          </>
        ) : (
          <>
            <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
            <span className="text-xs text-gray-500 dark:text-gray-400" style={{ writingMode: 'vertical-rl' }}>
              Close
            </span>
          </>
        )}
      </button>
    </div>
  );
}
