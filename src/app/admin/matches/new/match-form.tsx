"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createMatchAction } from "../actions";
import { toast } from "sonner";
import { Plus, Trash2, Shuffle } from "lucide-react";
import { CHAMPIONS } from "@/lib/constants";

type PlayerSummary = { id: string; nickname: string; currentMmr: number };

type ParticipantInput = {
  playerId: string;
  champion: string;
  kills: string;
  deaths: string;
  assists: string;
};

export default function MatchForm({ players }: { players: PlayerSummary[] }) {
  const [winner, setWinner] = useState<"BLUE" | "RED">("BLUE");
  const [blueTeam, setBlueTeam] = useState<ParticipantInput[]>([
    { playerId: "", champion: "", kills: "0", deaths: "0", assists: "0" }
  ]);
  const [redTeam, setRedTeam] = useState<ParticipantInput[]>([
    { playerId: "", champion: "", kills: "0", deaths: "0", assists: "0" }
  ]);
  const [pending, setPending] = useState(false);
  const [isRandomDialogOpen, setIsRandomDialogOpen] = useState(false);
  const [selectedForRandom, setSelectedForRandom] = useState<string[]>([]);

  const handleAddBlue = () => {
    if (blueTeam.length >= 5) return;
    setBlueTeam([...blueTeam, { playerId: "", champion: "", kills: "0", deaths: "0", assists: "0" }]);
  };

  const handleAddRed = () => {
    if (redTeam.length >= 5) return;
    setRedTeam([...redTeam, { playerId: "", champion: "", kills: "0", deaths: "0", assists: "0" }]);
  };

  const handleRemoveBlue = (index: number) => {
    setBlueTeam(blueTeam.filter((_, i) => i !== index));
  };

  const handleRemoveRed = (index: number) => {
    setRedTeam(redTeam.filter((_, i) => i !== index));
  };

  const handleConfirmRandomize = () => {
    if (selectedForRandom.length < 2) {
      toast.error("Karma dağıtım için en az 2 oyuncu seçmelisiniz.");
      return;
    }

    const shuffled = [...selectedForRandom];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const half = Math.ceil(shuffled.length / 2);
    const newBlueIds = shuffled.slice(0, half);
    const newRedIds = shuffled.slice(half);

    const newBlue = newBlueIds.map(id => ({ playerId: id, champion: "", kills: "0", deaths: "0", assists: "0" }));
    const newRed = newRedIds.map(id => ({ playerId: id, champion: "", kills: "0", deaths: "0", assists: "0" }));

    if (newBlue.length === 0) newBlue.push({ playerId: "", champion: "", kills: "0", deaths: "0", assists: "0" });
    if (newRed.length === 0) newRed.push({ playerId: "", champion: "", kills: "0", deaths: "0", assists: "0" });

    setBlueTeam(newBlue);
    setRedTeam(newRed);
    
    setIsRandomDialogOpen(false);
    setSelectedForRandom([]);
    toast.success("Takımlar rastgele dağıtıldı!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basit validasyon
    if (blueTeam.some(p => !p.playerId) || redTeam.some(p => !p.playerId)) {
      toast.error("Lütfen tüm satırlarda bir oyuncu seçin.");
      return;
    }

    setPending(true);

    const payload = {
      winner,
      blueTeam,
      redTeam
    };

    const formData = new FormData();
    formData.append("payload", JSON.stringify(payload));

    const res = await createMatchAction(formData);
    if (res?.error) {
      toast.error(res.error);
      setPending(false);
    }
  };

  const availablePlayers = players;

  const renderTeam = (team: ParticipantInput[], setTeam: any, teamColor: "BLUE" | "RED") => (
    <div className={`space-y-4 p-4 rounded-xl border ${teamColor === "BLUE" ? "bg-blue-500/5 border-blue-500/20" : "bg-red-500/5 border-red-500/20"}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`font-bold ${teamColor === "BLUE" ? "text-blue-400" : "text-red-400"}`}>
          {teamColor === "BLUE" ? "Mavi Takım" : "Kırmızı Takım"}
        </h3>
        <Button type="button" variant="outline" size="sm" onClick={teamColor === "BLUE" ? handleAddBlue : handleAddRed} disabled={team.length >= 5}>
          <Plus className="w-4 h-4 mr-1" /> Ekle
        </Button>
      </div>

      {team.map((participant, index) => (
        <div key={index} className="flex flex-wrap gap-2 items-end border-b border-border/50 pb-4 last:border-0 last:pb-0">
          <div className="flex-1 min-w-[200px] space-y-1">
            <Label className="text-xs">Oyuncu</Label>
            <Select 
              value={participant.playerId} 
              onValueChange={(val) => {
                const newTeam = [...team];
                newTeam[index].playerId = val as string;
                setTeam(newTeam);
              }}
            >
              <SelectTrigger className="bg-background/80">
                <SelectValue placeholder="Oyuncu seç">
                  {availablePlayers.find(p => p.id === participant.playerId) 
                    ? `${availablePlayers.find(p => p.id === participant.playerId)?.nickname} (MMR: ${availablePlayers.find(p => p.id === participant.playerId)?.currentMmr})`
                    : "Oyuncu seç"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {availablePlayers.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.nickname} (MMR: {p.currentMmr})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-[140px] space-y-1">
            <Label className="text-xs">Şampiyon</Label>
            <Select 
              value={participant.champion} 
              onValueChange={(val) => {
                const newTeam = [...team];
                newTeam[index].champion = val as string;
                setTeam(newTeam);
              }}
            >
              <SelectTrigger className="bg-background/80">
                <SelectValue placeholder="Seç">
                  {participant.champion || "Seç"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CHAMPIONS.map(champ => (
                  <SelectItem key={champ} value={champ}>{champ}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-[60px] space-y-1">
            <Label className="text-xs">K</Label>
            <Input 
              type="number" min="0" 
              value={participant.kills}
              onChange={(e) => {
                const newTeam = [...team];
                newTeam[index].kills = e.target.value;
                setTeam(newTeam);
              }}
              className="bg-background/80 px-2"
            />
          </div>
          <div className="w-[60px] space-y-1">
            <Label className="text-xs">D</Label>
            <Input 
              type="number" min="0" 
              value={participant.deaths}
              onChange={(e) => {
                const newTeam = [...team];
                newTeam[index].deaths = e.target.value;
                setTeam(newTeam);
              }}
              className="bg-background/80 px-2"
            />
          </div>
          <div className="w-[60px] space-y-1">
            <Label className="text-xs">A</Label>
            <Input 
              type="number" min="0" 
              value={participant.assists}
              onChange={(e) => {
                const newTeam = [...team];
                newTeam[index].assists = e.target.value;
                setTeam(newTeam);
              }}
              className="bg-background/80 px-2"
            />
          </div>
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            className="text-red-400 hover:text-red-500 hover:bg-red-500/10 mb-[2px]"
            onClick={() => teamColor === "BLUE" ? handleRemoveBlue(index) : handleRemoveRed(index)}
            disabled={team.length <= 1}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  );

  return (
    <Card className="bg-card/50 backdrop-blur">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div className="flex flex-col space-y-2">
              <Label className="text-lg font-semibold">Kazanan Takım</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={winner === "BLUE" ? "default" : "outline"}
                  className={winner === "BLUE" ? "bg-blue-600 hover:bg-blue-700 w-32" : "w-32"}
                  onClick={() => setWinner("BLUE")}
                >
                  Mavi Takım
                </Button>
                <Button
                  type="button"
                  variant={winner === "RED" ? "default" : "outline"}
                  className={winner === "RED" ? "bg-red-600 hover:bg-red-700 w-32" : "w-32"}
                  onClick={() => setWinner("RED")}
                >
                  Kırmızı Takım
                </Button>
              </div>
            </div>
            
            <Dialog open={isRandomDialogOpen} onOpenChange={setIsRandomDialogOpen}>
              <DialogTrigger render={<Button type="button" variant="secondary" className="gap-2" />}>
                <Shuffle className="w-4 h-4" /> Takımları Karma Dağıt
              </DialogTrigger>
              <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col bg-background/90 backdrop-blur-xl border-border/50">
                <DialogHeader>
                  <DialogTitle>Karma Takım Dağıtımı</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto py-4 space-y-2 px-1 custom-scrollbar">
                  {players.map(p => {
                    const isSelected = selectedForRandom.includes(p.id);
                    return (
                      <div 
                        key={p.id} 
                        onClick={() => {
                          if (isSelected) {
                            setSelectedForRandom(prev => prev.filter(id => id !== p.id));
                          } else {
                            setSelectedForRandom(prev => [...prev, p.id]);
                          }
                        }}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected ? "bg-primary/10 border-primary shadow-sm" : "bg-card/40 hover:bg-muted/50 border-border/50"
                        }`}
                      >
                        <span className={`font-semibold ${isSelected ? "text-primary" : ""}`}>{p.nickname}</span>
                        <span className="text-sm text-muted-foreground font-mono">MMR: {p.currentMmr}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-between items-center mt-2 pt-4 border-t border-border/50">
                  <span className="text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">{selectedForRandom.length} oyuncu seçildi</span>
                  <Button type="button" onClick={handleConfirmRandomize}>Dağıt</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {renderTeam(blueTeam, setBlueTeam, "BLUE")}
            {renderTeam(redTeam, setRedTeam, "RED")}
          </div>

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={pending}>
              {pending ? "Maç Kaydediliyor..." : "Maçı Kaydet"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
