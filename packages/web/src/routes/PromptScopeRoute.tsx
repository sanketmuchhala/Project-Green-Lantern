import React from "react";
const Dashboard = React.lazy(()=>import("../promptops/Dashboard"));
export default function PromptScopeRoute(){
  const enabled = (localStorage.getItem("PROMPTOPS_ENABLED")||"true") !== "false";
  if(!enabled) return null;
  return (<React.Suspense fallback={<div className="p-6 text-neutral-300">Loading</div>}><Dashboard/></React.Suspense>);
}
