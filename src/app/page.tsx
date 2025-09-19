"use client";

import { redirect, useRouter } from "next/navigation";
import { BookUser, Hammer, House } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/auth/auth-context";
import { Spinner } from "@/components/ui/spinner";

interface NavigationCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner variant="default" size="xl" />
      </div>
    );
  }

  if (!isAuthenticated) {
    redirect("/auth/login");
    return;
  }

  const navigationCards: NavigationCard[] = [
    {
      title: "Jobs",
      description: "View and manage all construction jobs",
      icon: <House className="h-6 w-6 text-green-100" />,
      href: "/jobs",
    },
    {
      title: "Create",
      description: "Stand up a new job",
      icon: <Hammer className="h-6 w-6 text-green-100" />,
      href: "/jobs/create",
    },
    {
      title: "Suppliers",
      description: "View supplier information",
      icon: <BookUser className="h-6 w-6 text-green-100" />,
      href: "/suppliers",
    },
  ];

  const handleCardClick = (href: string) => {
    router.push(href);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="border-b bg-background">
        <PageHeader title="Home" description="Quick access to all features" />
      </div>

      <div className="flex-1 overflow-auto p-6 sm:flex sm:items-center sm:justify-center">
        <div className="w-full max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 md:max-w-3xl md:mx-auto">
            {navigationCards.map((card) => (
              <button
                key={card.href}
                onClick={() => handleCardClick(card.href)}
                type="button"
                className="w-full text-left"
              >
                <Card key={card.href} className="hover:bg-accent hover:cursor-pointer">
                  <div className="flex items-center w-full">
                    <div className="flex items-center justify-center p-2 rounded-sm bg-primary ml-6">{card.icon}</div>
                    <CardHeader className="w-full">
                      <CardTitle>{card.title}</CardTitle>
                      <CardDescription>{card.description}</CardDescription>
                    </CardHeader>
                  </div>
                </Card>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
