"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, ChevronRight } from "lucide-react";

interface IUserProfile {
  email?: string;
  name?: string;
  avatar_url?: string;
}

export function UserProfileButton() {
  const [user, setUser] = useState<IUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          setUser({
            email: authUser.email,
            name: authUser.user_metadata?.full_name || authUser.user_metadata?.name,
            avatar_url: authUser.user_metadata?.avatar_url,
          });
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
          avatar_url: session.user.user_metadata?.avatar_url,
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const onClick = () => {
    router.push("/settings");
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "U";
  };

  if (loading) {
    return (
      <Button variant="ghost" size="sm" className="w-full justify-start" disabled>
        <User className="mr-2 h-4 w-4" />
        Loading...
      </Button>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Button variant="ghost" size="sm" className="w-full justify-between hover:bg-gray-100 px-2" onClick={onClick}>
      <div className="flex items-center gap-2 overflow-hidden">
        <Avatar className="h-7 w-7">
          <AvatarImage src={user.avatar_url} alt={user.name || user.email} />
          <AvatarFallback className="text-xs">{getInitials(user.name, user.email)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col items-start text-left overflow-hidden">
          {user.name && <span className="text-xs font-medium truncate w-full">{user.name}</span>}
          <span className="text-xs text-muted-foreground truncate w-full">{user.email}</span>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </Button>
  );
}
