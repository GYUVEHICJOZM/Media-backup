import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Lock, Archive } from "lucide-react";

export default function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isLoggingIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      await login(password);
    } catch {
      setError("Invalid password. Please try again.");
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Archive className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Message Archive</CardTitle>
          <CardDescription>
            Enter the password to access your Discord media archive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
            </div>
            
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoggingIn || !password}
            >
              {isLoggingIn ? "Unlocking..." : "Unlock Archive"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
