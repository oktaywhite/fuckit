import fs from "fs";
import path from "path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default function RulesPage() {
  const filePath = path.join(process.cwd(), "KURALLAR.md");
  let content = "Kurallar dosyası bulunamadı.";
  
  try {
    if (fs.existsSync(filePath)) {
      content = fs.readFileSync(filePath, "utf8");
    }
  } catch (error) {
    console.error("KURALLAR.md okunamadı:", error);
  }

  return (
    <div className="container max-w-4xl py-12 px-4 md:px-8 mx-auto animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-8 border-b pb-4 border-border/50">
        <div className="bg-primary/10 p-3 rounded-xl border border-primary/20">
          <ShieldAlert className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl font-black tracking-tight">Kurallar</h1>
          <p className="text-muted-foreground mt-1 font-medium">Lütfen maçlara katılmadan önce kuralları okuyun.</p>
        </div>
      </div>

      <div className="bg-card/50 p-8 rounded-xl border border-border/50 backdrop-blur prose prose-invert prose-primary max-w-none 
        prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:text-primary/90 
        prose-h3:text-xl prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground 
        prose-strong:text-foreground prose-strong:font-bold prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 
        prose-blockquote:p-4 prose-blockquote:rounded-r-lg prose-blockquote:italic prose-blockquote:text-muted-foreground/90">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
