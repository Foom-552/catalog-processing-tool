import { useQuery } from '@tanstack/react-query';
import { fetchCxmlVersion } from '../../services/api';
import { Wifi, WifiOff } from 'lucide-react';

export function CxmlVersionBadge() {
  const { data, isLoading } = useQuery({
    queryKey: ['cxml-version'],
    queryFn: fetchCxmlVersion,
    staleTime: 60 * 60 * 1000,
  });

  if (isLoading) return <span className="text-xs text-gray-400">Checking cXML version...</span>;
  if (!data) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
      {data.source === 'live'
        ? <Wifi className="w-3.5 h-3.5 text-green-600" />
        : <WifiOff className="w-3.5 h-3.5 text-amber-500" />
      }
      cXML v{data.version}
      <span className="text-gray-400">
        {data.source === 'live' ? '— live' : '— fallback'}
      </span>
    </div>
  );
}
