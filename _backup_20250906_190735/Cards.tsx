
export function KPI({label, value, suffix=""}:{label:string; value:number|string; suffix?:string}) {
  return (
    <div className="rounded-2xl bg-neutral-900 border border-neutral-700 p-4">
      <div className="text-neutral-400 text-sm">{label}</div>
      <div className="text-neutral-100 text-2xl font-semibold">{typeof value==="number"? format(value): value}{suffix}</div>
    </div>
  );
}
function format(v:number){ if (Math.abs(v)>=1000) return v.toFixed(0); if (v>=100) return v.toFixed(1); if (v>=10) return v.toFixed(1); if (v>=1) return v.toFixed(2); return v.toFixed(3); }
export function Table({rows, cols}:{rows:any[]; cols:{key:string; label:string; fmt?:(v:any,r?:any)=>string}[]}) {
  return (
    <div className="rounded-2xl bg-neutral-900 border border-neutral-700 p-4 overflow-auto">
      <table className="w-full text-sm">
        <thead className="text-neutral-300">
          <tr>{cols.map(c=><th key={c.key} className="text-left py-3 pr-4 font-semibold">{c.label}</th>)}</tr>
        </thead>
        <tbody className="text-neutral-100">
          {rows.map((r,i)=>(<tr key={i} className="border-t border-neutral-800 hover:bg-neutral-800/30">
            {cols.map(c=> {
              const value = c.fmt? c.fmt(r[c.key], r) : String(r[c.key]??"");
              const isEmpty = value === "" || value === "-";
              return (
                <td key={c.key} className={`py-3 pr-4 ${isEmpty ? 'text-neutral-500 italic' : ''}`}>
                  {isEmpty ? '-' : value}
                </td>
              );
            })}
          </tr>))}
        </tbody>
      </table>
    </div>
  );
}
