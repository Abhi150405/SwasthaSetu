import React from "react";

const Placeholder: React.FC<{ title: string; description?: string }> = ({ title, description }) => {
  return (
    <div className="mx-auto max-w-3xl py-10">
      <div className="rounded-lg border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-muted-foreground">{description || "This section will be implemented next. Use the sidebar to explore other modules or continue prompting to fill this page."}</p>
      </div>
    </div>
  );
};

export default Placeholder;
