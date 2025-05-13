
"use client";

import type { Reaction, ReactionType, User, Post } from '@/lib/types';
import { toggleReactionAction } from '@/lib/actions/forums';
import { Button } from '@/components/ui/button';
import { ThumbsUp, Heart, Laugh, SmilePlus, Frown, Angry, Loader2 } from 'lucide-react';
import { useActionState, useEffect, useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ActionResponse } from '@/lib/types'; // Ensure ActionResponse is imported

interface ReactionButtonsProps {
  postId: string;
  initialReactions: Reaction[]; 
  currentUser: User | null;
}

// Explicitly type initialActionState to match ActionResponse with a post property
const initialActionState: ActionResponse & { post?: Post | null } = { 
  success: false, 
  message: '', 
  post: null 
};


const reactionTypes: ReactionType[] = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];
const reactionIcons: Record<ReactionType, React.ElementType> = {
  like: ThumbsUp,
  love: Heart,
  haha: Laugh,
  wow: SmilePlus, // Using SmilePlus for Wow
  sad: Frown,
  angry: Angry,
};
const reactionLabels: Record<ReactionType, string> = {
  like: "Like",
  love: "Love",
  haha: "Haha",
  wow: "Wow",
  sad: "Sad",
  angry: "Angry",
};


export function ReactionButtons({ postId, initialReactions, currentUser }: ReactionButtonsProps) {
  const [state, formAction, isPending] = useActionState(toggleReactionAction, initialActionState);
  const { toast } = useToast();
  const [currentReactions, setCurrentReactions] = useState<Reaction[]>(initialReactions || []);

  useEffect(() => {
     if (state.success && state.post) {
       setCurrentReactions(state.post.reactions || []);
       // Optionally, a subtle success feedback if needed, but usually UI update is enough
       // toast({ title: 'Success', description: state.message }); 
     } else if (!state.success && state.message && state.message !== initialActionState.message) {
       // Avoid toast for initial state or non-error messages
       if (!isPending && state.message !== "Invalid reaction data.") {
          toast({ variant: 'destructive', title: 'Reaction Error', description: state.message });
       }
     }
   }, [state, toast, isPending]);
   
   useEffect(() => {
     setCurrentReactions(initialReactions || []);
   }, [initialReactions]);


  const reactionCounts = useMemo(() => {
    const counts: Record<ReactionType, number> = { like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 };
    currentReactions.forEach(reaction => {
      counts[reaction.type] = (counts[reaction.type] || 0) + 1;
    });
    return counts;
  }, [currentReactions]);

  const userReactionType = useMemo(() => {
    return currentReactions.find(r => r.userId === currentUser?.id)?.type;
  }, [currentReactions, currentUser]);
  
  const getReactorsTooltipContent = (type: ReactionType): string => {
     const reactors = currentReactions.filter(r => r.type === type).map(r => r.username);
     if (reactors.length === 0) return `No ${reactionLabels[type].toLowerCase()} reactions yet`;
     
     let displayReactors = reactors;
     let othersCount = 0;

     if (currentUser && reactors.includes(currentUser.username)) {
        displayReactors = ["You", ...reactors.filter(name => name !== currentUser.username)];
     }

     if (displayReactors.length > 3) {
        othersCount = displayReactors.length - 3;
        displayReactors = displayReactors.slice(0,3);
     }

     let tooltipText = displayReactors.join(', ');
     if (othersCount > 0) {
        tooltipText += ` and ${othersCount} other${othersCount > 1 ? 's' : ''}`;
     }
     return tooltipText;
  };


  if (!currentUser) {
    return (
      <div className="flex items-center flex-wrap gap-1 mt-2 pt-2 border-t border-border/50">
        {reactionTypes.map(type => {
          const count = reactionCounts[type];
          const Icon = reactionIcons[type];
          if (count === 0) return null; 
          return (
            <TooltipProvider key={type} delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                   <Button variant="ghost" size="sm" className="text-muted-foreground px-2 py-1 h-auto cursor-default" disabled>
                     <Icon className="h-4 w-4 mr-1" /> {count > 0 ? count : ''}
                   </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">{getReactorsTooltipContent(type)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-center flex-wrap gap-1 mt-2 pt-2 border-t border-border/50">
      {reactionTypes.map(type => {
        const count = reactionCounts[type];
        const Icon = reactionIcons[type];
        const isActive = userReactionType === type;

        return (
         <TooltipProvider key={type} delayDuration={100}>
          <Tooltip>
           <TooltipTrigger asChild>
             <form action={formAction} className="inline-flex">
               <input type="hidden" name="postId" value={postId} />
               <input type="hidden" name="reactionType" value={type} />
               <Button
                 type="submit"
                 variant={isActive ? "default" : "ghost"}
                 size="sm"
                 className={cn(
                   "px-2 py-1 h-auto transition-all duration-150 ease-in-out rounded-full text-xs sm:text-sm",
                   isActive ? "bg-primary/90 text-primary-foreground hover:bg-primary shadow-md" : "text-muted-foreground hover:text-primary hover:bg-primary/10",
                   isPending && state.message !== "Reaction updated." && "opacity-70 cursor-progress" // Show loading only if this button's action is pending
                 )}
                 disabled={isPending && state.message !== "Reaction updated."}
                 aria-pressed={isActive}
                 aria-label={`${reactionLabels[type]} (${count})`}
               >
                 {isPending && state.message !== "Reaction updated." && <Loader2 className="h-3 w-3 mr-1 animate-spin"/>}
                 <Icon className={cn("h-4 w-4 mr-1", isActive && "text-primary-foreground")} /> 
                 {count > 0 && <span className="font-medium">{count}</span>}
               </Button>
             </form>
           </TooltipTrigger>
           <TooltipContent side="top">
              <p className="text-xs">{getReactorsTooltipContent(type)}</p>
           </TooltipContent>
          </Tooltip>
         </TooltipProvider>
        );
      })}
    </div>
  );
}
