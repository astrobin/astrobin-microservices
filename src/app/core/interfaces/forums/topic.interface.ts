import { PollType } from "@core/interfaces/forums/poll-type.enum";
import { ForumInterface } from "@core/interfaces/forums/forum.interface";
import { UserInterface } from "@core/interfaces/user.interface";
import { UserProfileInterface } from "@core/interfaces/user-profile.interface";
import { PostInterface } from "@core/interfaces/forums/post.interface";

export interface TopicInterface {
  id: number;
  name: string;
  created: string;
  updated: string | null;
  views: number;
  sticky: boolean;
  closed: boolean;
  postCount: number;
  onModeration: boolean;
  pollType: PollType;
  pollQuestion: string | null;
  slug: string;
  forum: ForumInterface["id"];
  forumName: ForumInterface["name"];
  user: UserInterface["id"];
  username: UserInterface["username"];
  displayName: UserProfileInterface["realName"];
  read: boolean;
  lastPostUsername: UserInterface["username"];
  lastPostUserDisplayName: UserProfileInterface["realName"];
  lastPostTimestamp: string;
  lastPostId: number; // Avoid circular dependency
}
