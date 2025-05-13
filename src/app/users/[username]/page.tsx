

import { findUserByUsername, getUserPostCount, generateConversationId as dbGenerateConversationId } from '@/lib/placeholder-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, MapPin, Link as LinkIcon, MessageSquare, Edit3, Activity, AlignLeft, MessageCircle } from 'lucide-react'; // Added MessageCircle
import { format, formatDistanceToNowStrict } from 'date-fns';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth';
import Image from 'next/image';
import { startConversationAndRedirectAction } from '@/lib/actions/privateMessages'; // Import the new action


interface UserProfilePageProps {
  params: { username: string };
}

export async function generateMetadata({ params }: UserProfilePageProps) {
  const decodedUsername = decodeURIComponent(params.username);
  const user = await findUserByUsername(decodedUsername);
  return {
    title: user ? `${user.username}'s Profile - ForumLite` : 'User Not Found',
  };
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const viewingUser = await getCurrentUser();
  const decodedUsername = decodeURIComponent(params.username);
  console.log(`[UserProfilePage] Attempting to fetch profile for username: "${decodedUsername}" (original: "${params.username}")`);
  const profileUser = await findUserByUsername(decodedUsername);

  if (!profileUser) {
    console.error(`[UserProfilePage] User not found for username "${decodedUsername}". Rendering 404 page.`);
    notFound();
  }
  console.log(`[UserProfilePage] Successfully fetched profileUser: ${profileUser.id} - ${profileUser.username}`);


  const postCount = profileUser.postCount ?? 0;
  const lastActive = profileUser.lastActive ? new Date(profileUser.lastActive) : new Date(profileUser.createdAt);

  const isOwnProfile = viewingUser?.id === profileUser.id;
  let conversationIdWithProfileUser: string | null = null;
  if (viewingUser && !isOwnProfile) {
    conversationIdWithProfileUser = dbGenerateConversationId(viewingUser.id, profileUser.id);
  }


  return (
    <div className="space-y-8">
      <Card className="shadow-lg border border-border overflow-hidden">
        <div className="relative h-32 sm:h-40 bg-gradient-to-r from-primary/20 to-accent/20" data-ai-hint="profile banner abstract">
        </div>
        <CardHeader className="flex flex-col sm:flex-row items-center sm:items-end space-y-4 sm:space-y-0 sm:space-x-6 p-4 sm:p-6 relative -mt-16 sm:-mt-20">
          <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background shadow-md">
            <AvatarImage src={profileUser.avatarUrl || `https://avatar.vercel.sh/${profileUser.username}.png?size=128`} alt={profileUser.username} data-ai-hint="user avatar" />
            <AvatarFallback className="text-4xl">{profileUser.username?.charAt(0)?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center sm:text-left pt-4 sm:pt-0">
            <CardTitle className="text-2xl sm:text-3xl font-bold">{profileUser.username}</CardTitle>
            {profileUser.isAdmin && (
              <p className="text-sm font-medium text-destructive">Administrator</p>
            )}
            <CardDescription className="text-muted-foreground text-sm mt-1">
              {profileUser.location && (
                <span className="flex items-center justify-center sm:justify-start gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {profileUser.location}
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            {isOwnProfile && (
                <Button asChild variant="outline" size="sm">
                <Link href={`/users/${profileUser.username}/edit`}>
                    <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
                </Link>
                </Button>
            )}
            {viewingUser && !isOwnProfile && conversationIdWithProfileUser && (
                 <Button asChild size="sm">
                    <Link href={`/messages/${conversationIdWithProfileUser}`}>
                        <MessageCircle className="mr-2 h-4 w-4" /> Send Message
                    </Link>
                </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {profileUser.aboutMe && (
              <section>
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2"><AlignLeft className="h-5 w-5 text-primary"/> About Me</h2>
                <p className="text-muted-foreground whitespace-pre-wrap text-sm leading-relaxed">{profileUser.aboutMe}</p>
              </section>
            )}

            {profileUser.signature && (
              <section>
                <Separator className="my-4"/>
                <h3 className="text-md font-semibold mb-1">Signature</h3>
                <p className="text-sm text-muted-foreground italic border-l-2 border-border pl-3 py-1">{profileUser.signature}</p>
              </section>
            )}
          </div>

          <div className="space-y-6">
             <Card className="border-border/70 shadow-sm">
                <CardHeader className="p-3 sm:p-4">
                    <CardTitle className="text-base font-medium flex items-center gap-2"><Activity className="h-4 w-4 text-primary"/> Activity</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 text-sm space-y-2">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        <span>Joined: {format(new Date(profileUser.createdAt), 'MMMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span>Posts: {postCount}</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span>
                          Last active: {formatDistanceToNowStrict(lastActive, { addSuffix: true })}
                        </span>
                    </div>
                </CardContent>
             </Card>

            {(profileUser.websiteUrl || profileUser.socialMediaUrl) && (
               <Card className="border-border/70 shadow-sm">
                <CardHeader className="p-3 sm:p-4">
                     <CardTitle className="text-base font-medium flex items-center gap-2"><LinkIcon className="h-4 w-4 text-primary"/> Links</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 text-sm space-y-2">
                    {profileUser.websiteUrl && (
                    <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-muted-foreground" />
                        <a href={profileUser.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                        {profileUser.websiteUrl.replace(/^https?:\/\//, '')}
                        </a>
                    </div>
                    )}
                    {profileUser.socialMediaUrl && ( 
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                        <a href={profileUser.socialMediaUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                        {profileUser.socialMediaUrl.replace(/^https?:\/\//, '')}
                        </a>
                    </div>
                    )}
                </CardContent>
               </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
