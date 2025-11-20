import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface VirtualTableProps<T> {
  data: T[];
  columns: Array<{
    key: string;
    title: string;
    width?: string | number;
    className?: string;
    render?: (item: T, index: number) => React.ReactNode;
  }>;
  rowHeight?: number;
  maxHeight?: string | number;
  onRowClick?: (item: T) => void;
  rowClassName?: (item: T) => string;
}

export function VirtualTable<T extends { id: number | string }>({
  data,
  columns,
  rowHeight = 65,
  maxHeight = '600px',
  onRowClick,
  rowClassName,
}: VirtualTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateHeight = () => {
      setContainerHeight(container.clientHeight);
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const { visibleData, offsetY, totalHeight } = useMemo(() => {
    const totalHeight = data.length * rowHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 5);
    const endIndex = Math.min(
      data.length,
      Math.ceil((scrollTop + containerHeight) / rowHeight) + 5
    );
    const visibleData = data.slice(startIndex, endIndex);
    const offsetY = startIndex * rowHeight;

    return { visibleData, offsetY, totalHeight };
  }, [data, scrollTop, containerHeight, rowHeight]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="overflow-auto"
      style={{ maxHeight }}
    >
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
          <TableRow className="hover:bg-muted/95">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={col.className}
                style={{ width: col.width }}
              >
                {col.title}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={columns.length} className="p-0 border-0">
              <div style={{ height: totalHeight, position: 'relative' }}>
                <div
                  style={{
                    transform: `translateY(${offsetY}px)`,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                  }}
                >
                  <table className="w-full">
                    <tbody>
                      {visibleData.map((item, index) => (
                        <tr
                          key={item.id}
                          onClick={() => onRowClick?.(item)}
                          className={`border-b transition-colors ${
                            onRowClick ? 'cursor-pointer hover:bg-muted/30' : ''
                          } ${rowClassName?.(item) || ''}`}
                          style={{ height: rowHeight }}
                        >
                          {columns.map((col) => (
                            <td
                              key={col.key}
                              className={`px-4 py-2 ${col.className || ''}`}
                              style={{ width: col.width }}
                            >
                              {col.render
                                ? col.render(item, index)
                                : (item as any)[col.key]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
