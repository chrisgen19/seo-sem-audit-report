interface QuickWin {
  rank: number;
  action: string;
  impact: string;
  effort: string;
}

function impactColor(impact: string) {
  const l = impact.toLowerCase();
  if (l.startsWith("high")) return "text-green-700 bg-green-50";
  if (l.startsWith("medium")) return "text-amber-700 bg-amber-50";
  return "text-gray-600 bg-gray-50";
}

function effortColor(effort: string) {
  const l = effort.toLowerCase();
  if (l.startsWith("low")) return "text-green-700 bg-green-50";
  if (l.startsWith("medium")) return "text-amber-700 bg-amber-50";
  return "text-red-700 bg-red-50";
}

interface QuickWinsTableProps {
  wins: QuickWin[];
}

export function QuickWinsTable({ wins }: QuickWinsTableProps) {
  if (!wins.length) return <p className="text-gray-400 text-sm">No quick wins listed.</p>;

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-center px-4 py-3 font-semibold text-gray-700 w-10">#</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Action</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700 w-40">Impact</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700 w-40">Effort</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {wins.map((win, i) => (
            <tr key={i} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-center font-bold text-gray-400">{win.rank}</td>
              <td className="px-4 py-3 font-medium text-gray-900">{win.action}</td>
              <td className="px-4 py-3">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${impactColor(win.impact)}`}>
                  {win.impact}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${effortColor(win.effort)}`}>
                  {win.effort}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
