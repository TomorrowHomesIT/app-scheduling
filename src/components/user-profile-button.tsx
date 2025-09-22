import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { useAuth } from "./auth/auth-context";

export function UserProfileButton() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const onClick = () => {
    navigate("/settings");
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
