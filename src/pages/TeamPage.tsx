import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Users, TrendingUp, DollarSign, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const TeamPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const [codeRes, teamRes, commRes] = await Promise.all([
      supabase.from("referral_codes").select("code").eq("user_id", user!.id).single(),
      supabase.from("team_members").select("*").eq("referrer_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("commissions").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
    ]);
    if (codeRes.data) setReferralCode(codeRes.data.code);
    if (teamRes.data) setTeamMembers(teamRes.data);
    if (commRes.data) setCommissions(commRes.data);
    setLoading(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast({ title: "Copied!", description: "Referral code copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const totalCommissions = commissions.reduce((s, c) => s + Number(c.amount), 0);
  const creditedCommissions = commissions.filter(c => c.status === "credited").reduce((s, c) => s + Number(c.amount), 0);
  const pendingCommissions = commissions.filter(c => c.status === "pending").reduce((s, c) => s + Number(c.amount), 0);
  const tier1Count = teamMembers.filter(m => m.tier === 1).length;
  const tier2Count = teamMembers.filter(m => m.tier === 2).length;
  const tier3Count = teamMembers.filter(m => m.tier === 3).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Team</h1>
          <p className="text-muted-foreground">Invite friends and earn commissions on 3 tiers</p>
        </div>

        {/* Referral Code Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Your Referral Code</p>
                <p className="text-3xl font-bold tracking-widest text-primary">{referralCode || "..."}</p>
              </div>
              <Button onClick={copyCode} variant="outline" className="gap-2">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy Code"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
              <p className="text-2xl font-bold text-foreground">{teamMembers.length}</p>
              <p className="text-xs text-muted-foreground">Total Members</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
              <p className="text-2xl font-bold text-foreground">{totalCommissions.toLocaleString()} RWF</p>
              <p className="text-xs text-muted-foreground">Total Earned</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold text-primary">{creditedCommissions.toLocaleString()} RWF</p>
              <p className="text-xs text-muted-foreground">Credited</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
              <p className="text-2xl font-bold text-muted-foreground">{pendingCommissions.toLocaleString()} RWF</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
        </div>

        {/* Commission Structure */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Commission Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-muted/50">
                <Badge variant="default" className="mb-2">Tier 1</Badge>
                <p className="text-2xl font-bold text-foreground">10%</p>
                <p className="text-xs text-muted-foreground">Direct referrals</p>
                <p className="text-sm font-medium mt-1">{tier1Count} members</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <Badge variant="secondary" className="mb-2">Tier 2</Badge>
                <p className="text-2xl font-bold text-foreground">5%</p>
                <p className="text-xs text-muted-foreground">Referrals' referrals</p>
                <p className="text-sm font-medium mt-1">{tier2Count} members</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <Badge variant="outline" className="mb-2">Tier 3</Badge>
                <p className="text-2xl font-bold text-foreground">1%</p>
                <p className="text-xs text-muted-foreground">Extended network</p>
                <p className="text-sm font-medium mt-1">{tier3Count} members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs: Members & Commissions */}
        <Tabs defaultValue="members">
          <TabsList className="w-full">
            <TabsTrigger value="members" className="flex-1">Team Members</TabsTrigger>
            <TabsTrigger value="commissions" className="flex-1">Commissions</TabsTrigger>
          </TabsList>
          <TabsContent value="members">
            <Card>
              <CardContent className="p-4">
                {teamMembers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No team members yet. Share your referral code to start earning!</p>
                ) : (
                  <div className="space-y-3">
                    {teamMembers.map((m) => (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div>
                          <p className="text-sm font-medium text-foreground">Member #{m.referred_id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">Joined {new Date(m.created_at).toLocaleDateString()}</p>
                        </div>
                        <Badge variant={m.tier === 1 ? "default" : m.tier === 2 ? "secondary" : "outline"}>
                          Tier {m.tier}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="commissions">
            <Card>
              <CardContent className="p-4">
                {commissions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No commissions yet. Earn when your team members make purchases!</p>
                ) : (
                  <div className="space-y-3">
                    {commissions.map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div>
                          <p className="text-sm font-medium text-foreground">{Number(c.amount).toLocaleString()} RWF</p>
                          <p className="text-xs text-muted-foreground">Tier {c.tier} · {(c.rate * 100)}% · {new Date(c.created_at).toLocaleDateString()}</p>
                        </div>
                        <Badge variant={c.status === "credited" ? "default" : "secondary"}>
                          {c.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default TeamPage;
