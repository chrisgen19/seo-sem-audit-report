import { statusBadgeClass } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Check {
  name: string;
  status: string;
  finding: string;
  recommendation: string;
}

interface ChecksTableProps {
  checks: Check[];
}

export function ChecksTable({ checks }: ChecksTableProps) {
  if (!checks.length) return <p className="text-gray-400 text-sm">No checks available.</p>;

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-3 font-semibold text-gray-700 w-48">Check</th>
            <th className="text-center px-4 py-3 font-semibold text-gray-700 w-20">Status</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Finding &amp; Recommendation</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {checks.map((check, i) => (
            <tr key={i} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-900 align-top">{check.name}</td>
              <td className="px-4 py-3 text-center align-top">
                <span
                  className={cn(
                    "inline-block px-2 py-0.5 rounded text-xs font-bold",
                    statusBadgeClass(check.status)
                  )}
                >
                  {check.status}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-700 align-top">
                <p>{check.finding}</p>
                {check.recommendation && (
                  <p className="mt-1 text-gray-500 text-xs">
                    <span className="font-semibold text-gray-700">Rec: </span>
                    {check.recommendation}
                  </p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
